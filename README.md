# Claude AI Assistant for Grafana

A Grafana app plugin that brings Claude (Anthropic) directly into your Grafana instance — no Grafana Cloud subscription required. Use your own Anthropic API key to query data, create dashboards, and explore metrics using natural language.

## Features

- **Natural language queries** — ask questions about your data in plain English
- **Dashboard creation** — describe a dashboard and Claude builds the JSON definition for you
- **Dashboard inspection** — ask Claude to explain what a dashboard shows
- **Datasource queries** — query any Grafana datasource (Prometheus, Loki, PostgreSQL, InfluxDB, etc.)
- **Panel context** — right-click any panel to ask Claude about it, with full query and time range context
- **Explore integration** — ask Claude about the current Explore query from the toolbar
- **Command palette** — open the chat from anywhere with `Ctrl+K`
- **Top bar button** — persistent access button next to the Grafana help icon
- **Bring your own key** — uses your Anthropic API key, stored securely, never exposed to the browser
- **Model selection** — choose between Claude Sonnet, Opus, or Haiku

## Requirements

- Grafana ≥ 10.3.0
- An [Anthropic API key](https://console.anthropic.com)

## Installation

### From Grafana Catalog (recommended)

Search for **"Claude AI Assistant"** in **Administration → Plugins** or install via CLI:

```bash
grafana-cli plugins install grafana-claude-assistant
```

### Manual installation

Download the latest release from [GitHub Releases](https://github.com/marcoagpegoraro/grafana-claude-assistant/releases), extract it to your Grafana plugins directory, and restart Grafana.

```bash
unzip grafana-claude-assistant-1.0.0.zip -d /var/lib/grafana/plugins/
systemctl restart grafana-server
```

## Configuration

### Via the UI

1. Go to **Administration → Plugins → Claude AI Assistant**
2. Click **Enable**
3. Open the **Configuration** tab
4. Enter your [Anthropic API key](https://console.anthropic.com/settings/keys)
5. Select your preferred Claude model
6. Click **Save settings**

### Via provisioning

```yaml
# /etc/grafana/provisioning/plugins/apps.yaml
apiVersion: 1

apps:
  - type: grafana-claude-assistant
    org_id: 1
    disabled: false
    jsonData:
      model: claude-sonnet-4-6
    secureJsonData:
      # Use an environment variable — never commit your API key
      anthropicApiKey: ${ANTHROPIC_API_KEY}
```

## Usage

### Chat page

Navigate to **Claude AI Assistant** in the left sidebar. Type your question and press **Enter**.

**Example prompts:**
- `List my datasources`
- `Show me all dashboards`
- `Create a dashboard showing HTTP request rate from Prometheus`
- `Query the orders table in PostgreSQL and show me the last 10 rows`
- `Explain what the "API Latency" dashboard shows`

### Panel context menu

Right-click any panel on a dashboard and select **"Ask Claude about this panel"**. Claude receives the panel title, queries, and time range automatically.

### Explore

Click the **Ask Claude** button in the Explore toolbar to get help with your current query.

### Top bar

Click the **AI icon** in the top navigation bar to open the chat drawer from any page.

## How it works

All Anthropic API calls happen in the plugin's Go backend — your API key is stored encrypted by Grafana and never sent to the browser. The backend runs an agentic loop where Claude can call Grafana's API multiple times (list dashboards, run queries, create/update dashboards) before streaming the final response.

```
Browser ──POST──> Plugin Backend (Go)
                       │
                       ├──> Anthropic API (Claude + tool calls)
                       │        └──> Grafana HTTP API
                       │
                 SSE stream (text tokens + tool events)
                       │
Browser <──SSE──────────
```

## Privacy

- API key is encrypted at rest by Grafana and never returned to the browser
- Conversation history lives only in browser memory (not persisted server-side)
- Grafana API calls are made with a provisioned service account or forwarded session token

## Development

```bash
git clone https://github.com/marcoagpegoraro/grafana-claude-assistant
cd grafana-claude-assistant

npm install
npm run dev   # frontend watch mode

# Backend (Linux ARM64 for Apple Silicon Docker)
CGO_ENABLED=0 GOOS=linux GOARCH=arm64 go build \
  -o dist/gpx_claude_ai_assistant_linux_arm64 ./pkg/main.go

docker compose up  # Grafana at http://localhost:3000
```

## Contributing

Pull requests are welcome. Please open an issue first to discuss what you'd like to change.

## License

[Apache 2.0](LICENSE)
