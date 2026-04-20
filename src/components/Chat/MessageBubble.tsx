import React, { useState } from 'react';
import { css } from '@emotion/css';
import { useStyles2, IconButton } from '@grafana/ui';
import { GrafanaTheme2 } from '@grafana/data';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ToolCallDisplay } from './ToolCallDisplay';
import { UIMessage } from './types';

interface Props {
  message: UIMessage;
}

function CodeBlock({ children, className }: { children?: React.ReactNode; className?: string }) {
  const styles = useStyles2(getCodeStyles);
  const [copied, setCopied] = useState(false);
  const code = String(children).replace(/\n$/, '');
  const language = (className || '').replace('language-', '') || 'code';

  const copy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className={styles.block}>
      <div className={styles.header}>
        <span className={styles.lang}>{language}</span>
        <IconButton
          name={copied ? 'check' : 'copy'}
          tooltip={copied ? 'Copied!' : 'Copy'}
          size="sm"
          onClick={copy}
        />
      </div>
      <pre className={styles.pre}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function MessageBubble({ message }: Props) {
  const styles = useStyles2(getStyles);
  const isUser = message.role === 'user';

  return (
    <div className={isUser ? styles.userRow : styles.assistantRow}>
      <div className={isUser ? styles.userBubble : styles.assistantBubble}>
        {isUser ? (
          <span className={styles.userText}>{message.content}</span>
        ) : (
          <>
            {message.content && (
              <div className={styles.markdown}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ className, children, ...props }) {
                      const isBlock = !props.node?.position ||
                        (props.node.position.start.line !== props.node.position.end.line);
                      if (isBlock || className) {
                        return <CodeBlock className={className}>{children}</CodeBlock>;
                      }
                      return <code className={styles.inlineCode} {...props}>{children}</code>;
                    },
                    a({ href, children }) {
                      return <a href={href} target="_blank" rel="noreferrer">{children}</a>;
                    },
                  }}
                >
                  {message.content}
                </ReactMarkdown>
                {message.streaming && !(message.toolCalls?.length) && (
                  <span className={styles.cursor}>▋</span>
                )}
              </div>
            )}

            {(message.toolCalls || []).map((tc) => (
              <ToolCallDisplay key={tc.id} toolCall={tc} />
            ))}

            {message.streaming && !message.content && !message.toolCalls?.length && (
              <span className={styles.thinking}>Thinking<span className={styles.cursor}>▋</span></span>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  userRow: css`
    display: flex;
    justify-content: flex-end;
    margin-bottom: ${theme.spacing(1.5)};
  `,
  assistantRow: css`
    display: flex;
    justify-content: flex-start;
    margin-bottom: ${theme.spacing(1.5)};
  `,
  userBubble: css`
    max-width: 75%;
    padding: ${theme.spacing(1, 1.5)};
    background: ${theme.colors.primary.main};
    color: ${theme.colors.primary.contrastText};
    border-radius: 18px 18px 4px 18px;
    word-wrap: break-word;
  `,
  assistantBubble: css`
    max-width: 90%;
    padding: ${theme.spacing(1, 1.5)};
    background: ${theme.colors.background.secondary};
    border-radius: 4px 18px 18px 18px;
    word-wrap: break-word;
  `,
  userText: css`
    white-space: pre-wrap;
    font-size: ${theme.typography.body.fontSize};
    line-height: 1.5;
  `,
  markdown: css`
    font-size: ${theme.typography.body.fontSize};
    line-height: 1.6;
    color: ${theme.colors.text.primary};

    p { margin: 0 0 ${theme.spacing(1)} 0; }
    p:last-child { margin-bottom: 0; }
    h1, h2, h3, h4 {
      margin: ${theme.spacing(1.5)} 0 ${theme.spacing(0.5)} 0;
      font-weight: ${theme.typography.fontWeightMedium};
    }
    ul, ol {
      margin: ${theme.spacing(0.5)} 0;
      padding-left: ${theme.spacing(2.5)};
    }
    li { margin-bottom: ${theme.spacing(0.25)}; }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: ${theme.spacing(1)} 0;
      font-size: ${theme.typography.bodySmall.fontSize};
    }
    th, td {
      border: 1px solid ${theme.colors.border.medium};
      padding: ${theme.spacing(0.5, 1)};
      text-align: left;
    }
    th { background: ${theme.colors.background.canvas}; font-weight: ${theme.typography.fontWeightMedium}; }
    blockquote {
      border-left: 3px solid ${theme.colors.primary.border};
      margin: ${theme.spacing(1)} 0;
      padding: ${theme.spacing(0.5, 1.5)};
      color: ${theme.colors.text.secondary};
    }
    a { color: ${theme.colors.text.link}; }
  `,
  inlineCode: css`
    font-family: ${theme.typography.fontFamilyMonospace};
    font-size: 0.875em;
    background: ${theme.colors.background.canvas};
    padding: 1px 5px;
    border-radius: 3px;
    border: 1px solid ${theme.colors.border.weak};
  `,
  thinking: css`
    color: ${theme.colors.text.secondary};
    font-style: italic;
  `,
  cursor: css`
    animation: blink 1s step-end infinite;
    @keyframes blink { 50% { opacity: 0; } }
  `,
});

const getCodeStyles = (theme: GrafanaTheme2) => ({
  block: css`
    margin: ${theme.spacing(1)} 0;
    border-radius: ${theme.shape.radius.default};
    border: 1px solid ${theme.colors.border.weak};
    overflow: hidden;
  `,
  header: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: ${theme.spacing(0.25, 1)};
    background: ${theme.colors.background.canvas};
    border-bottom: 1px solid ${theme.colors.border.weak};
  `,
  lang: css`
    font-family: ${theme.typography.fontFamilyMonospace};
    font-size: 11px;
    color: ${theme.colors.text.secondary};
    text-transform: lowercase;
  `,
  pre: css`
    margin: 0;
    padding: ${theme.spacing(1, 1.5)};
    background: ${theme.colors.background.primary};
    overflow-x: auto;
    font-family: ${theme.typography.fontFamilyMonospace};
    font-size: 13px;
    line-height: 1.5;
    color: ${theme.colors.text.primary};
    code { font-family: inherit; }
  `,
});
