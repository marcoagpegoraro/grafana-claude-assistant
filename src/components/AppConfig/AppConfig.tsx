import React, { ChangeEvent, useState } from 'react';
import { lastValueFrom } from 'rxjs';
import { AppPluginMeta, PluginConfigPageProps, PluginMeta } from '@grafana/data';
import { getBackendSrv } from '@grafana/runtime';
import { Button, Field, FieldSet, RadioButtonGroup, SecretInput } from '@grafana/ui';

type AppPluginSettings = {
  model?: string;
};

type State = {
  anthropicApiKey: string;
  isKeySet: boolean;
  model: string;
};

export interface AppConfigProps extends PluginConfigPageProps<AppPluginMeta<AppPluginSettings>> {}

const MODEL_OPTIONS = [
  { label: 'Claude Sonnet 4.6', value: 'claude-sonnet-4-6' },
  { label: 'Claude Opus 4.7', value: 'claude-opus-4-7' },
  { label: 'Claude Haiku 4.5', value: 'claude-haiku-4-5-20251001' },
];

const AppConfig = ({ plugin }: AppConfigProps) => {
  const { enabled, pinned, jsonData, secureJsonFields } = plugin.meta;

  const [state, setState] = useState<State>({
    anthropicApiKey: '',
    isKeySet: Boolean(secureJsonFields?.anthropicApiKey),
    model: jsonData?.model || 'claude-sonnet-4-6',
  });

  const onResetKey = () => setState({ ...state, anthropicApiKey: '', isKeySet: false });

  const onChangeKey = (e: ChangeEvent<HTMLInputElement>) =>
    setState({ ...state, anthropicApiKey: e.target.value.trim() });

  const onChangeModel = (value: string) => setState({ ...state, model: value });

  const onSubmit = () => {
    updatePluginAndReload(plugin.meta.id, {
      enabled,
      pinned,
      jsonData: { model: state.model },
      secureJsonData: state.isKeySet ? undefined : { anthropicApiKey: state.anthropicApiKey },
    });
  };

  const isSubmitDisabled = !state.isKeySet && !state.anthropicApiKey;

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
      <FieldSet label="Anthropic Settings">
        <Field
          label="Anthropic API Key"
          description="Your Anthropic API key from console.anthropic.com. It is stored securely and never exposed to the frontend."
        >
          <SecretInput
            width={60}
            id="config-anthropic-api-key"
            name="anthropicApiKey"
            value={state.anthropicApiKey}
            isConfigured={state.isKeySet}
            placeholder="sk-ant-..."
            onChange={onChangeKey}
            onReset={onResetKey}
          />
        </Field>

        <Field label="Model" description="Claude model to use for the AI assistant">
          <RadioButtonGroup
            options={MODEL_OPTIONS}
            value={state.model}
            onChange={onChangeModel}
          />
        </Field>

        <div style={{ marginTop: '16px' }}>
          <Button type="submit" disabled={isSubmitDisabled}>
            Save settings
          </Button>
        </div>
      </FieldSet>
    </form>
  );
};

export default AppConfig;

const updatePluginAndReload = async (pluginId: string, data: Partial<PluginMeta<AppPluginSettings>>) => {
  try {
    await lastValueFrom(
      getBackendSrv().fetch({
        url: `/api/plugins/${pluginId}/settings`,
        method: 'POST',
        data,
      })
    );
    window.location.reload();
  } catch (e) {
    console.error('Error while updating plugin settings', e);
  }
};
