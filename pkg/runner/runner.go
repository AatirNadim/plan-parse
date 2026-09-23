package runner

import (
	"bytes"
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
)

// CheckTerraformBinary looks for a terraform (or tofu) executable in PATH
// and verifies it can run.
func CheckTerraformBinary() (string, error) {
	binPath, err := exec.LookPath("terraform")
	if err != nil {
		binPath, err = exec.LookPath("tofu")
	}
	if err != nil {
		return "", &RunnerError{
			Category: ErrCategoryExecution,
			Message:  "Terraform binary not found in PATH",
			Details:  "Neither 'terraform' nor 'tofu' executable was found in system PATH",
			Hint:     "Please install Terraform (https://developer.hashicorp.com/terraform/install) or OpenTofu (https://opentofu.org/docs/intro/install/) and ensure it is available in your PATH.",
		}
	}

	cmd := exec.Command(binPath, "version")
	out, err := cmd.CombinedOutput()
	if err != nil {
		return "", &RunnerError{
			Category: ErrCategoryExecution,
			Message:  "Failed to execute Terraform binary",
			Details:  fmt.Sprintf("%v: %s", err, string(out)),
			Hint:     "Ensure the terraform binary has execution permissions and is compatible with your system architecture.",
		}
	}

	return binPath, nil
}

// GeneratePlanJSON validates the target directory, checks for the Terraform binary,
// generates a temporary binary plan file via 'terraform plan', and extracts its JSON representation via 'terraform show -json'.
func GeneratePlanJSON(dir string) ([]byte, error) {
	return GeneratePlanJSONContext(context.Background(), dir)
}

// GeneratePlanJSONContext generates plan JSON with context cancellation and timeout support.
func GeneratePlanJSONContext(ctx context.Context, dir string) ([]byte, error) {
	if err := ValidateTerraformDir(dir); err != nil {
		return nil, err
	}

	binPath, err := CheckTerraformBinary()
	if err != nil {
		return nil, err
	}

	absDir, err := filepath.Abs(dir)
	if err != nil {
		return nil, &RunnerError{
			Category: ErrCategoryExecution,
			Message:  "Failed to resolve directory path",
			Details:  err.Error(),
			Hint:     "Check that the directory path syntax is valid.",
		}
	}

	// Create temporary plan output file outside target directory so dir can be mounted read-only (:ro)
	tempFile, err := os.CreateTemp("", "plan-parse-*.tfplan")
	if err != nil {
		return nil, &RunnerError{
			Category: ErrCategoryExecution,
			Message:  "Failed to create temporary plan file",
			Details:  err.Error(),
			Hint:     "Ensure system temporary directory (e.g. /tmp) is writable.",
		}
	}
	tempPlanPath := tempFile.Name()
	_ = tempFile.Close()
	defer os.Remove(tempPlanPath)

	env := append(os.Environ(), "TF_IN_AUTOMATION=1")

	// Execute terraform plan
	planCmd := exec.CommandContext(ctx, binPath, "plan", "-input=false", "-no-color", "-out="+tempPlanPath)
	planCmd.Dir = absDir
	planCmd.Env = env

	planOutput, planErr := planCmd.CombinedOutput()
	if planErr != nil {
		return nil, ClassifyTerraformError(string(planOutput), planErr)
	}

	// Execute terraform show -json
	showCmd := exec.CommandContext(ctx, binPath, "show", "-json", tempPlanPath)
	showCmd.Dir = absDir
	showCmd.Env = env

	var stdout, stderr bytes.Buffer
	showCmd.Stdout = &stdout
	showCmd.Stderr = &stderr

	if err := showCmd.Run(); err != nil {
		combined := stderr.String()
		if combined == "" {
			combined = stdout.String()
		}
		return nil, ClassifyTerraformError(combined, err)
	}

	return stdout.Bytes(), nil
}
