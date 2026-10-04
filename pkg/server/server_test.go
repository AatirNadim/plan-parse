package server_test

import (
	"bytes"
	"encoding/json"
	"io"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	"github.com/AatirNadim/plan-parse/pkg/core"
	"github.com/AatirNadim/plan-parse/pkg/server"
)

func getSamplePlanPath() string {
	candidates := []string{
		filepath.Join("..", "..", "testdata", "tf_plan.json"),
		filepath.Join("testdata", "tf_plan.json"),
	}
	for _, c := range candidates {
		if _, err := os.Stat(c); err == nil {
			return c
		}
	}
	return filepath.Join("..", "..", "testdata", "tf_plan.json")
}

func loadSampleGraph(t *testing.T) *core.Graph {
	plan, err := core.ValidatePlanFile(getSamplePlanPath())
	if err != nil {
		t.Fatalf("failed to load sample plan: %v", err)
	}
	parser := core.NewParser(plan, "")
	graph, err := parser.GenerateGraph()
	if err != nil {
		t.Fatalf("failed to generate sample graph: %v", err)
	}
	return graph
}

func TestHealthEndpoint(t *testing.T) {
	srv := server.NewServer("127.0.0.1", 9000, nil)

	req := httptest.NewRequest(http.MethodGet, "/api/health", nil)
	w := httptest.NewRecorder()
	srv.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d", w.Code)
	}

	var resp server.HealthResponse
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if !resp.Alive {
		t.Error("expected alive to be true")
	}
}

func TestStatusAndGraphWithoutCLI(t *testing.T) {
	srv := server.NewServer("127.0.0.1", 9000, nil)

	// Status
	statusReq := httptest.NewRequest(http.MethodGet, "/api/status", nil)
	statusW := httptest.NewRecorder()
	srv.ServeHTTP(statusW, statusReq)

	if statusW.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d", statusW.Code)
	}

	var statusResp server.StatusResponse
	if err := json.Unmarshal(statusW.Body.Bytes(), &statusResp); err != nil {
		t.Fatalf("failed to decode status response: %v", err)
	}

	if statusResp.CLILoaded || statusResp.Disabled {
		t.Errorf("expected cli_loaded: false, disabled: false, got: %+v", statusResp)
	}
	if !statusResp.Collapsed {
		t.Errorf("expected collapsed: true by default, got: %+v", statusResp)
	}

	// Graph
	graphReq := httptest.NewRequest(http.MethodGet, "/api/graph", nil)
	graphW := httptest.NewRecorder()
	srv.ServeHTTP(graphW, graphReq)

	if graphW.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d", graphW.Code)
	}

	var graphResp core.Graph
	if err := json.Unmarshal(graphW.Body.Bytes(), &graphResp); err != nil {
		t.Fatalf("failed to decode graph response: %v", err)
	}

	if len(graphResp.Nodes) != 0 || len(graphResp.Edges) != 0 {
		t.Errorf("expected empty graph, got %d nodes, %d edges", len(graphResp.Nodes), len(graphResp.Edges))
	}
}

func TestServerCollapsedDefaultAndConfiguration(t *testing.T) {
	// 1. Default collapsed is true
	srv := server.NewServer("127.0.0.1", 9000, nil)
	if !srv.Collapsed() {
		t.Errorf("expected srv.Collapsed() to be true by default")
	}

	req := httptest.NewRequest(http.MethodGet, "/api/status", nil)
	w := httptest.NewRecorder()
	srv.ServeHTTP(w, req)

	var resp server.StatusResponse
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to decode status: %v", err)
	}
	if !resp.Collapsed {
		t.Errorf("expected status.collapsed to be true by default, got %v", resp.Collapsed)
	}

	// 2. SetCollapsed(false)
	srv.SetCollapsed(false)
	if srv.Collapsed() {
		t.Errorf("expected srv.Collapsed() to be false after SetCollapsed(false)")
	}

	req2 := httptest.NewRequest(http.MethodGet, "/api/status", nil)
	w2 := httptest.NewRecorder()
	srv.ServeHTTP(w2, req2)

	var resp2 server.StatusResponse
	if err := json.Unmarshal(w2.Body.Bytes(), &resp2); err != nil {
		t.Fatalf("failed to decode status: %v", err)
	}
	if resp2.Collapsed {
		t.Errorf("expected status.collapsed to be false, got %v", resp2.Collapsed)
	}

	// 3. SetCollapsed(true)
	srv.SetCollapsed(true)
	if !srv.Collapsed() {
		t.Errorf("expected srv.Collapsed() to be true after SetCollapsed(true)")
	}

	req3 := httptest.NewRequest(http.MethodGet, "/api/status", nil)
	w3 := httptest.NewRecorder()
	srv.ServeHTTP(w3, req3)

	var resp3 server.StatusResponse
	if err := json.Unmarshal(w3.Body.Bytes(), &resp3); err != nil {
		t.Fatalf("failed to decode status: %v", err)
	}
	if !resp3.Collapsed {
		t.Errorf("expected status.collapsed to be true, got %v", resp3.Collapsed)
	}
}

func TestServerCollapsedWithCLISession(t *testing.T) {
	cliGraph := loadSampleGraph(t)
	srv := server.NewServer("127.0.0.1", 9000, cliGraph)
	srv.SetCollapsed(false)

	// First request with CLI plan
	req := httptest.NewRequest(http.MethodGet, "/api/status", nil)
	w := httptest.NewRecorder()
	srv.ServeHTTP(w, req)

	var resp server.StatusResponse
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to decode status: %v", err)
	}
	if !resp.CLILoaded || !resp.Disabled {
		t.Errorf("expected cli_loaded: true, disabled: true, got %+v", resp)
	}
	if resp.Collapsed {
		t.Errorf("expected collapsed: false when set to false, got %v", resp.Collapsed)
	}

	// Subsequent reload request
	req2 := httptest.NewRequest(http.MethodGet, "/api/status", nil)
	w2 := httptest.NewRecorder()
	srv.ServeHTTP(w2, req2)

	var resp2 server.StatusResponse
	if err := json.Unmarshal(w2.Body.Bytes(), &resp2); err != nil {
		t.Fatalf("failed to decode status: %v", err)
	}
	if resp2.CLILoaded || resp2.Disabled {
		t.Errorf("expected cli_loaded: false, disabled: false on reload, got %+v", resp2)
	}
	if resp2.Collapsed {
		t.Errorf("expected collapsed: false on reload, got %v", resp2.Collapsed)
	}
}

func TestSingleUseCLILifecycle(t *testing.T) {
	cliGraph := loadSampleGraph(t)
	srv := server.NewServer("127.0.0.1", 9000, cliGraph)

	// 1. First load: status should indicate CLI loaded, disabled, and collapsed: true
	req1 := httptest.NewRequest(http.MethodGet, "/api/status", nil)
	w1 := httptest.NewRecorder()
	srv.ServeHTTP(w1, req1)

	var status1 server.StatusResponse
	if err := json.Unmarshal(w1.Body.Bytes(), &status1); err != nil {
		t.Fatalf("failed to decode status: %v", err)
	}
	if !status1.CLILoaded || !status1.Disabled || !status1.Collapsed {
		t.Errorf("first status: expected cli_loaded: true, disabled: true, collapsed: true, got: %+v", status1)
	}

	// 2. First load: graph returns CLI plan data
	graphReq1 := httptest.NewRequest(http.MethodGet, "/api/graph", nil)
	graphW1 := httptest.NewRecorder()
	srv.ServeHTTP(graphW1, graphReq1)

	var g1 core.Graph
	if err := json.Unmarshal(graphW1.Body.Bytes(), &g1); err != nil {
		t.Fatalf("failed to decode graph: %v", err)
	}
	if len(g1.Nodes) == 0 {
		t.Error("expected non-empty nodes on first graph request")
	}
	if g1.Summary.Total != 66 {
		t.Errorf("expected 66 total resources, got %d", g1.Summary.Total)
	}

	// 3. Reload: status should now be blank / enabled
	req2 := httptest.NewRequest(http.MethodGet, "/api/status", nil)
	w2 := httptest.NewRecorder()
	srv.ServeHTTP(w2, req2)

	var status2 server.StatusResponse
	if err := json.Unmarshal(w2.Body.Bytes(), &status2); err != nil {
		t.Fatalf("failed to decode status on reload: %v", err)
	}
	if status2.CLILoaded || status2.Disabled || !status2.Collapsed {
		t.Errorf("reload status: expected cli_loaded: false, disabled: false, collapsed: true, got: %+v", status2)
	}

	// 4. Reload: graph should return empty graph
	graphReq2 := httptest.NewRequest(http.MethodGet, "/api/graph", nil)
	graphW2 := httptest.NewRecorder()
	srv.ServeHTTP(graphW2, graphReq2)

	var g2 core.Graph
	if err := json.Unmarshal(graphW2.Body.Bytes(), &g2); err != nil {
		t.Fatalf("failed to decode graph on reload: %v", err)
	}
	if len(g2.Nodes) != 0 || len(g2.Edges) != 0 {
		t.Errorf("reload graph: expected 0 nodes and edges, got %d nodes, %d edges", len(g2.Nodes), len(g2.Edges))
	}
}

func TestDirectGraphConsumptionLifecycle(t *testing.T) {
	cliGraph := loadSampleGraph(t)
	srv := server.NewServer("127.0.0.1", 9000, cliGraph)

	// 1. Directly fetch /api/graph first (without calling /api/status)
	graphReq1 := httptest.NewRequest(http.MethodGet, "/api/graph", nil)
	graphW1 := httptest.NewRecorder()
	srv.ServeHTTP(graphW1, graphReq1)

	var g1 core.Graph
	if err := json.Unmarshal(graphW1.Body.Bytes(), &g1); err != nil {
		t.Fatalf("failed to decode graph: %v", err)
	}
	if len(g1.Nodes) == 0 {
		t.Error("expected non-empty nodes on initial graph request")
	}

	// 2. Subsequent /api/graph request should return blank graph
	graphReq2 := httptest.NewRequest(http.MethodGet, "/api/graph", nil)
	graphW2 := httptest.NewRecorder()
	srv.ServeHTTP(graphW2, graphReq2)

	var g2 core.Graph
	if err := json.Unmarshal(graphW2.Body.Bytes(), &g2); err != nil {
		t.Fatalf("failed to decode graph on second request: %v", err)
	}
	if len(g2.Nodes) != 0 || len(g2.Edges) != 0 {
		t.Errorf("expected 0 nodes and edges after consumption, got %d nodes, %d edges", len(g2.Nodes), len(g2.Edges))
	}

	// 3. Status request after graph was consumed should return cli_loaded: false, disabled: false
	statusReq := httptest.NewRequest(http.MethodGet, "/api/status", nil)
	statusW := httptest.NewRecorder()
	srv.ServeHTTP(statusW, statusReq)

	var status server.StatusResponse
	if err := json.Unmarshal(statusW.Body.Bytes(), &status); err != nil {
		t.Fatalf("failed to decode status: %v", err)
	}
	if status.CLILoaded || status.Disabled || !status.Collapsed {
		t.Errorf("expected cli_loaded: false, disabled: false, collapsed: true after graph consumption, got: %+v", status)
	}
}

func TestParseEndpoint(t *testing.T) {
	srv := server.NewServer("127.0.0.1", 9000, nil)
	planData, err := os.ReadFile(getSamplePlanPath())
	if err != nil {
		t.Fatalf("failed to read sample plan file: %v", err)
	}

	t.Run("Raw JSON body upload", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/api/parse", bytes.NewReader(planData))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		srv.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("expected 200 OK, got %d: %s", w.Code, w.Body.String())
		}

		var g core.Graph
		if err := json.Unmarshal(w.Body.Bytes(), &g); err != nil {
			t.Fatalf("failed to decode graph: %v", err)
		}

		if len(g.Nodes) == 0 {
			t.Error("expected nodes in parsed graph")
		}
		if g.Summary.Total != 66 {
			t.Errorf("expected 66 total resources, got %d", g.Summary.Total)
		}
	})

	t.Run("Multipart form upload", func(t *testing.T) {
		body := &bytes.Buffer{}
		writer := multipart.NewWriter(body)
		part, err := writer.CreateFormFile("file", "tf_plan.json")
		if err != nil {
			t.Fatal(err)
		}
		if _, err := io.Copy(part, bytes.NewReader(planData)); err != nil {
			t.Fatal(err)
		}
		_ = writer.Close()

		req := httptest.NewRequest(http.MethodPost, "/api/parse", body)
		req.Header.Set("Content-Type", writer.FormDataContentType())
		w := httptest.NewRecorder()
		srv.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("expected 200 OK, got %d: %s", w.Code, w.Body.String())
		}

		var g core.Graph
		if err := json.Unmarshal(w.Body.Bytes(), &g); err != nil {
			t.Fatalf("failed to decode graph: %v", err)
		}
		if len(g.Nodes) == 0 {
			t.Error("expected nodes in parsed graph")
		}
	})

	t.Run("Invalid JSON payload", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/api/parse", bytes.NewReader([]byte("{invalid-json}")))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		srv.ServeHTTP(w, req)

		if w.Code != http.StatusBadRequest {
			t.Errorf("expected 400 Bad Request, got %d", w.Code)
		}
	})
}

func TestCORSAndOPTIONS(t *testing.T) {
	srv := server.NewServer("127.0.0.1", 9000, nil)

	req := httptest.NewRequest(http.MethodOptions, "/api/health", nil)
	w := httptest.NewRecorder()
	srv.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected status 200 for OPTIONS, got %d", w.Code)
	}

	if w.Header().Get("Access-Control-Allow-Origin") != "*" {
		t.Errorf("expected Access-Control-Allow-Origin '*', got %q", w.Header().Get("Access-Control-Allow-Origin"))
	}
}

func TestNotFoundDirectServing(t *testing.T) {
	srv := server.NewServer("127.0.0.1", 9000, nil)

	// 1. Request non-existent route: should directly return 404 with high-craft not-found HTML
	req := httptest.NewRequest(http.MethodGet, "/dashboard/custom-route", nil)
	w := httptest.NewRecorder()
	srv.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Errorf("expected status 404 for unmapped route, got %d", w.Code)
	}

	if !bytes.Contains(w.Body.Bytes(), []byte("Route Not Found")) {
		t.Errorf("expected not-found HTML content, got %s", w.Body.String())
	}
	if !bytes.Contains(w.Body.Bytes(), []byte("/api/parse")) {
		t.Errorf("expected server endpoints reference in not-found HTML")
	}

	// 2. Browser navigating to an unmapped /api/ route with Accept: text/html receives 404 with not-found HTML
	browserReq := httptest.NewRequest(http.MethodGet, "/api/parse", nil)
	browserReq.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
	browserW := httptest.NewRecorder()
	srv.ServeHTTP(browserW, browserReq)

	if browserW.Code != http.StatusNotFound {
		t.Errorf("expected status 404 for browser navigation to /api/parse, got %d", browserW.Code)
	}
	if !bytes.Contains(browserW.Body.Bytes(), []byte("Route Not Found")) {
		t.Errorf("expected not-found HTML for browser navigation to /api/parse")
	}

	// 3. Non-browser API client requesting unmapped /api/ route receives 404
	apiReq := httptest.NewRequest(http.MethodGet, "/api/parse", nil)
	apiReq.Header.Set("Accept", "application/json")
	apiW := httptest.NewRecorder()
	srv.ServeHTTP(apiW, apiReq)

	if apiW.Code != http.StatusNotFound {
		t.Errorf("expected status 404 for non-browser GET /api/parse, got %d", apiW.Code)
	}
}

func TestEmbeddedStaticFiles(t *testing.T) {
	srv := server.NewServer("127.0.0.1", 9000, nil)

	t.Run("Serve index.html at root", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/", nil)
		w := httptest.NewRecorder()
		srv.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Errorf("expected status 200, got %d", w.Code)
		}
		if !bytes.Contains(w.Body.Bytes(), []byte("Plan Parse")) {
			t.Errorf("expected index.html to contain 'Plan Parse'")
		}
	})

	t.Run("Serve cytoscape-bundle.js", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/cytoscape-bundle.js", nil)
		w := httptest.NewRecorder()
		srv.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Errorf("expected status 200, got %d", w.Code)
		}
		if !bytes.Contains(w.Body.Bytes(), []byte("cytoscape")) {
			t.Errorf("expected bundle to contain 'cytoscape'")
		}
	})
}
