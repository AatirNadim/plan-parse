package server

import (
	"encoding/json"
	"io"
	"net/http"
	"strings"

	"github.com/AatirNadim/plan-parse/pkg/core"
)

// StatusResponse represents the response payload for GET /api/status.
type StatusResponse struct {
	CLILoaded bool `json:"cli_loaded"`
	Disabled  bool `json:"disabled"`
}

// HealthResponse represents the response payload for GET /api/health.
type HealthResponse struct {
	Alive bool `json:"alive"`
}

// ErrorResponse represents an error payload returned by API endpoints.
type ErrorResponse struct {
	Error string `json:"error"`
}

// handleHealth responds with {"alive": true}.
func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(HealthResponse{Alive: true})
}

// handleStatus returns whether the CLI plan is active for initial display.
// Subsequent calls after the initial view return cli_loaded: false, disabled: false.
func (s *Server) handleStatus(w http.ResponseWriter, r *http.Request) {

	s.mu.Lock()
	defer s.mu.Unlock()

	var resp StatusResponse
	if s.cliPlan != nil && !s.statusServedOnce && !s.graphServedOnce {
		resp = StatusResponse{
			CLILoaded: true,
			Disabled:  true,
		}
		s.statusServedOnce = true
	} else {
		resp = StatusResponse{
			CLILoaded: false,
			Disabled:  false,
		}
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(resp)
}

// handleGraph returns the graph data for visualization.
// On the initial request with a CLI plan, it returns the pre-parsed graph.
// On subsequent calls (e.g. reload), it returns a blank graph.
func (s *Server) handleGraph(w http.ResponseWriter, r *http.Request) {

	s.mu.Lock()
	defer s.mu.Unlock()

	w.Header().Set("Content-Type", "application/json")

	if s.cliPlan != nil && !s.graphServedOnce {
		s.graphServedOnce = true
		_ = json.NewEncoder(w).Encode(s.cliPlan)
		return
	}

	// Blank graph for reloaded or fresh states
	emptyGraph := &core.Graph{
		Nodes:   []core.Node{},
		Edges:   []core.Edge{},
		Summary: core.PlanSummary{},
	}
	_ = json.NewEncoder(w).Encode(emptyGraph)
}

// handleParse handles plan file upload via multipart/form-data or raw JSON body.
// Validates schema, parses the DAG with pkg/core, and returns graph JSON without storing session.
func (s *Server) handleParse(w http.ResponseWriter, r *http.Request) {

	var data []byte
	var err error

	// Handle multipart form upload if present
	contentType := r.Header.Get("Content-Type")
	if contentType != "" && strings.HasPrefix(strings.ToLower(contentType), "multipart/form-data") {
		// Max 50MB
		if err := r.ParseMultipartForm(50 << 20); err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			_ = json.NewEncoder(w).Encode(ErrorResponse{Error: "Failed to parse multipart form: " + err.Error()})
			return
		}

		file, _, fileErr := r.FormFile("file")
		if fileErr != nil {
			// Try "plan" field name
			file, _, fileErr = r.FormFile("plan")
		}
		if fileErr != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			_ = json.NewEncoder(w).Encode(ErrorResponse{Error: "Form file missing (expected 'file' or 'plan' field)"})
			return
		}
		defer file.Close()

		data, err = io.ReadAll(file)
		if err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			_ = json.NewEncoder(w).Encode(ErrorResponse{Error: "Failed to read uploaded file: " + err.Error()})
			return
		}
	} else {
		// Read raw request body
		data, err = io.ReadAll(io.LimitReader(r.Body, 50<<20))
		if err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			_ = json.NewEncoder(w).Encode(ErrorResponse{Error: "Failed to read request body: " + err.Error()})
			return
		}
		defer r.Body.Close()
	}

	// Validate plan JSON
	plan, err := core.ValidatePlanBytes(data)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(ErrorResponse{Error: err.Error()})
		return
	}

	// Generate DAG without session persistence
	parser := core.NewParser(plan, ".")
	graph, err := parser.GenerateGraph()
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(ErrorResponse{Error: "Failed to generate graph: " + err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(graph)
}
