import React, { Suspense, lazy } from 'react';
import { AppPlugin, type AppRootProps, PluginExtensionPoints, type PluginExtensionPanelContext } from '@grafana/data';
import { LoadingPlaceholder } from '@grafana/ui';
import type { AppConfigProps } from './components/AppConfig/AppConfig';
import { GlobalChatDrawer, openClaudeChat } from './components/GlobalChatDrawer';

const LazyApp = lazy(() => import('./components/App/App'));
const LazyAppConfig = lazy(() => import('./components/AppConfig/AppConfig'));

const App = (props: AppRootProps) => (
  <Suspense fallback={<LoadingPlaceholder text="" />}>
    <LazyApp {...props} />
  </Suspense>
);

const AppConfig = (props: AppConfigProps) => (
  <Suspense fallback={<LoadingPlaceholder text="" />}>
    <LazyAppConfig {...props} />
  </Suspense>
);

export const plugin = new AppPlugin<{}>()
  .setRootPage(App)
  .addConfigPage({
    title: 'Configuration',
    icon: 'cog',
    body: AppConfig,
    id: 'configuration',
  })

  // Globally mounted drawer — lives in the Grafana app chrome across all pages
  .addComponent({
    title: 'Claude AI Chat Drawer',
    description: 'Global Claude AI chat drawer',
    targets: [PluginExtensionPoints.AppChrome],
    component: GlobalChatDrawer,
  })

  // Top bar button — mirrors the Grafana assistant button placement
  .addLink({
    title: 'Claude AI',
    description: 'Open Claude AI assistant',
    targets: [PluginExtensionPoints.SingleTopBarAction],
    icon: 'ai',
    onClick: () => openClaudeChat(),
  })

  // Panel context menu — "Ask Claude about this panel"
  .addLink<PluginExtensionPanelContext>({
    title: 'Ask Claude about this panel',
    description: 'Open Claude AI with context from this panel',
    targets: [PluginExtensionPoints.DashboardPanelMenu],
    icon: 'ai',
    onClick: (_, { context }) => {
      if (!context) {
        openClaudeChat();
        return;
      }
      const queries = context.targets?.length
        ? `Queries: ${JSON.stringify(context.targets, null, 2)}`
        : '';
      const timeRange = context.timeRange
        ? `Time range: from ${context.timeRange.from} to ${context.timeRange.to}`
        : '';
      openClaudeChat({
        initialMessage: [
          `Explain the panel "${context.title}" from dashboard "${context.dashboard?.title}".`,
          timeRange,
          queries,
        ]
          .filter(Boolean)
          .join('\n'),
      });
    },
  })

  // Explore toolbar — "Ask Claude about this query"
  .addLink({
    title: 'Ask Claude',
    description: 'Ask Claude about the current Explore query',
    targets: [PluginExtensionPoints.ExploreToolbarAction],
    icon: 'ai',
    onClick: () =>
      openClaudeChat({
        initialMessage:
          'I am in the Explore view. Can you help me understand my query results or suggest improvements?',
      }),
  })

  // Command palette — quick access from anywhere (Ctrl+K)
  .addLink({
    title: 'Open Claude AI Chat',
    description: 'Open the Claude AI assistant',
    targets: [PluginExtensionPoints.CommandPalette],
    icon: 'ai',
    onClick: () => openClaudeChat(),
  });
