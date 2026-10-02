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
