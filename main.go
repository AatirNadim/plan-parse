package main

import (
	"errors"
	"flag"
	"fmt"
	"log"
	"os/exec"
	"path/filepath"
	"runtime"
	"time"

	"github.com/AatirNadim/plan-parse/pkg/core"
	"github.com/AatirNadim/plan-parse/pkg/runner"
	"github.com/AatirNadim/plan-parse/pkg/server"
)

var version = "dev"

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
		planPath    string
		dirPath     string
		port        int
		addr        string
		noBrowser   bool
		showVersion bool
	)

	flag.StringVar(&planPath, "plan", "", "Path to Terraform plan JSON file")
	flag.StringVar(&dirPath, "dir", "", "Path to directory containing Terraform configuration files")
	flag.IntVar(&port, "port", 9000, "Port to listen on")
	flag.StringVar(&addr, "addr", "127.0.0.1", "Address to bind to")
	flag.BoolVar(&noBrowser, "no-browser", false, "Do not automatically open browser")
	flag.BoolVar(&showVersion, "version", false, "Print version information and exit")
	flag.BoolVar(&showVersion, "v", false, "Print version information and exit (shorthand)")
	flag.Parse()

	if showVersion {
		fmt.Printf("plan-parse %s\n", version)
		return
	}

	if planPath != "" && dirPath != "" {
		log.Fatalf("Error: -plan and -dir flags are mutually exclusive. Please provide either a plan file or a directory, not both.")
	}

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
	} else if dirPath != "" {
		absDir, err := filepath.Abs(dirPath)
		if err != nil {
			log.Fatalf("Error resolving directory path: %v", err)
		}

		log.Printf("Validating Terraform directory: %s", absDir)
		planData, err := runner.GeneratePlanJSON(absDir)
		if err != nil {
			var runnerErr *runner.RunnerError
			if errors.As(err, &runnerErr) {
				fmt.Print(runnerErr.FormatCLI())
				log.Fatalf("Plan generation failed")
			}
			log.Fatalf("Plan generation failed: %v", err)
		}

		plan, err := core.ValidatePlanBytes(planData)
		if err != nil {
			log.Fatalf("Plan validation failed: %v", err)
		}

		parser := core.NewParser(plan, absDir)
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

	log.Printf("Plan-parse %s starting at %s ...", version, serverURL)
	if err := srv.Start(); err != nil {
		log.Fatalf("Server error: %v", err)
	}
}
