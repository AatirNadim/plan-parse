package core

import (
	tfjson "github.com/hashicorp/terraform-json"
)

// Action represents the change action of a resource.
type Action string

const (
	ActionNoop    Action = "no-op"
	ActionCreate  Action = "create"
	ActionRead    Action = "read"
	ActionUpdate  Action = "update"
	ActionDelete  Action = "delete"
	ActionReplace Action = "replace"
)

// ResourceType represents the node categorization type.
type ResourceType string

const (
	ResourceTypeBasename ResourceType = "basename"
	ResourceTypeModule   ResourceType = "module"
	ResourceTypeFile     ResourceType = "file"
	ResourceTypeResource ResourceType = "resource"
	ResourceTypeData     ResourceType = "data"
	ResourceTypeVariable ResourceType = "variable"
	ResourceTypeOutput   ResourceType = "output"
	ResourceTypeLocal    ResourceType = "locals"
	DefaultFileName      string       = "unknown file"
)

// Action and resource color constants matching requirements.
const (
	ColorCreate   string = "#22c55e" // green
	ColorDelete   string = "#ef4444" // red
	ColorUpdate   string = "#3b82f6" // blue
	ColorReplace  string = "#f59e0b" // amber/yellow
	ColorNoop     string = "#64748b" // slate
	ColorData     string = "#ec4899" // pink
	ColorModule   string = "#a855f7" // purple
	ColorVariable string = "#0ea5e9" // sky
	ColorOutput   string = "#eab308" // yellow
	ColorLocal    string = "#000000" // black
	ColorResource string = "#94a3b8" // slate-400
)

// NodeData contains the payload information for a graph node.
type NodeData struct {
	ID            string         `json:"id"`
	Label         string         `json:"label,omitempty"`
	Type          ResourceType   `json:"type,omitempty"`
	Parent        string         `json:"parent,omitempty"`
	ParentColor   string         `json:"parentColor,omitempty"`
	Change        Action         `json:"change,omitempty"`
	ResourceType  string         `json:"resourceType,omitempty"`
	ResourceName  string         `json:"resourceName,omitempty"`
	Module        string         `json:"module,omitempty"`
	File          string         `json:"file,omitempty"`
	Line          *int           `json:"line,omitempty"`
	ChangeDetails *tfjson.Change `json:"changeDetails,omitempty"`
}

// Node represents a node in the Cytoscape graph.
type Node struct {
	Data    NodeData `json:"data"`
	Classes string   `json:"classes,omitempty"`
}

// EdgeData contains the connection metadata for a graph edge.
type EdgeData struct {
	ID       string `json:"id"`
	Source   string `json:"source"`
	Target   string `json:"target"`
	Gradient string `json:"gradient,omitempty"`
}

// Edge represents a directed dependency edge in the Cytoscape graph.
type Edge struct {
	Data    EdgeData `json:"data"`
	Classes string   `json:"classes,omitempty"`
}

// PlanSummary summarizes the changes described in the Terraform plan.
type PlanSummary struct {
	Total   int `json:"total"`
	Create  int `json:"create"`
	Update  int `json:"update"`
	Delete  int `json:"delete"`
	Replace int `json:"replace"`
	Noop    int `json:"no-op"`
	Read    int `json:"read"`
}

// Graph contains the full DAG visualization payload.
type Graph struct {
	Nodes   []Node      `json:"nodes"`
	Edges   []Edge      `json:"edges"`
	Summary PlanSummary `json:"summary"`
}

// GetActionColor returns the display color associated with an action.
func GetActionColor(a Action) string {
	switch a {
	case ActionCreate:
		return ColorCreate
	case ActionDelete:
		return ColorDelete
	case ActionUpdate:
		return ColorUpdate
	case ActionReplace:
		return ColorReplace
	case ActionNoop:
		return ColorNoop
	case ActionRead:
		return ColorData
	default:
		return ColorResource
	}
}

// GetResourceTypeColor returns the display color for a resource type.
func GetResourceTypeColor(t ResourceType) string {
	switch t {
	case ResourceTypeModule:
		return ColorModule
	case ResourceTypeData:
		return ColorData
	case ResourceTypeOutput:
		return ColorOutput
	case ResourceTypeVariable:
		return ColorVariable
	case ResourceTypeLocal:
		return ColorLocal
	default:
		return ColorResource
	}
}
