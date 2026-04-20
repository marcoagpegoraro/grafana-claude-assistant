package plugin

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/anthropics/anthropic-sdk-go"
)

func grafanaTool(name, description string, schema anthropic.ToolInputSchemaParam) anthropic.ToolUnionParam {
	return anthropic.ToolUnionParam{
		OfTool: &anthropic.ToolParam{
			Name:        name,
			Description: anthropic.String(description),
			InputSchema: schema,
		},
	}
}

var grafanaTools = []anthropic.ToolUnionParam{
	grafanaTool("list_datasources",
		"List all data sources configured in this Grafana instance. Returns an array of datasource objects with id, name, type, and url.",
		anthropic.ToolInputSchemaParam{
			Type:       "object",
			Properties: map[string]any{},
		},
	),
	grafanaTool("list_dashboards",
		"List dashboards in Grafana. Optionally filter by search query.",
		anthropic.ToolInputSchemaParam{
			Type: "object",
			Properties: map[string]any{
				"query": map[string]any{
					"type":        "string",
					"description": "Optional search query to filter dashboards by title",
				},
			},
		},
	),
	grafanaTool("get_dashboard",
		"Get the full JSON definition of a Grafana dashboard by its UID.",
		anthropic.ToolInputSchemaParam{
			Type: "object",
			Properties: map[string]any{
				"uid": map[string]any{
					"type":        "string",
					"description": "The dashboard UID",
				},
			},
			Required: []string{"uid"},
		},
	),
	grafanaTool("query_datasource",
		"Execute a query against a Grafana datasource. Supports Prometheus, Loki, InfluxDB, and other types.",
		anthropic.ToolInputSchemaParam{
			Type: "object",
			Properties: map[string]any{
				"queries": map[string]any{
					"type":        "array",
					"description": "Array of query objects. Each must have 'datasource' (with uid and type) and query expression fields appropriate for the datasource type.",
					"items":       map[string]any{"type": "object"},
				},
				"from": map[string]any{
					"type":    "string",
					"default": "now-1h",
				},
				"to": map[string]any{
					"type":    "string",
					"default": "now",
				},
			},
			Required: []string{"queries"},
		},
	),
	grafanaTool("create_dashboard",
		"Create a new Grafana dashboard. Provide complete dashboard JSON including title, panels, and variables.",
		anthropic.ToolInputSchemaParam{
			Type: "object",
			Properties: map[string]any{
				"dashboard": map[string]any{
					"type":        "object",
					"description": "Dashboard JSON definition. Must include 'title'. Set 'id' to null. Include 'panels' array.",
				},
			},
			Required: []string{"dashboard"},
		},
	),
	grafanaTool("update_dashboard",
		"Update an existing Grafana dashboard. Provide complete updated JSON including uid and version.",
		anthropic.ToolInputSchemaParam{
			Type: "object",
			Properties: map[string]any{
				"dashboard": map[string]any{
					"type":        "object",
					"description": "Updated dashboard JSON. Must include 'uid' and 'version'.",
				},
			},
			Required: []string{"dashboard"},
		},
	),
}

func executeTool(ctx context.Context, gc *GrafanaClient, name string, input json.RawMessage) (string, error) {
	switch name {
	case "list_datasources":
		return gc.ListDatasources(ctx)

	case "list_dashboards":
		var params struct {
			Query string `json:"query"`
		}
		if err := json.Unmarshal(input, &params); err != nil {
			return "", fmt.Errorf("parse list_dashboards params: %w", err)
		}
		return gc.ListDashboards(ctx, params.Query)

	case "get_dashboard":
		var params struct {
			UID string `json:"uid"`
		}
		if err := json.Unmarshal(input, &params); err != nil {
			return "", fmt.Errorf("parse get_dashboard params: %w", err)
		}
		if params.UID == "" {
			return "", fmt.Errorf("uid is required")
		}
		return gc.GetDashboard(ctx, params.UID)

	case "query_datasource":
		var params struct {
			Queries []any  `json:"queries"`
			From    string `json:"from"`
			To      string `json:"to"`
		}
		if err := json.Unmarshal(input, &params); err != nil {
			return "", fmt.Errorf("parse query_datasource params: %w", err)
		}
		if params.From == "" {
			params.From = "now-1h"
		}
		if params.To == "" {
			params.To = "now"
		}
		return gc.QueryDatasource(ctx, map[string]any{
			"queries": params.Queries,
			"from":    params.From,
			"to":      params.To,
		})

	case "create_dashboard":
		var params struct {
			Dashboard any `json:"dashboard"`
		}
		if err := json.Unmarshal(input, &params); err != nil {
			return "", fmt.Errorf("parse create_dashboard params: %w", err)
		}
		return gc.CreateDashboard(ctx, params.Dashboard)

	case "update_dashboard":
		var params struct {
			Dashboard any `json:"dashboard"`
		}
		if err := json.Unmarshal(input, &params); err != nil {
			return "", fmt.Errorf("parse update_dashboard params: %w", err)
		}
		return gc.UpdateDashboard(ctx, params.Dashboard)

	default:
		return "", fmt.Errorf("unknown tool: %s", name)
	}
}
