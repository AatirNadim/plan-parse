package runner

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

// ValidateTerraformDir validates that dir exists, is accessible, is a directory,
// and contains readable Terraform configuration files (.tf or .tf.json).
func ValidateTerraformDir(dir string) error {
	trimmed := strings.TrimSpace(dir)
	if trimmed == "" {
		return &RunnerError{
			Category: ErrCategoryConfiguration,
			Message:  "Directory path cannot be empty",
			Details:  "No directory path was provided to validate",
			Hint:     "Provide a valid path to a directory containing Terraform configuration files using the -dir flag.",
		}
	}

	absDir, err := filepath.Abs(trimmed)
	if err != nil {
		return &RunnerError{
			Category: ErrCategoryExecution,
			Message:  "Failed to resolve directory path",
			Details:  err.Error(),
			Hint:     "Check that the directory path syntax is valid for this operating system.",
		}
	}

	info, err := os.Stat(absDir)
	if err != nil {
		if os.IsNotExist(err) {
			return &RunnerError{
				Category: ErrCategoryConfiguration,
				Message:  "Directory does not exist",
				Details:  fmt.Sprintf("Path %q does not exist", absDir),
				Hint:     "Verify that the specified directory path exists.",
			}
		}
		if os.IsPermission(err) || strings.Contains(strings.ToLower(err.Error()), "permission denied") {
			return &RunnerError{
				Category: ErrCategoryPermission,
				Message:  "Permission denied accessing directory",
				Details:  err.Error(),
				Hint:     "Check filesystem permissions for the target directory.",
			}
		}
		return &RunnerError{
			Category: ErrCategoryExecution,
			Message:  "Failed to access directory",
			Details:  err.Error(),
			Hint:     "Ensure the directory path is accessible.",
		}
	}

	if !info.IsDir() {
		return &RunnerError{
			Category: ErrCategoryConfiguration,
			Message:  "Path is not a directory",
			Details:  fmt.Sprintf("%q is a file, expected a directory", absDir),
			Hint:     "Specify a directory containing .tf or .tf.json files, not a file path.",
		}
	}

	entries, err := os.ReadDir(absDir)
	if err != nil {
		if os.IsPermission(err) || strings.Contains(strings.ToLower(err.Error()), "permission denied") {
			return &RunnerError{
				Category: ErrCategoryPermission,
				Message:  "Permission denied reading directory contents",
				Details:  err.Error(),
				Hint:     "Ensure the user has read and execute permissions on the directory.",
			}
		}
		return &RunnerError{
			Category: ErrCategoryExecution,
			Message:  "Failed to read directory contents",
			Details:  err.Error(),
			Hint:     "Ensure the directory contents can be listed.",
		}
	}

	var tfFiles []string
	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}
		name := entry.Name()
		lower := strings.ToLower(name)
		if strings.HasSuffix(lower, ".tf") || strings.HasSuffix(lower, ".tf.json") {
			tfFiles = append(tfFiles, filepath.Join(absDir, name))
		}
	}

	if len(tfFiles) == 0 {
		return &RunnerError{
			Category: ErrCategoryConfiguration,
			Message:  "No Terraform configuration files found",
			Details:  fmt.Sprintf("Directory %q does not contain any .tf or .tf.json files", absDir),
			Hint:     "Ensure the target directory contains Terraform configuration files (.tf or .tf.json).",
		}
	}

	for _, tfFile := range tfFiles {
		f, err := os.Open(tfFile)
		if err != nil {
			if os.IsPermission(err) || strings.Contains(strings.ToLower(err.Error()), "permission denied") {
				return &RunnerError{
					Category: ErrCategoryPermission,
					Message:  "Permission denied reading Terraform configuration file",
					Details:  fmt.Sprintf("Failed to read file %q: %v", tfFile, err),
					Hint:     "Ensure read permissions are granted on all .tf and .tf.json files in the directory.",
				}
			}
			return &RunnerError{
				Category: ErrCategoryExecution,
				Message:  "Failed to open Terraform configuration file",
				Details:  fmt.Sprintf("Failed to open file %q: %v", tfFile, err),
				Hint:     "Ensure the configuration file is accessible and readable.",
			}
		}
		_ = f.Close()
	}

	return nil
}
