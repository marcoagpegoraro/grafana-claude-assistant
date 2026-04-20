import React, { useState, useEffect, useCallback } from 'react';
import { Drawer } from '@grafana/ui';
import { ChatPanel } from './Chat/ChatPanel';

export const CLAUDE_OPEN_EVENT = 'claude-open-chat';

export interface ClaudeOpenEvent {
  initialMessage?: string;
}

export function GlobalChatDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [initialMessage, setInitialMessage] = useState<string | undefined>();
  const [sessionKey, setSessionKey] = useState(0);

  const openWithContext = useCallback(({ initialMessage: msg }: ClaudeOpenEvent = {}) => {
    if (msg) {
      // New context = new conversation session
      setInitialMessage(msg);
      setSessionKey((k) => k + 1);
    }
    setIsOpen(true);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => openWithContext((e as CustomEvent<ClaudeOpenEvent>).detail ?? {});
    window.addEventListener(CLAUDE_OPEN_EVENT, handler);
    return () => window.removeEventListener(CLAUDE_OPEN_EVENT, handler);
  }, [openWithContext]);

  if (!isOpen) {
    return null;
  }

  return (
    <Drawer
      title="Claude AI Assistant"
      onClose={() => setIsOpen(false)}
      width="520px"
      expandable
    >
      <ChatPanel key={sessionKey} initialMessage={initialMessage} />
    </Drawer>
  );
}

export function openClaudeChat(detail: ClaudeOpenEvent = {}) {
  window.dispatchEvent(new CustomEvent<ClaudeOpenEvent>(CLAUDE_OPEN_EVENT, { detail }));
}
