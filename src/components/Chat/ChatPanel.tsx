import React from 'react';
import { css } from '@emotion/css';
import { useStyles2, Alert, Button, LinkButton } from '@grafana/ui';
import { GrafanaTheme2 } from '@grafana/data';
import { PLUGIN_ID } from '../../constants';
import { MessageList } from './MessageList';
import { InputBar } from './InputBar';
import { useChatStream } from './useChatStream';

interface Props {
  initialMessage?: string;
}

const CONFIG_URL = `/plugins/${PLUGIN_ID}?tab=configuration`;

export function ChatPanel({ initialMessage }: Props) {
  const styles = useStyles2(getStyles);
  const { messages, streaming, error, sendMessage, clearMessages } = useChatStream(initialMessage);

  const isUnconfigured =
    error?.toLowerCase().includes('api key not configured') ||
    error?.toLowerCase().includes('401');

  return (
    <div className={styles.container}>
      {isUnconfigured ? (
        <div className={styles.setupBanner}>
          <Alert title="Anthropic API key not configured" severity="warning">
            <p>Add your Anthropic API key to start using Claude AI.</p>
            <LinkButton href={CONFIG_URL} variant="primary" size="sm">
              Open configuration
            </LinkButton>
          </Alert>
        </div>
      ) : error ? (
        <Alert title="Error" severity="error" onRemove={clearMessages} className={styles.alert}>
          {error}
        </Alert>
      ) : null}

      {messages.length > 0 && (
        <div className={styles.toolbar}>
          <Button variant="secondary" size="sm" onClick={clearMessages} disabled={streaming}>
            New conversation
          </Button>
        </div>
      )}

      <MessageList messages={messages} onExampleClick={sendMessage} />
      <InputBar onSend={sendMessage} disabled={streaming} />
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    display: flex;
    flex-direction: column;
    height: 100%;
    background: ${theme.colors.background.primary};
    overflow: hidden;
  `,
  setupBanner: css`
    padding: ${theme.spacing(2)};
    flex-shrink: 0;
  `,
  alert: css`
    margin: ${theme.spacing(1)};
    flex-shrink: 0;
  `,
  toolbar: css`
    display: flex;
    justify-content: flex-end;
    padding: ${theme.spacing(0.5, 1)};
    border-bottom: 1px solid ${theme.colors.border.weak};
    flex-shrink: 0;
  `,
});
