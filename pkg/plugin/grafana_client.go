package plugin

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
)

type GrafanaClient struct {
	baseURL    string
	token      string
	headers    map[string]string
	httpClient *http.Client
}

// NewGrafanaClient creates a client using the service account token when available,
// falling back to forwarding the incoming user's auth headers.
func NewGrafanaClient(ctx context.Context, httpClient *http.Client, incomingHeaders http.Header) (*GrafanaClient, error) {
	cfg := backend.GrafanaConfigFromContext(ctx)

	appURL, err := cfg.AppURL()
	if err != nil || appURL == "" {
		appURL = "http://localhost:3000"
	}
	// Strip trailing slash
	for len(appURL) > 0 && appURL[len(appURL)-1] == '/' {
		appURL = appURL[:len(appURL)-1]
	}

	gc := &GrafanaClient{
		baseURL:    appURL,
		httpClient: httpClient,
		headers:    map[string]string{},
	}

	// Prefer service account token (requires externalServiceAccounts feature toggle)
	saToken, saErr := cfg.PluginAppClientSecret()
	if saErr == nil && saToken != "" {
		gc.token = saToken
		log.DefaultLogger.Debug("GrafanaClient using service account token")
	} else {
		// Forward the user's own auth headers from the plugin resource request
		for _, key := range []string{"Authorization", "Cookie", "X-Grafana-Org-Id", "X-Grafana-Org-Name"} {
			if v := incomingHeaders.Get(key); v != "" {
				gc.headers[key] = v
			}
		}
		log.DefaultLogger.Debug("GrafanaClient using forwarded user headers", "authPresent", incomingHeaders.Get("Authorization") != "")
	}

	return gc, nil
}

func (gc *GrafanaClient) do(ctx context.Context, method, path string, body any) ([]byte, error) {
	var reqBody io.Reader
	if body != nil {
		data, err := json.Marshal(body)
		if err != nil {
			return nil, fmt.Errorf("marshal request body: %w", err)
		}
		reqBody = bytes.NewReader(data)
	}

	req, err := http.NewRequestWithContext(ctx, method, gc.baseURL+path, reqBody)
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")

	if gc.token != "" {
		req.Header.Set("Authorization", "Bearer "+gc.token)
	} else {
		for k, v := range gc.headers {
			req.Header.Set(k, v)
		}
	}

	resp, err := gc.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("do request: %w", err)
	}
	defer resp.Body.Close()

	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read response: %w", err)
	}

	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("grafana API error %d at %s %s: %s", resp.StatusCode, method, path, string(data))
	}

	return data, nil
}

func (gc *GrafanaClient) ListDatasources(ctx context.Context) (string, error) {
	data, err := gc.do(ctx, "GET", "/api/datasources", nil)
	if err != nil {
		return "", err
	}
	return string(data), nil
}

func (gc *GrafanaClient) ListDashboards(ctx context.Context, query string) (string, error) {
	path := "/api/search?type=dash-db&limit=100"
	if query != "" {
		path += "&query=" + query
	}
	data, err := gc.do(ctx, "GET", path, nil)
	if err != nil {
		return "", err
	}
	return string(data), nil
}

func (gc *GrafanaClient) GetDashboard(ctx context.Context, uid string) (string, error) {
	data, err := gc.do(ctx, "GET", "/api/dashboards/uid/"+uid, nil)
	if err != nil {
		return "", err
	}
	return string(data), nil
}

func (gc *GrafanaClient) QueryDatasource(ctx context.Context, payload any) (string, error) {
	data, err := gc.do(ctx, "POST", "/api/ds/query", payload)
	if err != nil {
		return "", err
	}
	return string(data), nil
}

func (gc *GrafanaClient) CreateDashboard(ctx context.Context, dashboard any) (string, error) {
	payload := map[string]any{
		"dashboard": dashboard,
		"overwrite": false,
		"folderId":  0,
	}
	data, err := gc.do(ctx, "POST", "/api/dashboards/db", payload)
	if err != nil {
		return "", err
	}
	return string(data), nil
}

func (gc *GrafanaClient) UpdateDashboard(ctx context.Context, dashboard any) (string, error) {
	payload := map[string]any{
		"dashboard": dashboard,
		"overwrite": true,
	}
	data, err := gc.do(ctx, "POST", "/api/dashboards/db", payload)
	if err != nil {
		return "", err
	}
	return string(data), nil
}
