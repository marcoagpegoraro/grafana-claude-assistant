import React from 'react';
import { css } from '@emotion/css';
import { useStyles2 } from '@grafana/ui';
import { GrafanaTheme2 } from '@grafana/data';
import { ChatPanel } from '../components/Chat/ChatPanel';

function ChatPage() {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <span className={styles.title}>Claude AI Assistant</span>
      </div>
      <ChatPanel />
    </div>
  );
}

export default ChatPage;

const getStyles = (theme: GrafanaTheme2) => ({
  page: css`
    display: flex;
    flex-direction: column;
    height: calc(100vh - 55px);
  `,
  header: css`
    display: flex;
    align-items: center;
    padding: ${theme.spacing(1.5, 2)};
    border-bottom: 1px solid ${theme.colors.border.weak};
    background: ${theme.colors.background.secondary};
    flex-shrink: 0;
  `,
  title: css`
    font-size: ${theme.typography.h5.fontSize};
    font-weight: ${theme.typography.fontWeightMedium};
  `,
});
