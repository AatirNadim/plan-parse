package runner

import (
	"errors"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestValidateTerraformDir(t *testing.T) {
	t.Run("empty directory path", func(t *testing.T) {
		err := ValidateTerraformDir("")
		if err == nil {
			t.Fatal("expected error for empty directory, got nil")
		}
		var runnerErr *RunnerError
		if !errors.As(err, &runnerErr) {
			t.Fatalf("expected RunnerError, got %T", err)
		}
		if runnerErr.Category != ErrCategoryConfiguration {
			t.Errorf("expected ErrCategoryConfiguration, got %s", runnerErr.Category)
		}
	})

	t.Run("whitespace directory path", func(t *testing.T) {
		err := ValidateTerraformDir("   ")
		if err == nil {
			t.Fatal("expected error for whitespace directory, got nil")
		}
		var runnerErr *RunnerError
		if !errors.As(err, &runnerErr) {
			t.Fatalf("expected RunnerError, got %T", err)
		}
		if runnerErr.Category != ErrCategoryConfiguration {
			t.Errorf("expected ErrCategoryConfiguration, got %s", runnerErr.Category)
		}
	})

	t.Run("non-existent directory", func(t *testing.T) {
		nonExistent := filepath.Join(t.TempDir(), "does_not_exist_xyz")
		err := ValidateTerraformDir(nonExistent)
		if err == nil {
			t.Fatal("expected error for non-existent directory, got nil")
		}
		var runnerErr *RunnerError
		if !errors.As(err, &runnerErr) {
			t.Fatalf("expected RunnerError, got %T", err)
		}
		if runnerErr.Category != ErrCategoryConfiguration {
			t.Errorf("expected ErrCategoryConfiguration, got %s", runnerErr.Category)
		}
	})

	t.Run("file instead of directory", func(t *testing.T) {
		tempDir := t.TempDir()
		filePath := filepath.Join(tempDir, "test.tf")
		if err := os.WriteFile(filePath, []byte("# dummy"), 0644); err != nil {
			t.Fatalf("failed to create dummy file: %v", err)
		}
		err := ValidateTerraformDir(filePath)
		if err == nil {
			t.Fatal("expected error when path is a file, got nil")
		}
		var runnerErr *RunnerError
		if !errors.As(err, &runnerErr) {
			t.Fatalf("expected RunnerError, got %T", err)
		}
		if runnerErr.Category != ErrCategoryConfiguration {
			t.Errorf("expected ErrCategoryConfiguration, got %s", runnerErr.Category)
		}
	})

	t.Run("directory without tf files", func(t *testing.T) {
		tempDir := t.TempDir()
		// create a non-tf file
		if err := os.WriteFile(filepath.Join(tempDir, "readme.txt"), []byte("hello"), 0644); err != nil {
			t.Fatalf("failed to create readme: %v", err)
		}
		err := ValidateTerraformDir(tempDir)
		if err == nil {
			t.Fatal("expected error for directory without .tf files, got nil")
		}
		var runnerErr *RunnerError
		if !errors.As(err, &runnerErr) {
			t.Fatalf("expected RunnerError, got %T", err)
		}
		if runnerErr.Category != ErrCategoryConfiguration {
			t.Errorf("expected ErrCategoryConfiguration, got %s", runnerErr.Category)
		}
	})

	t.Run("valid directory with .tf file", func(t *testing.T) {
		tempDir := t.TempDir()
		if err := os.WriteFile(filepath.Join(tempDir, "main.tf"), []byte(`resource "null_resource" "test" {}`), 0644); err != nil {
			t.Fatalf("failed to create main.tf: %v", err)
		}
		err := ValidateTerraformDir(tempDir)
		if err != nil {
			t.Fatalf("expected nil for valid directory with .tf, got: %v", err)
		}
	})

	t.Run("valid directory with .tf.json file", func(t *testing.T) {
		tempDir := t.TempDir()
		if err := os.WriteFile(filepath.Join(tempDir, "main.tf.json"), []byte(`{}`), 0644); err != nil {
			t.Fatalf("failed to create main.tf.json: %v", err)
		}
		err := ValidateTerraformDir(tempDir)
		if err != nil {
			t.Fatalf("expected nil for valid directory with .tf.json, got: %v", err)
		}
	})

	t.Run("valid directory using testdata", func(t *testing.T) {
		testdataDir := filepath.Join("..", "..", "testdata")
		err := ValidateTerraformDir(testdataDir)
		if err != nil {
			t.Fatalf("expected nil for testdata directory, got: %v", err)
		}
	})

	t.Run("unreadable .tf file returns permission error", func(t *testing.T) {
		if os.Geteuid() == 0 {
			t.Skip("skipping permission test when running as root")
		}
		tempDir := t.TempDir()
		tfPath := filepath.Join(tempDir, "main.tf")
		if err := os.WriteFile(tfPath, []byte(`resource "null_resource" "test" {}`), 0000); err != nil {
			t.Fatalf("failed to create unreadable file: %v", err)
		}
		defer os.Chmod(tfPath, 0644) // cleanup
		err := ValidateTerraformDir(tempDir)
		if err == nil {
			t.Fatal("expected error for unreadable .tf file, got nil")
		}
		var runnerErr *RunnerError
		if !errors.As(err, &runnerErr) {
			t.Fatalf("expected RunnerError, got %T", err)
		}
		if runnerErr.Category != ErrCategoryPermission {
			t.Errorf("expected ErrCategoryPermission, got %s", runnerErr.Category)
		}
	})
}

func TestClassifyTerraformError(t *testing.T) {
	tests := []struct {
		name             string
		output           string
		exitErr          error
		expectedCategory ErrorCategory
	}{
		// AWS Authentication
		{
			name:             "AWS NoCredentialProviders",
			output:           "Error: error configuring Terraform AWS Provider: NoCredentialProviders: no valid providers in chain",
			exitErr:          errors.New("exit status 1"),
			expectedCategory: ErrCategoryAuth,
		},
		{
			name:             "AWS ExpiredToken",
			output:           "Error: error configuring Terraform AWS Provider: ExpiredToken: The security token included in the request is expired",
			exitErr:          errors.New("exit status 1"),
			expectedCategory: ErrCategoryAuth,
		},
		{
			name:             "AWS AccessDenied",
			output:           "Error: describing EC2 Instances: AccessDenied: User is not authorized to perform: ec2:DescribeInstances",
			exitErr:          errors.New("exit status 1"),
			expectedCategory: ErrCategoryAuth,
		},
		{
			name:             "AWS SignatureDoesNotMatch",
			output:           "Error: SignatureDoesNotMatch: The request signature we calculated does not match the signature you provided.",
			exitErr:          errors.New("exit status 1"),
			expectedCategory: ErrCategoryAuth,
		},
		{
			name:             "AWS UnauthorizedOperation",
			output:           "Error: UnauthorizedOperation: You are not authorized to perform this operation.",
			exitErr:          errors.New("exit status 1"),
			expectedCategory: ErrCategoryAuth,
		},
		{
			name:             "AWS InvalidClientTokenId",
			output:           "Error: InvalidClientTokenId: The security token included in the request is invalid.",
			exitErr:          errors.New("exit status 1"),
			expectedCategory: ErrCategoryAuth,
		},

		// GCP Authentication
		{
			name:             "GCP could not find default credentials",
			output:           "google: could not find default credentials. See https://cloud.google.com/docs/authentication/external/set-up-adc",
			exitErr:          errors.New("exit status 1"),
			expectedCategory: ErrCategoryAuth,
		},
		{
			name:             "GCP oauth2 token error",
			output:           "oauth2 token retrieval failed: unexpected response from identity provider",
			exitErr:          errors.New("exit status 1"),
			expectedCategory: ErrCategoryAuth,
		},
		{
			name:             "GCP compute metadata error",
			output:           "error connecting to compute/metadata service on Google Cloud",
			exitErr:          errors.New("exit status 1"),
			expectedCategory: ErrCategoryAuth,
		},

		// Azure Authentication
		{
			name:             "Azure az login required",
			output:           "Error: building AzureRM Client: Please run 'az login' to setup account.",
			exitErr:          errors.New("exit status 1"),
			expectedCategory: ErrCategoryAuth,
		},
		{
			name:             "Azure ARM_CLIENT_SECRET missing or invalid",
			output:           "Error: ARM_CLIENT_SECRET must be set when authenticating as a Service Principal",
			exitErr:          errors.New("exit status 1"),
			expectedCategory: ErrCategoryAuth,
		},
		{
			name:             "Azure AuthenticationFailed",
			output:           "AuthenticationFailed: The client secret provided is invalid or expired.",
			exitErr:          errors.New("exit status 1"),
			expectedCategory: ErrCategoryAuth,
		},

		// TFC / HTTP 401 / 403
		{
			name:             "TFC 401 Unauthorized",
			output:           "Error: 401 Unauthorized: The provided token is invalid",
			exitErr:          errors.New("exit status 1"),
			expectedCategory: ErrCategoryAuth,
		},
		{
			name:             "TFC 403 Forbidden",
			output:           "Error: 403 Forbidden: Insufficient permissions for workspace",
			exitErr:          errors.New("exit status 1"),
			expectedCategory: ErrCategoryAuth,
		},
		{
			name:             "TFC_TOKEN invalid",
			output:           "Error: TFC_TOKEN was provided but could not authenticate with Terraform Cloud",
			exitErr:          errors.New("exit status 1"),
			expectedCategory: ErrCategoryAuth,
		},

		// Version Incompatibility
		{
			name:             "Unsupported Terraform Core version",
			output:           "Error: Unsupported Terraform Core version\nThis configuration requires Terraform version ~> 1.10.0.",
			exitErr:          errors.New("exit status 1"),
			expectedCategory: ErrCategoryVersion,
		},
		{
			name:             "This configuration requires Terraform version",
			output:           "This configuration requires Terraform version 1.9.0 or higher.",
			exitErr:          errors.New("exit status 1"),
			expectedCategory: ErrCategoryVersion,
		},
		{
			name:             "required_version constraint",
			output:           "Error: terraform required_version condition not satisfied.",
			exitErr:          errors.New("exit status 1"),
			expectedCategory: ErrCategoryVersion,
		},
		{
			name:             "Incompatible provider version",
			output:           "Error: Incompatible provider version: provider registry.terraform.io/hashicorp/aws v5.0.0 is not compatible with version constraint ~> 4.0",
			exitErr:          errors.New("exit status 1"),
			expectedCategory: ErrCategoryVersion,
		},
		{
			name:             "version constraint violation",
			output:           "Error: Failed to query available provider packages: no available releases match the given version constraint",
			exitErr:          errors.New("exit status 1"),
			expectedCategory: ErrCategoryVersion,
		},

		// Permission Denied
		{
			name:             "permission denied",
			output:           "Error: open /etc/ssl/certs: permission denied",
			exitErr:          errors.New("exit status 1"),
			expectedCategory: ErrCategoryPermission,
		},
		{
			name:             "EACCES",
			output:           "Error: EACCES: permission denied, open '/var/run/docker.sock'",
			exitErr:          errors.New("exit status 1"),
			expectedCategory: ErrCategoryPermission,
		},
		{
			name:             "Access is denied",
			output:           "Error: Access is denied when writing to state cache",
			exitErr:          errors.New("exit status 1"),
			expectedCategory: ErrCategoryPermission,
		},
		{
			name:             "operation not permitted",
			output:           "Error: operation not permitted on socket",
			exitErr:          errors.New("exit status 1"),
			expectedCategory: ErrCategoryPermission,
		},

		// Initialization Required
		{
			name:             "Backend initialization required",
			output:           "Error: Backend initialization required, please run \"terraform init\"",
			exitErr:          errors.New("exit status 1"),
			expectedCategory: ErrCategoryInitialization,
		},
		{
			name:             "run terraform init",
			output:           "Error: Could not load plugin. Run \"terraform init\" to install plugins.",
			exitErr:          errors.New("exit status 1"),
			expectedCategory: ErrCategoryInitialization,
		},
		{
			name:             "Plugin reinitialization required",
			output:           "Plugin reinitialization required. Please run \"terraform init\".",
			exitErr:          errors.New("exit status 1"),
			expectedCategory: ErrCategoryInitialization,
		},
		{
			name:             "Module not installed",
			output:           "Error: Module not installed: This module is not yet installed. Run \"terraform init\" to install all modules.",
			exitErr:          errors.New("exit status 1"),
			expectedCategory: ErrCategoryInitialization,
		},
		{
			name:             "Could not load plugin",
			output:           "Error: Could not load plugin: provider cache missing plugin binary",
			exitErr:          errors.New("exit status 1"),
			expectedCategory: ErrCategoryInitialization,
		},

		// Configuration Issues
		{
			name:             "No value for required variable",
			output:           "Error: No value for required variable: The argument \"environment\" is required, but was not set.",
			exitErr:          errors.New("exit status 1"),
			expectedCategory: ErrCategoryConfiguration,
		},
		{
			name:             "Reference to undeclared",
			output:           "Error: Reference to undeclared input variable \"vpc_id\"",
			exitErr:          errors.New("exit status 1"),
			expectedCategory: ErrCategoryConfiguration,
		},
		{
			name:             "syntax error",
			output:           "Error: syntax error: unexpected closing bracket at line 42",
			exitErr:          errors.New("exit status 1"),
			expectedCategory: ErrCategoryConfiguration,
		},
		{
			name:             "Missing required argument",
			output:           "Error: Missing required argument: The argument \"cidr_block\" is required, but no definition was found.",
			exitErr:          errors.New("exit status 1"),
			expectedCategory: ErrCategoryConfiguration,
		},
		{
			name:             "Unsupported argument",
			output:           "Error: Unsupported argument: An argument named \"foo\" is not expected here.",
			exitErr:          errors.New("exit status 1"),
			expectedCategory: ErrCategoryConfiguration,
		},

		// Execution Default
		{
			name:             "generic unclassified execution failure",
			output:           "Error: connection reset by peer during plan phase",
			exitErr:          errors.New("exit status 1"),
			expectedCategory: ErrCategoryExecution,
		},
		{
			name:             "empty output falls back to exit error",
			output:           "",
			exitErr:          errors.New("command terminated with exit status 127"),
			expectedCategory: ErrCategoryExecution,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			runnerErr := ClassifyTerraformError(tc.output, tc.exitErr)
			if runnerErr == nil {
				t.Fatal("expected non-nil RunnerError")
			}
			if runnerErr.Category != tc.expectedCategory {
				t.Errorf("category mismatch: got %q, want %q", runnerErr.Category, tc.expectedCategory)
			}
			if runnerErr.Hint == "" {
				t.Error("expected non-empty Hint")
			}
			if runnerErr.Message == "" {
				t.Error("expected non-empty Message")
			}
			if runnerErr.Details == "" {
				t.Error("expected non-empty Details")
			}
		})
	}
}

func TestRunnerErrorFormatting(t *testing.T) {
	err := &RunnerError{
		Category: ErrCategoryAuth,
		Message:  "Cloud provider authentication failed",
		Details:  "NoCredentialProviders: no valid providers in chain",
		Hint:     "Set AWS_PROFILE or AWS_ACCESS_KEY_ID",
	}

	// Error() output check
	errStr := err.Error()
	if !strings.Contains(errStr, "[AUTHENTICATION]") {
		t.Errorf("Error() missing category: %s", errStr)
	}
	if !strings.Contains(errStr, "Cloud provider authentication failed") {
		t.Errorf("Error() missing message: %s", errStr)
	}

	// FormatCLI() output check
	cliStr := err.FormatCLI()
	if !strings.Contains(cliStr, "[AUTHENTICATION ERROR]") {
		t.Errorf("FormatCLI() missing header: %s", cliStr)
	}
	if !strings.Contains(cliStr, "Details: NoCredentialProviders: no valid providers in chain") {
		t.Errorf("FormatCLI() missing details: %s", cliStr)
	}
	if !strings.Contains(cliStr, "Hint:    Set AWS_PROFILE or AWS_ACCESS_KEY_ID") {
		t.Errorf("FormatCLI() missing hint: %s", cliStr)
	}
}

func TestCheckTerraformBinary(t *testing.T) {
	t.Run("binary present on host", func(t *testing.T) {
		binPath, err := CheckTerraformBinary()
		if err != nil {
			t.Skipf("skipping test: terraform or tofu binary not found on host: %v", err)
		}
		if binPath == "" {
			t.Fatal("expected non-empty binary path")
		}
	})

	t.Run("binary missing in empty PATH", func(t *testing.T) {
		t.Setenv("PATH", t.TempDir())
		_, err := CheckTerraformBinary()
		if err == nil {
			t.Fatal("expected error when terraform binary is missing from PATH, got nil")
		}
		var runnerErr *RunnerError
		if !errors.As(err, &runnerErr) {
			t.Fatalf("expected RunnerError, got %T", err)
		}
		if runnerErr.Category != ErrCategoryExecution {
			t.Errorf("expected ErrCategoryExecution, got %s", runnerErr.Category)
		}
		if !strings.Contains(runnerErr.Hint, "install Terraform") {
			t.Errorf("expected install hint, got %s", runnerErr.Hint)
		}
	})
}

func TestGeneratePlanJSON(t *testing.T) {
	t.Run("fails on non-existent directory", func(t *testing.T) {
		nonExistent := filepath.Join(t.TempDir(), "non_existent_folder")
		_, err := GeneratePlanJSON(nonExistent)
		if err == nil {
			t.Fatal("expected error for non-existent directory, got nil")
		}
		var runnerErr *RunnerError
		if !errors.As(err, &runnerErr) {
			t.Fatalf("expected RunnerError, got %T", err)
		}
		if runnerErr.Category != ErrCategoryConfiguration {
			t.Errorf("expected ErrCategoryConfiguration, got %s", runnerErr.Category)
		}
	})

	t.Run("fails on directory without tf files", func(t *testing.T) {
		emptyDir := t.TempDir()
		_, err := GeneratePlanJSON(emptyDir)
		if err == nil {
			t.Fatal("expected error for directory without tf files, got nil")
		}
		var runnerErr *RunnerError
		if !errors.As(err, &runnerErr) {
			t.Fatalf("expected RunnerError, got %T", err)
		}
		if runnerErr.Category != ErrCategoryConfiguration {
			t.Errorf("expected ErrCategoryConfiguration, got %s", runnerErr.Category)
		}
	})

	t.Run("end-to-end pipeline against testdata produces classified error", func(t *testing.T) {
		if _, err := CheckTerraformBinary(); err != nil {
			t.Skipf("skipping test: terraform or tofu binary not found on host: %v", err)
		}
		testdataDir := filepath.Join("..", "..", "testdata")
		_, err := GeneratePlanJSON(testdataDir)
		if err == nil {
			t.Fatal("expected plan generation to fail on uninitialized testdata, got nil")
		}
		var runnerErr *RunnerError
		if !errors.As(err, &runnerErr) {
			t.Fatalf("expected RunnerError, got %T", err)
		}
		// testdata requires terraform init, so it should be classified as initialization required
		if runnerErr.Category != ErrCategoryInitialization {
			t.Errorf("expected ErrCategoryInitialization, got %s", runnerErr.Category)
		}
	})
}
