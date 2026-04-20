import { useState, useCallback, useEffect, useRef } from 'react';
import { PLUGIN_ID } from '../../constants';
import { parseSSEChunk } from '../../utils/streamParser';
import { UIMessage, ToolCallItem } from './types';

const RESOURCE_URL = `/api/plugins/${PLUGIN_ID}/resources/chat`;

interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string | Array<{ type: string; [key: string]: unknown }>;
}

export function useChatStream(initialMessage?: string) {
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<AnthropicMessage[]>([]);
  const initialSent = useRef(false);

  // Auto-send initialMessage once on mount (e.g. from panel context)
  useEffect(() => {
    if (initialMessage && !initialSent.current) {
      initialSent.current = true;
      sendMessage(initialMessage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendMessage = useCallback(
    async (userText: string) => {
      if (streaming || !userText.trim()) {
        return;
      }

      setError(null);

      const userMessage: UIMessage = { role: 'user', content: userText };
      const assistantMessage: UIMessage = {
        role: 'assistant',
        content: '',
        toolCalls: [],
        streaming: true,
      };

      setMessages((prev) => [...prev, userMessage, assistantMessage]);

      const newHistory: AnthropicMessage[] = [
        ...history,
        { role: 'user', content: userText },
      ];

      setStreaming(true);

      try {
        const response = await fetch(RESOURCE_URL, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: newHistory }),
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || `HTTP ${response.status}`);
        }

        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let finalAssistantText = '';
        const toolCalls: ToolCallItem[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const events = parseSSEChunk(buffer);
          const lastDoubleNewline = buffer.lastIndexOf('\n\n');
          buffer = lastDoubleNewline >= 0 ? buffer.slice(lastDoubleNewline + 2) : buffer;

          for (const evt of events) {
            switch (evt.event) {
              case 'text_delta': {
                const text = (evt.data.text as string) || '';
                finalAssistantText += text;
                setMessages((prev) => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last?.role === 'assistant') {
                    updated[updated.length - 1] = { ...last, content: last.content + text };
                  }
                  return updated;
                });
                break;
              }
              case 'tool_call': {
                const item: ToolCallItem = {
                  id: evt.data.id as string,
                  name: evt.data.name as string,
                  input: evt.data.input,
                  status: 'running',
                };
                toolCalls.push(item);
                setMessages((prev) => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last?.role === 'assistant') {
                    updated[updated.length - 1] = {
                      ...last,
                      toolCalls: [...(last.toolCalls || []), item],
                    };
                  }
                  return updated;
                });
                break;
              }
              case 'tool_result': {
                const id = evt.data.tool_use_id as string;
                const result = evt.data.content as string;
                const isError = evt.data.is_error as boolean;
                const tc = toolCalls.find((t) => t.id === id);
                if (tc) {
                  tc.result = result;
                  tc.isError = isError;
                  tc.status = isError ? 'error' : 'done';
                }
                setMessages((prev) => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last?.role === 'assistant') {
                    updated[updated.length - 1] = {
                      ...last,
                      toolCalls: (last.toolCalls || []).map((t) =>
                        t.id === id ? { ...t, result, isError, status: isError ? 'error' : 'done' } : t
                      ),
                    };
                  }
                  return updated;
                });
                break;
              }
              case 'done': {
                setMessages((prev) => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last?.role === 'assistant') {
                    updated[updated.length - 1] = { ...last, streaming: false };
                  }
                  return updated;
                });
                setHistory([...newHistory, { role: 'assistant', content: finalAssistantText }]);
                break;
              }
              case 'error': {
                const msg = (evt.data.message as string) || 'Unknown error';
                setError(msg);
                setMessages((prev) => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last?.role === 'assistant') {
                    updated[updated.length - 1] = { ...last, streaming: false };
                  }
                  return updated;
                });
                break;
              }
            }
          }
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last?.role === 'assistant') {
            updated[updated.length - 1] = { ...last, streaming: false };
          }
          return updated;
        });
      } finally {
        setStreaming(false);
      }
    },
    [streaming, history]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setHistory([]);
    setError(null);
    initialSent.current = false;
  }, []);

  return { messages, streaming, error, sendMessage, clearMessages };
}
