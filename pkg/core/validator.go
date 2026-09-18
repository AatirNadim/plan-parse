package core

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	tfjson "github.com/hashicorp/terraform-json"
)

// ValidatePlanFile validates file existence, extension (.json), and Terraform plan schema.
func ValidatePlanFile(filePath string) (*tfjson.Plan, error) {
	if strings.TrimSpace(filePath) == "" {
		return nil, fmt.Errorf("file path cannot be empty")
	}

	info, err := os.Stat(filePath)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, fmt.Errorf("file does not exist: %s", filePath)
		}
		return nil, fmt.Errorf("error accessing file: %w", err)
	}

	if info.IsDir() {
		return nil, fmt.Errorf("path is a directory, expected a JSON file: %s", filePath)
	}

	if strings.ToLower(filepath.Ext(filePath)) != ".json" {
		return nil, fmt.Errorf("invalid file extension %q: expected .json", filepath.Ext(filePath))
	}

	data, err := os.ReadFile(filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to read file: %w", err)
	}

	return ValidatePlanBytes(data)
}

// ValidatePlanBytes performs schema validation on raw Terraform plan JSON bytes.
// It checks that format_version and terraform_version are present and non-empty,
// and validates that the payload parses into a valid tfjson.Plan structure.
func ValidatePlanBytes(data []byte) (*tfjson.Plan, error) {
	if len(data) == 0 {
		return nil, fmt.Errorf("plan JSON data is empty")
	}

	var raw map[string]interface{}
	if err := json.Unmarshal(data, &raw); err != nil {
		return nil, fmt.Errorf("invalid JSON: %w", err)
	}

	fv, ok := raw["format_version"].(string)
	if !ok || strings.TrimSpace(fv) == "" {
		return nil, fmt.Errorf("invalid terraform plan: missing or empty format_version")
	}

	tv, ok := raw["terraform_version"].(string)
	if !ok || strings.TrimSpace(tv) == "" {
		return nil, fmt.Errorf("invalid terraform plan: missing or empty terraform_version")
	}

	var plan tfjson.Plan
	if err := json.Unmarshal(data, &plan); err != nil {
		return nil, fmt.Errorf("failed to parse terraform plan: %w", err)
	}

	if err := plan.Validate(); err != nil {
		return nil, fmt.Errorf("terraform plan validation failed: %w", err)
	}

	return &plan, nil
}
