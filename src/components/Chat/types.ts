export interface ToolCallItem {
  id: string;
  name: string;
  input: unknown;
  result?: string;
  isError?: boolean;
  status: 'running' | 'done' | 'error';
}

export interface UIMessage {
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: ToolCallItem[];
  streaming?: boolean;
}
