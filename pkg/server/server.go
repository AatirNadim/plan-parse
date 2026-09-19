package server

import (
	"embed"
	"fmt"
	"io"
	"io/fs"
	"log"
	"net"
	"net/http"
	"strings"
	"sync"

	"github.com/AatirNadim/plan-parse/pkg/core"
)

//go:embed all:ui/out
var defaultUIFS embed.FS

// Server represents the HTTP server serving the REST API and embedded UI.
type Server struct {
	addr             string
	port             int
	router           *http.ServeMux
	fs               fs.FS
	mu               sync.Mutex
	cliPlan          *core.Graph
	statusServedOnce bool
	graphServedOnce  bool
	listener         net.Listener
}

// NewServer creates a new Server instance configured with optional CLI plan graph and custom FS.
func NewServer(addr string, port int, cliPlan *core.Graph, customFS ...fs.FS) *Server {
	var targetFS fs.FS

	if len(customFS) > 0 && customFS[0] != nil {
		targetFS = customFS[0]
	} else {
		sub, err := fs.Sub(defaultUIFS, "ui/out")
		if err != nil {
			targetFS = defaultUIFS
		} else {
			targetFS = sub
		}
	}

	s := &Server{
		addr:    addr,
		port:    port,
		router:  http.NewServeMux(),
		fs:      targetFS,
		cliPlan: cliPlan,
	}

	s.routes()
	return s
}

// EnableCORS writes the CORS headers to the response writer.
func EnableCORS(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept, Origin, X-Requested-With")
}

// ServeHTTP delegates to the internal router with CORS support.
func (s *Server) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	EnableCORS(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}
	s.router.ServeHTTP(w, r)
}

// routes registers API handlers and SPA static file serving.
func (s *Server) routes() {
	s.router.HandleFunc("/api/health", s.handleHealth)
	s.router.HandleFunc("/api/status", s.handleStatus)
	s.router.HandleFunc("/api/graph", s.handleGraph)
	s.router.HandleFunc("/api/parse", s.handleParse)
	s.router.HandleFunc("/", s.handleStatic)
}

// handleStatic serves static files from the embedded filesystem with SPA fallback to index.html.
func (s *Server) handleStatic(w http.ResponseWriter, r *http.Request) {
	if strings.HasPrefix(r.URL.Path, "/api/") {
		http.NotFound(w, r)
		return
	}

	path := strings.TrimPrefix(r.URL.Path, "/")
	if path == "" {
		path = "index.html"
	}

	// Attempt opening requested file
	f, err := s.fs.Open(path)
	if err == nil {
		stat, statErr := f.Stat()
		if statErr == nil && !stat.IsDir() {
			_ = f.Close()
			http.FileServer(http.FS(s.fs)).ServeHTTP(w, r)
			return
		}
		_ = f.Close()
	}

	// Fallback to index.html for client-side routing
	indexFile, err := s.fs.Open("index.html")
	if err != nil {
		http.Error(w, "UI index.html not found", http.StatusInternalServerError)
		return
	}
	defer indexFile.Close()

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	_, _ = io.Copy(w, indexFile)
}

// Start listens on addr:port and serves incoming requests.
func (s *Server) Start() error {
	listenAddr := fmt.Sprintf("%s:%d", s.addr, s.port)
	ln, err := net.Listen("tcp", listenAddr)
	if err != nil {
		return fmt.Errorf("failed to listen on %s: %w", listenAddr, err)
	}
	s.listener = ln
	log.Printf("Plan-parse server listening on http://%s", listenAddr)

	server := &http.Server{
		Handler: s,
	}

	return server.Serve(ln)
}

// Close gracefully closes the listening socket if active.
func (s *Server) Close() error {
	if s.listener != nil {
		return s.listener.Close()
	}
	return nil
}

// Listener returns the active net.Listener, if any.
func (s *Server) Listener() net.Listener {
	return s.listener
}
