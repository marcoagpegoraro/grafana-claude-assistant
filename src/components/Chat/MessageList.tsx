import React, { useEffect, useRef } from 'react';
import { css } from '@emotion/css';
import { useStyles2 } from '@grafana/ui';
import { GrafanaTheme2 } from '@grafana/data';
import { MessageBubble } from './MessageBubble';
import { UIMessage } from './types';

const EXAMPLES = [
  'List my datasources',
  'Show me all dashboards',
  'Create a time series dashboard for CPU and memory usage',
  'Query the last 10 rows from my PostgreSQL datasource',
];

interface Props {
  messages: UIMessage[];
  onExampleClick?: (text: string) => void;
}

export function MessageList({ messages, onExampleClick }: Props) {
  const styles = useStyles2(getStyles);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className={styles.container}>
      {messages.length === 0 && (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>✦</div>
          <p className={styles.emptyTitle}>Claude AI Assistant</p>
          <p className={styles.emptySubtitle}>
            Ask about your data, create dashboards, or explore your Grafana instance.
          </p>
          <div className={styles.examples}>
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                className={styles.exampleBtn}
                onClick={() => onExampleClick?.(ex)}
                type="button"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      )}
      {messages.map((msg, i) => (
        <MessageBubble key={i} message={msg} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    flex: 1;
    overflow-y: auto;
    padding: ${theme.spacing(2)};
    display: flex;
    flex-direction: column;
  `,
  empty: css`
    margin: auto;
    text-align: center;
    max-width: 420px;
    padding: ${theme.spacing(2)};
  `,
  emptyIcon: css`
    font-size: 32px;
    margin-bottom: ${theme.spacing(1)};
    color: ${theme.colors.primary.text};
  `,
  emptyTitle: css`
    font-size: ${theme.typography.h5.fontSize};
    font-weight: ${theme.typography.fontWeightMedium};
    color: ${theme.colors.text.primary};
    margin: 0 0 ${theme.spacing(0.5)};
  `,
  emptySubtitle: css`
    color: ${theme.colors.text.secondary};
    font-size: ${theme.typography.body.fontSize};
    margin: 0 0 ${theme.spacing(2)};
  `,
  examples: css`
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(0.75)};
  `,
  exampleBtn: css`
    padding: ${theme.spacing(0.75, 1.5)};
    background: ${theme.colors.background.secondary};
    border: 1px solid ${theme.colors.border.weak};
    border-radius: ${theme.shape.radius.default};
    color: ${theme.colors.text.primary};
    font-size: ${theme.typography.body.fontSize};
    cursor: pointer;
    text-align: left;
    transition: background 0.15s ease;
    &:hover {
      background: ${theme.colors.action.hover};
      border-color: ${theme.colors.border.medium};
    }
  `,
});
