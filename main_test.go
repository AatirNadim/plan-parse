package main

import (
	"bufio"
	"bytes"
	"os/exec"
	"strings"
	"testing"
)

func TestVersionFlag(t *testing.T) {
	cmd := exec.Command("go", "run", "-ldflags=-X main.version=v1.2.3-unit-test", "main.go", "-v")
	var stdout bytes.Buffer
	var stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	if err := cmd.Run(); err != nil {
		t.Fatalf("Failed to run main with -v: %v\nStderr: %s", err, stderr.String())
	}

	expected := "plan-parse v1.2.3-unit-test"
	if strings.TrimSpace(stdout.String()) != expected {
		t.Fatalf("Expected output %q, got %q", expected, strings.TrimSpace(stdout.String()))
	}
}

func TestVersionLongFlag(t *testing.T) {
	cmd := exec.Command("go", "run", "-ldflags=-X main.version=v1.2.3-unit-test", "main.go", "-version")
	var stdout bytes.Buffer
	var stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	if err := cmd.Run(); err != nil {
		t.Fatalf("Failed to run main with -version: %v\nStderr: %s", err, stderr.String())
	}

	expected := "plan-parse v1.2.3-unit-test"
	if strings.TrimSpace(stdout.String()) != expected {
		t.Fatalf("Expected output %q, got %q", expected, strings.TrimSpace(stdout.String()))
	}
}

func TestHelpFlag(t *testing.T) {
	cmd := exec.Command("go", "run", "main.go", "--help")
	var output bytes.Buffer
	cmd.Stdout = &output
	cmd.Stderr = &output

	// Flag package returns exit code 2 on --help / -h
	_ = cmd.Run()

	out := output.String()
	if !strings.Contains(out, "-no-banner") {
		t.Errorf("Expected --help output to contain -no-banner flag documentation, got:\n%s", out)
	}
	if !strings.Contains(out, "Do not display the startup banner") {
		t.Errorf("Expected --help output to contain banner description, got:\n%s", out)
	}
	if !strings.Contains(out, "-version") {
		t.Errorf("Expected --help output to contain -version, got:\n%s", out)
	}
	if !strings.Contains(out, "-collapsed") {
		t.Errorf("Expected --help output to contain -collapsed flag documentation, got:\n%s", out)
	}
	if !strings.Contains(out, "Start with graph collapsed to mutating resources") {
		t.Errorf("Expected --help output to contain -collapsed description, got:\n%s", out)
	}
	if !strings.Contains(out, "default true") {
		t.Errorf("Expected --help output to show default true for -collapsed flag, got:\n%s", out)
	}
}

func TestCollapsedFlagHelp(t *testing.T) {
	cmd := exec.Command("go", "run", "main.go", "--help")
	var output bytes.Buffer
	cmd.Stdout = &output
	cmd.Stderr = &output
	_ = cmd.Run()

	out := output.String()
	if !strings.Contains(out, "-collapsed") {
		t.Fatalf("expected --help to list -collapsed flag, got:\n%s", out)
	}
	if !strings.Contains(out, "Start with graph collapsed to mutating resources") {
		t.Fatalf("expected -collapsed description in --help, got:\n%s", out)
	}
	if !strings.Contains(out, "default true") {
		t.Fatalf("expected default true for -collapsed in --help, got:\n%s", out)
	}
}

func TestPositionalPlanArg(t *testing.T) {
	cmd := exec.Command("go", "run", "main.go", "-no-browser", "-no-banner", "-port=0", "-collapsed=false", "./testdata/tf_plan.json")
	stderrPipe, err := cmd.StderrPipe()
	if err != nil {
		t.Fatalf("failed to create stderr pipe: %v", err)
	}

	if err := cmd.Start(); err != nil {
		t.Fatalf("failed to start plan-parse with positional plan arg: %v", err)
	}
	defer func() {
		if cmd.Process != nil {
			_ = cmd.Process.Kill()
			_ = cmd.Wait()
		}
	}()

	scanner := bufio.NewScanner(stderrPipe)
	loaded := false
	validating := false
	for scanner.Scan() {
		line := scanner.Text()
		if strings.Contains(line, "Validating plan file") && strings.Contains(line, "tf_plan.json") {
			validating = true
		}
		if strings.Contains(line, "Successfully loaded plan: 66 resources") {
			loaded = true
			break
		}
	}

	if !validating {
		t.Errorf("expected stderr to contain 'Validating plan file', but it did not")
	}
	if !loaded {
		t.Errorf("expected stderr to contain 'Successfully loaded plan: 66 resources', but it did not")
	}
}

func TestPositionalDirArg(t *testing.T) {
	cmd := exec.Command("go", "run", "main.go", "-no-browser", "-no-banner", "-port=0", "./testdata")
	stderrPipe, err := cmd.StderrPipe()
	if err != nil {
		t.Fatalf("failed to create stderr pipe: %v", err)
	}

	if err := cmd.Start(); err != nil {
		t.Fatalf("failed to start plan-parse with positional dir arg: %v", err)
	}
	defer func() {
		if cmd.Process != nil {
			_ = cmd.Process.Kill()
			_ = cmd.Wait()
		}
	}()

	scanner := bufio.NewScanner(stderrPipe)
	validatingDir := false
	for scanner.Scan() {
		line := scanner.Text()
		if strings.Contains(line, "Validating Terraform directory") && strings.Contains(line, "testdata") {
			validatingDir = true
			break
		}
	}

	if !validatingDir {
		t.Errorf("expected stderr to contain 'Validating Terraform directory', but it did not")
	}
}

func TestPositionalPlanArg_NonExistentFile(t *testing.T) {
	cmd := exec.Command("go", "run", "main.go", "-no-browser", "-no-banner", "./nonexistent_file.json")
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	err := cmd.Run()
	if err == nil {
		t.Fatalf("expected command to fail with non-existent positional file")
	}

	out := stderr.String() + stdout.String()
	if !strings.Contains(out, "Plan validation failed") && !strings.Contains(out, "no such file") {
		t.Errorf("expected output to mention plan validation failure or no such file, got: %s", out)
	}
}

