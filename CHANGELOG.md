# Changelog

## 1.0.0 (2024-04-20)

### Features

- Chat interface accessible from the Grafana sidebar, top bar drawer, and command palette
- Natural language queries against any configured Grafana datasource
- Dashboard listing, inspection, creation, and modification via Claude tool use
- Panel context menu integration — right-click any panel to ask Claude about it
- Explore toolbar button for query assistance
- Secure API key storage using Grafana's encrypted secret fields
- Configurable model selection: Claude Sonnet 4.6, Opus 4.7, Haiku 4.5
- Server-sent events (SSE) streaming for real-time token output
- Agentic tool-use loop with up to 10 iterations per request
- Markdown rendering in assistant messages
- Collapsible tool call display showing inputs and results
