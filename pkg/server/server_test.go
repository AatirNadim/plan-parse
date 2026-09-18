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

	"plan-parse/pkg/core"
	"plan-parse/pkg/server"
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

func TestSingleUseCLILifecycle(t *testing.T) {
	cliGraph := loadSampleGraph(t)
	srv := server.NewServer("127.0.0.1", 9000, cliGraph)

	// 1. First load: status should indicate CLI loaded and disabled
	req1 := httptest.NewRequest(http.MethodGet, "/api/status", nil)
	w1 := httptest.NewRecorder()
	srv.ServeHTTP(w1, req1)

	var status1 server.StatusResponse
	if err := json.Unmarshal(w1.Body.Bytes(), &status1); err != nil {
		t.Fatalf("failed to decode status: %v", err)
	}
	if !status1.CLILoaded || !status1.Disabled {
		t.Errorf("first status: expected cli_loaded: true, disabled: true, got: %+v", status1)
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
	if status2.CLILoaded || status2.Disabled {
		t.Errorf("reload status: expected cli_loaded: false, disabled: false, got: %+v", status2)
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
	if status.CLILoaded || status.Disabled {
		t.Errorf("expected cli_loaded: false, disabled: false after graph consumption, got: %+v", status)
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

func TestStaticSPAFallback(t *testing.T) {
	srv := server.NewServer("127.0.0.1", 9000, nil)

	// Request non-existent SPA route
	req := httptest.NewRequest(http.MethodGet, "/dashboard/custom-route", nil)
	w := httptest.NewRecorder()
	srv.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected status 200 for SPA fallback, got %d", w.Code)
	}

	if !bytes.Contains(w.Body.Bytes(), []byte("Plan Parse")) {
		t.Errorf("expected fallback index.html content, got %s", w.Body.String())
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
