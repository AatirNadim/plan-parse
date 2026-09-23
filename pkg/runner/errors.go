package runner

import (
	"fmt"
	"strings"
)

// ErrorCategory categorizes the root cause of a Terraform runner failure.
type ErrorCategory string

const (
	ErrCategoryAuth           ErrorCategory = "AUTHENTICATION"
	ErrCategoryVersion        ErrorCategory = "VERSION_INCOMPATIBILITY"
	ErrCategoryPermission     ErrorCategory = "PERMISSION"
	ErrCategoryInitialization ErrorCategory = "INITIALIZATION_REQUIRED"
	ErrCategoryConfiguration  ErrorCategory = "CONFIGURATION"
	ErrCategoryExecution      ErrorCategory = "EXECUTION"
)

// RunnerError provides structured diagnostic information about a Terraform execution failure.
type RunnerError struct {
	Category ErrorCategory
	Message  string
	Details  string
	Hint     string
}

// Error implements the standard Go error interface.
func (e *RunnerError) Error() string {
	if e.Details != "" {
		return fmt.Sprintf("[%s] %s: %s", e.Category, e.Message, e.Details)
	}
	return fmt.Sprintf("[%s] %s", e.Category, e.Message)
}

// FormatCLI returns a human-readable diagnostic error with visual distinction.
func (e *RunnerError) FormatCLI() string {
	var sb strings.Builder
	sb.WriteString("\n")
	sb.WriteString("================================================================================\n")
	sb.WriteString(fmt.Sprintf("[%s ERROR] %s\n", e.Category, e.Message))
	sb.WriteString("--------------------------------------------------------------------------------\n")
	if strings.TrimSpace(e.Details) != "" {
		sb.WriteString(fmt.Sprintf("Details: %s\n", strings.TrimSpace(e.Details)))
	}
	if strings.TrimSpace(e.Hint) != "" {
		sb.WriteString(fmt.Sprintf("Hint:    %s\n", strings.TrimSpace(e.Hint)))
	}
	sb.WriteString("================================================================================\n\n")
	return sb.String()
}

// ClassifyTerraformError analyzes Terraform CLI output and exit errors to categorize the failure.
func ClassifyTerraformError(output string, exitErr error) *RunnerError {
	details := strings.TrimSpace(output)
	if details == "" && exitErr != nil {
		details = exitErr.Error()
	}

	lower := strings.ToLower(output)

	// 1. Initialization issues
	if strings.Contains(lower, "backend initialization required") ||
		strings.Contains(lower, `run "terraform init"`) ||
		strings.Contains(lower, `run 'terraform init'`) ||
		strings.Contains(lower, `run \"terraform init\"`) ||
		strings.Contains(lower, `run "tofu init"`) ||
		strings.Contains(lower, "plugin reinitialization required") ||
		strings.Contains(lower, "module not installed") ||
		strings.Contains(lower, "could not load plugin") {
		return &RunnerError{
			Category: ErrCategoryInitialization,
			Message:  "Terraform directory requires initialization",
			Details:  details,
			Hint:     "Run 'terraform init' in the configuration directory before generating a plan.",
		}
	}

	// 2. Version incompatibility issues
	if strings.Contains(lower, "unsupported terraform core version") ||
		strings.Contains(lower, "this configuration requires terraform version") ||
		strings.Contains(lower, "required_version") ||
		strings.Contains(lower, "incompatible provider version") ||
		strings.Contains(lower, "version constraint") {
		return &RunnerError{
			Category: ErrCategoryVersion,
			Message:  "Terraform core or provider version incompatibility detected",
			Details:  details,
			Hint:     "Verify your installed Terraform/OpenTofu version against the required_version constraints and provider version requirements in your configuration.",
		}
	}

	// 3. Authentication issues
	// AWS: NoCredentialProviders, ExpiredToken, AccessDenied, SignatureDoesNotMatch, UnauthorizedOperation, InvalidClientTokenId
	// GCP: could not find default credentials, oauth2 token, compute/metadata
	// Azure: az login, ARM_CLIENT_SECRET, AuthenticationFailed
	// TFC / HTTP: 401, 403, TFC_TOKEN, Bearer
	if strings.Contains(lower, "nocredentialproviders") ||
		strings.Contains(lower, "expiredtoken") ||
		strings.Contains(lower, "accessdenied") ||
		strings.Contains(lower, "signaturedoesnotmatch") ||
		strings.Contains(lower, "unauthorizedoperation") ||
		strings.Contains(lower, "invalidclienttokenid") ||
		strings.Contains(lower, "could not find default credentials") ||
		strings.Contains(lower, "oauth2 token") ||
		strings.Contains(lower, "compute/metadata") ||
		strings.Contains(lower, "az login") ||
		strings.Contains(lower, "arm_client_secret") ||
		strings.Contains(lower, "authenticationfailed") ||
		strings.Contains(lower, "401 unauthorized") ||
		strings.Contains(lower, "403 forbidden") ||
		strings.Contains(lower, "tfc_token") ||
		strings.Contains(lower, "invalid authentication token") ||
		strings.Contains(lower, "bearer token") {
		return &RunnerError{
			Category: ErrCategoryAuth,
			Message:  "Cloud provider authentication failed",
			Details:  details,
			Hint:     "Check your cloud credentials and environment variables (e.g. AWS_PROFILE, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, GOOGLE_APPLICATION_CREDENTIALS, ARM_CLIENT_ID, ARM_CLIENT_SECRET, ARM_SUBSCRIPTION_ID, ARM_TENANT_ID).",
		}
	}

	// 4. Permissions issues
	if strings.Contains(lower, "permission denied") ||
		strings.Contains(lower, "eacces") ||
		strings.Contains(lower, "access is denied") ||
		strings.Contains(lower, "operation not permitted") {
		return &RunnerError{
			Category: ErrCategoryPermission,
			Message:  "Filesystem or permission denied",
			Details:  details,
			Hint:     "Check directory and file filesystem permissions or verify IAM role permissions.",
		}
	}

	// 5. Configuration issues
	if strings.Contains(lower, "no value for required variable") ||
		strings.Contains(lower, "reference to undeclared") ||
		strings.Contains(lower, "syntax error") ||
		strings.Contains(lower, "missing required argument") ||
		strings.Contains(lower, "unsupported argument") ||
		strings.Contains(lower, "unsupported block type") {
		return &RunnerError{
			Category: ErrCategoryConfiguration,
			Message:  "Terraform configuration or variable error",
			Details:  details,
			Hint:     "Ensure all required variables are set via environment variables (TF_VAR_*), terraform.tfvars, or CLI flags, and verify configuration syntax.",
		}
	}

	// 6. Default execution failure
	return &RunnerError{
		Category: ErrCategoryExecution,
		Message:  "Terraform execution failed",
		Details:  details,
		Hint:     "Review the Terraform output above for detailed diagnostic messages.",
	}
}
