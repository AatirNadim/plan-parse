package main

import (
	"flag"
	"fmt"
	"log"
	"os/exec"
	"path/filepath"
	"runtime"
	"time"

	"plan-parse/pkg/core"
	"plan-parse/pkg/server"
)

func openBrowser(url string) error {
	var cmd *exec.Cmd
	switch runtime.GOOS {
	case "darwin":
		cmd = exec.Command("open", url)
	case "windows":
		cmd = exec.Command("rundll32", "url.dll,FileProtocolHandler", url)
	default:
		cmd = exec.Command("xdg-open", url)
	}
	return cmd.Start()
}

func main() {
	var (
		planPath  string
		port      int
		addr      string
		noBrowser bool
	)

	flag.StringVar(&planPath, "plan", "", "Path to Terraform plan JSON file")
	flag.IntVar(&port, "port", 9000, "Port to listen on")
	flag.StringVar(&addr, "addr", "127.0.0.1", "Address to bind to")
	flag.BoolVar(&noBrowser, "no-browser", false, "Do not automatically open browser")
	flag.Parse()

	var cliGraph *core.Graph

	if planPath != "" {
		absPlanPath, err := filepath.Abs(planPath)
		if err != nil {
			log.Fatalf("Error resolving plan path: %v", err)
		}

		log.Printf("Validating plan file: %s", absPlanPath)
		plan, err := core.ValidatePlanFile(absPlanPath)
		if err != nil {
			log.Fatalf("Plan validation failed: %v", err)
		}

		planDir := filepath.Dir(absPlanPath)
		parser := core.NewParser(plan, planDir)
		graph, err := parser.GenerateGraph()
		if err != nil {
			log.Fatalf("Failed to generate DAG from plan: %v", err)
		}

		cliGraph = graph
		log.Printf("Successfully loaded plan: %d resources (%d to create, %d to update, %d to delete, %d to replace)",
			graph.Summary.Total, graph.Summary.Create, graph.Summary.Update, graph.Summary.Delete, graph.Summary.Replace)
	}

	srv := server.NewServer(addr, port, cliGraph)

	serverURL := fmt.Sprintf("http://%s:%d", addr, port)

	if !noBrowser {
		go func() {
			// Small delay for listener to bind
			time.Sleep(200 * time.Millisecond)
			log.Printf("Opening browser at %s", serverURL)
			_ = openBrowser(serverURL)
		}()
	}

	log.Printf("Plan-parse starting at %s ...", serverURL)
	if err := srv.Start(); err != nil {
		log.Fatalf("Server error: %v", err)
	}
}
