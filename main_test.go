package main

import (
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
}
