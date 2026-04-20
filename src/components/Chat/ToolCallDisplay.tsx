import React, { useState } from 'react';
import { css } from '@emotion/css';
import { useStyles2, Icon } from '@grafana/ui';
import { GrafanaTheme2 } from '@grafana/data';
import { ToolCallItem } from './types';

interface Props {
  toolCall: ToolCallItem;
}

export function ToolCallDisplay({ toolCall }: Props) {
  const styles = useStyles2(getStyles);
  const [open, setOpen] = useState(false);

  const icon =
    toolCall.status === 'running' ? 'spinner' :
    toolCall.status === 'error' ? 'exclamation-triangle' :
    'check';

  const statusColor =
    toolCall.status === 'running' ? '#6c757d' :
    toolCall.status === 'error' ? '#e02f44' :
    '#3d9e42';

  const label = TOOL_LABELS[toolCall.name] || toolCall.name;

  return (
    <div className={styles.container}>
      <button className={styles.header} onClick={() => setOpen((o) => !o)} type="button">
        <Icon name={icon as any} size="sm" style={{ color: statusColor }} />
        <span className={styles.label}>{label}</span>
        <Icon name={open ? 'angle-up' : 'angle-down'} size="sm" />
      </button>

      {open && (
        <div className={styles.body}>
          <div className={styles.section}>
            <span className={styles.sectionTitle}>Input</span>
            <pre className={styles.code}>{JSON.stringify(toolCall.input, null, 2)}</pre>
          </div>
          {toolCall.result !== undefined && (
            <div className={styles.section}>
              <span className={styles.sectionTitle}>Result</span>
              <pre className={styles.code}>
                {tryFormatJSON(toolCall.result)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const TOOL_LABELS: Record<string, string> = {
  list_datasources: 'Listed datasources',
  list_dashboards: 'Listed dashboards',
  get_dashboard: 'Fetched dashboard',
  query_datasource: 'Queried datasource',
  create_dashboard: 'Created dashboard',
  update_dashboard: 'Updated dashboard',
};

function tryFormatJSON(str: string): string {
  try {
    return JSON.stringify(JSON.parse(str), null, 2);
  } catch {
    return str;
  }
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    border: 1px solid ${theme.colors.border.weak};
    border-radius: ${theme.shape.radius.default};
    margin: ${theme.spacing(0.5)} 0;
    font-size: ${theme.typography.bodySmall.fontSize};
    overflow: hidden;
  `,
  header: css`
    display: flex;
    align-items: center;
    gap: ${theme.spacing(0.75)};
    width: 100%;
    padding: ${theme.spacing(0.5, 1)};
    background: ${theme.colors.background.secondary};
    border: none;
    cursor: pointer;
    color: ${theme.colors.text.secondary};
    text-align: left;
    &:hover {
      background: ${theme.colors.action.hover};
    }
  `,
  label: css`
    flex: 1;
    font-style: italic;
  `,
  body: css`
    padding: ${theme.spacing(1)};
    background: ${theme.colors.background.primary};
  `,
  section: css`
    margin-bottom: ${theme.spacing(0.5)};
  `,
  sectionTitle: css`
    font-weight: ${theme.typography.fontWeightBold};
    color: ${theme.colors.text.secondary};
    display: block;
    margin-bottom: ${theme.spacing(0.25)};
  `,
  code: css`
    font-family: ${theme.typography.fontFamilyMonospace};
    font-size: 11px;
    background: ${theme.colors.background.canvas};
    padding: ${theme.spacing(0.5)};
    border-radius: ${theme.shape.radius.default};
    white-space: pre-wrap;
    word-break: break-all;
    max-height: 200px;
    overflow-y: auto;
    margin: 0;
  `,
});
