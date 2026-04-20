package plugin

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/anthropics/anthropic-sdk-go"
	"github.com/anthropics/anthropic-sdk-go/option"
	"github.com/grafana/grafana-plugin-sdk-go/backend"
)

const maxIterations = 10
const defaultModel = "claude-sonnet-4-6"

type chatRequest struct {
	Messages []anthropic.MessageParam `json:"messages"`
	Model    string                   `json:"model"`
}

func writeSSE(w http.ResponseWriter, event string, data any) {
	payload, _ := json.Marshal(data)
	fmt.Fprintf(w, "event: %s\ndata: %s\n\n", event, string(payload))
	if f, ok := w.(http.Flusher); ok {
		f.Flush()
	}
}

func (a *App) handleChat(w http.ResponseWriter, req *http.Request) {
	if req.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	ctx := req.Context()

	var chatReq chatRequest
	if err := json.NewDecoder(req.Body).Decode(&chatReq); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}
	if len(chatReq.Messages) == 0 {
		http.Error(w, "messages are required", http.StatusBadRequest)
		return
	}

	pluginCfg := backend.PluginConfigFromContext(ctx)
	apiKey := pluginCfg.AppInstanceSettings.DecryptedSecureJSONData["anthropicApiKey"]
	if apiKey == "" {
		http.Error(w, "Anthropic API key not configured. Please set it in the plugin configuration.", http.StatusUnauthorized)
		return
	}

	model := chatReq.Model
	if model == "" {
		var jsonData map[string]any
		if err := json.Unmarshal(pluginCfg.AppInstanceSettings.JSONData, &jsonData); err == nil {
			if m, ok := jsonData["model"].(string); ok && m != "" {
				model = m
			}
		}
	}
	if model == "" {
		model = defaultModel
	}

	gc, err := NewGrafanaClient(ctx, a.httpClient, req.Header)
	if err != nil {
		http.Error(w, "failed to create Grafana client: "+err.Error(), http.StatusInternalServerError)
		return
	}

	client := anthropic.NewClient(option.WithAPIKey(apiKey))

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("X-Accel-Buffering", "no")
	w.WriteHeader(http.StatusOK)
	if f, ok := w.(http.Flusher); ok {
		f.Flush()
	}

	messages := chatReq.Messages

	for i := 0; i < maxIterations; i++ {
		select {
		case <-ctx.Done():
			return
		default:
		}

		stream := client.Messages.NewStreaming(ctx, anthropic.MessageNewParams{
			Model:     anthropic.Model(model),
			MaxTokens: 8096,
			System: []anthropic.TextBlockParam{
				{Text: systemPrompt},
			},
			Messages: messages,
			Tools:    grafanaTools,
		})

		message := anthropic.Message{}
		for stream.Next() {
			select {
			case <-ctx.Done():
				return
			default:
			}

			event := stream.Current()
			if err := message.Accumulate(event); err != nil {
				writeSSE(w, "error", map[string]string{"message": "stream error: " + err.Error()})
				return
			}

			if e, ok := event.AsAny().(anthropic.ContentBlockDeltaEvent); ok {
				if delta, ok := e.Delta.AsAny().(anthropic.TextDelta); ok {
					writeSSE(w, "text_delta", map[string]string{"text": delta.Text})
				}
			}
		}

		if err := stream.Err(); err != nil {
			writeSSE(w, "error", map[string]string{"message": err.Error()})
			return
		}

		if message.StopReason != anthropic.StopReasonToolUse {
			writeSSE(w, "done", map[string]string{})
			return
		}

		// Execute tool calls
		toolResultBlocks := []anthropic.ContentBlockParamUnion{}
		for _, block := range message.Content {
			toolUse, ok := block.AsAny().(anthropic.ToolUseBlock)
			if !ok {
				continue
			}

			writeSSE(w, "tool_call", map[string]any{
				"id":    toolUse.ID,
				"name":  toolUse.Name,
				"input": json.RawMessage(toolUse.Input),
			})

			result, toolErr := executeTool(ctx, gc, toolUse.Name, toolUse.Input)
			isError := toolErr != nil
			if isError {
				result = "Error: " + toolErr.Error()
			}

			writeSSE(w, "tool_result", map[string]any{
				"tool_use_id": toolUse.ID,
				"content":     result,
				"is_error":    isError,
			})

			toolResultBlocks = append(toolResultBlocks, anthropic.NewToolResultBlock(toolUse.ID, result, isError))
		}

		// Append assistant turn and tool results to conversation
		messages = append(messages, message.ToParam())
		messages = append(messages, anthropic.NewUserMessage(toolResultBlocks...))
	}

	writeSSE(w, "error", map[string]string{"message": "Maximum tool-use iterations reached"})
}

const systemPrompt = `You are an AI assistant integrated into Grafana. You have access to tools to interact with this Grafana instance.

You can:
- List and explore datasources and dashboards
- Query data from any configured datasource
- Create new dashboards with panels
- Update existing dashboards

When creating dashboards, generate complete Grafana dashboard JSON with appropriate panel types (timeseries, stat, table, gauge, etc.), correct datasource references, and proper field configurations.

Always explain what you're doing when using tools. Be concise and helpful.`
