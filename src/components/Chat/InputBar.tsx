import React, { useState, KeyboardEvent } from 'react';
import { css } from '@emotion/css';
import { useStyles2, IconButton, TextArea } from '@grafana/ui';
import { GrafanaTheme2 } from '@grafana/data';

interface Props {
  onSend: (text: string) => void;
  disabled: boolean;
}

export function InputBar({ onSend, disabled }: Props) {
  const styles = useStyles2(getStyles);
  const [value, setValue] = useState('');

  const handleSend = () => {
    const text = value.trim();
    if (text && !disabled) {
      onSend(text);
      setValue('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.inputRow}>
        <TextArea
          className={styles.textarea}
          value={value}
          onChange={(e) => setValue(e.currentTarget.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about your data, create dashboards, query datasources… (Enter to send, Shift+Enter for newline)"
          disabled={disabled}
          rows={2}
        />
        <IconButton
          name={disabled ? 'fa fa-spinner' : 'arrow-right'}
          tooltip={disabled ? 'Thinking…' : 'Send (Enter)'}
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          size="xl"
          className={styles.sendButton}
        />
      </div>
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    padding: ${theme.spacing(1, 2, 2)};
    border-top: 1px solid ${theme.colors.border.weak};
    background: ${theme.colors.background.primary};
  `,
  inputRow: css`
    display: flex;
    gap: ${theme.spacing(1)};
    align-items: flex-end;
  `,
  textarea: css`
    flex: 1;
    resize: none;
    max-height: 120px;
    overflow-y: auto;
  `,
  sendButton: css`
    flex-shrink: 0;
    margin-bottom: 2px;
  `,
});
