package banner

import (
	"bytes"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/AatirNadim/plan-parse/pkg/core"
)

// mockCharDevice simulates an io.Writer that implements Statter with ModeCharDevice.
type mockCharDevice struct {
	bytes.Buffer
}

func (m *mockCharDevice) Stat() (os.FileInfo, error) {
	return mockFileInfo{mode: os.ModeCharDevice}, nil
}

// mockNonCharDevice simulates an io.Writer that implements Statter without ModeCharDevice.
type mockNonCharDevice struct {
	bytes.Buffer
}

func (m *mockNonCharDevice) Stat() (os.FileInfo, error) {
	return mockFileInfo{mode: 0}, nil
}

type mockFileInfo struct {
	mode os.FileMode
}

func (m mockFileInfo) Name() string       { return "mock" }
func (m mockFileInfo) Size() int64        { return 0 }
func (m mockFileInfo) Mode() os.FileMode  { return m.mode }
func (m mockFileInfo) ModTime() time.Time { return time.Time{} }
func (m mockFileInfo) IsDir() bool        { return false }
func (m mockFileInfo) Sys() any           { return nil }

// stripANSI removes ANSI escape codes from a string for text-content assertion.
func stripANSI(s string) string {
	var sb strings.Builder
	inEscape := false
	for i := 0; i < len(s); i++ {
		if s[i] == '\x1b' {
			inEscape = true
			continue
		}
		if inEscape {
			if s[i] == 'm' {
				inEscape = false
			}
			continue
		}
		sb.WriteByte(s[i])
	}
	return sb.String()
}

func TestBannerFormatting_ForceColorTrue(t *testing.T) {
	cfg := Config{
		Version:    "v1.5.0",
		ServerURL:  "http://127.0.0.1:9000",
		PlanPath:   "tests/fixtures/plan.json",
		ForceColor: true,
		Summary: &core.Summary{
			Total:   10,
			Create:  4,
			Update:  3,
			Delete:  2,
			Replace: 1,
		},
	}

	var buf bytes.Buffer
	err := Print(&buf, cfg)
	if err != nil {
		t.Fatalf("unexpected error from Print: %v", err)
	}

	out := buf.String()

	// Should contain ANSI escape codes
	if !strings.Contains(out, "\x1b[") {
		t.Errorf("expected ANSI escape codes in output when ForceColor is true, but found none")
	}

	// Should contain brand colors
	if !strings.Contains(out, ColorSky) {
		t.Errorf("expected ColorSky (%q) in output", ColorSky)
	}
	if !strings.Contains(out, ColorIndigo) {
		t.Errorf("expected ColorIndigo (%q) in output", ColorIndigo)
	}
	if !strings.Contains(out, ColorCreate) {
		t.Errorf("expected ColorCreate (%q) in output", ColorCreate)
	}
	if !strings.Contains(out, ColorUpdate) {
		t.Errorf("expected ColorUpdate (%q) in output", ColorUpdate)
	}
	if !strings.Contains(out, ColorDelete) {
		t.Errorf("expected ColorDelete (%q) in output", ColorDelete)
	}
	if !strings.Contains(out, ColorReplace) {
		t.Errorf("expected ColorReplace (%q) in output", ColorReplace)
	}

	plain := stripANSI(out)

	// Should contain title, version, subtitle
	if !strings.Contains(plain, "PLAN-PARSE") {
		t.Errorf("expected PLAN-PARSE in plain text")
	}
	if !strings.Contains(plain, "v1.5.0") {
		t.Errorf("expected v1.5.0 in plain text")
	}
	if !strings.Contains(plain, Subtitle) {
		t.Errorf("expected subtitle %q in plain text", Subtitle)
	}

	// Should contain action badges
	for _, badge := range []string{"+ CREATE", "~ UPDATE", "- DELETE", "± REPLACE"} {
		if !strings.Contains(plain, badge) {
			t.Errorf("expected badge %q in plain text", badge)
		}
	}

	// Should contain runtime context
	if !strings.Contains(plain, "➜ Local Workbench: http://127.0.0.1:9000") {
		t.Errorf("expected Local Workbench URL in output, got: %s", plain)
	}
	if !strings.Contains(plain, "➜ Target Plan: tests/fixtures/plan.json") {
		t.Errorf("expected Target Plan in output, got: %s", plain)
	}
	if !strings.Contains(plain, "➜ Blast Radius: +4 create, ~3 update, -2 delete, ±1 replace") {
		t.Errorf("expected Blast Radius counts in output, got: %s", plain)
	}
}

func TestBannerFormatting_NoColorEnv(t *testing.T) {
	t.Setenv("NO_COLOR", "1")
	t.Setenv("TERM", "xterm-256color")

	cfg := Config{
		Version:   "v2.0.0",
		ServerURL: "http://127.0.0.1:8080",
		PlanPath:  "plan.json",
	}

	dev := &mockCharDevice{}
	if IsColorEnabled(dev, false) {
		t.Errorf("expected color to be disabled when NO_COLOR=1")
	}

	err := Print(dev, cfg)
	if err != nil {
		t.Fatalf("unexpected error from Print: %v", err)
	}

	out := dev.String()
	if strings.Contains(out, "\x1b[") {
		t.Errorf("expected NO ANSI escape codes when NO_COLOR=1, but found some")
	}

	if !strings.Contains(out, "PLAN-PARSE v2.0.0") {
		t.Errorf("expected fallback banner header with version, got: %s", out)
	}
	if !strings.Contains(out, Subtitle) {
		t.Errorf("expected subtitle in fallback output, got: %s", out)
	}

	// ForceColor should override NO_COLOR
	if !IsColorEnabled(dev, true) {
		t.Errorf("expected ForceColor: true to override NO_COLOR=1")
	}
}

func TestBannerFormatting_TermDumb(t *testing.T) {
	t.Setenv("TERM", "dumb")

	cfg := Config{
		Version:   "v1.0.0",
		ServerURL: "http://localhost:9000",
		DirPath:   "/home/user/terraform",
	}

	dev := &mockCharDevice{}
	if IsColorEnabled(dev, false) {
		t.Errorf("expected color to be disabled when TERM=dumb")
	}

	err := Print(dev, cfg)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	out := dev.String()
	if strings.Contains(out, "\x1b[") {
		t.Errorf("expected NO ANSI codes when TERM=dumb")
	}

	if !strings.Contains(out, "➜ Directory: /home/user/terraform") {
		t.Errorf("expected Directory line in output, got: %s", out)
	}

	// ForceColor should override TERM=dumb
	if !IsColorEnabled(dev, true) {
		t.Errorf("expected ForceColor: true to override TERM=dumb")
	}
}

func TestBanner_TargetModes(t *testing.T) {
	tests := []struct {
		name         string
		cfg          Config
		expectLine   string
		unwantedLine []string
	}{
		{
			name: "PlanPath set",
			cfg: Config{
				PlanPath: "prod.tfplan",
			},
			expectLine:   "➜ Target Plan: prod.tfplan",
			unwantedLine: []string{"➜ Directory:", "Waiting for plan upload"},
		},
		{
			name: "DirPath set",
			cfg: Config{
				DirPath: "./infra/aws",
			},
			expectLine:   "➜ Directory: ./infra/aws",
			unwantedLine: []string{"➜ Target Plan:", "Waiting for plan upload"},
		},
		{
			name: "Neither set (default upload mode)",
			cfg: Config{
				PlanPath: "",
				DirPath:  "",
			},
			expectLine:   "➜ Mode: Waiting for plan upload via browser",
			unwantedLine: []string{"➜ Target Plan:", "➜ Directory:"},
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			outFallback := Format(tc.cfg, false)
			if !strings.Contains(outFallback, tc.expectLine) {
				t.Errorf("fallback mode: expected %q in output, got:\n%s", tc.expectLine, outFallback)
			}
			for _, unw := range tc.unwantedLine {
				if strings.Contains(outFallback, unw) {
					t.Errorf("fallback mode: unexpected substring %q in output", unw)
				}
			}

			outColor := Format(tc.cfg, true)
			plainColor := stripANSI(outColor)
			if !strings.Contains(plainColor, tc.expectLine) {
				t.Errorf("color mode: expected %q in output, got:\n%s", tc.expectLine, plainColor)
			}
			for _, unw := range tc.unwantedLine {
				if strings.Contains(plainColor, unw) {
					t.Errorf("color mode: unexpected substring %q in output", unw)
				}
			}
		})
	}
}

func TestBanner_SummaryFormatting(t *testing.T) {
	t.Run("Summary provided with counts", func(t *testing.T) {
		cfg := Config{
			Summary: &core.Summary{
				Total:   25,
				Create:  10,
				Update:  5,
				Delete:  3,
				Replace: 7,
			},
		}

		outFallback := Format(cfg, false)
		if !strings.Contains(outFallback, "➜ Blast Radius:") {
			t.Errorf("expected Blast Radius line in fallback output")
		}
		if !strings.Contains(outFallback, "+10 create, ~5 update, -3 delete, ±7 replace") {
			t.Errorf("expected summary count string in fallback output, got:\n%s", outFallback)
		}

		outColor := Format(cfg, true)
		plainColor := stripANSI(outColor)
		if !strings.Contains(plainColor, "➜ Blast Radius:") {
			t.Errorf("expected Blast Radius line in color output")
		}
		if !strings.Contains(plainColor, "+10 create, ~5 update, -3 delete, ±7 replace") {
			t.Errorf("expected summary counts in color output, got:\n%s", plainColor)
		}
		if !strings.Contains(outColor, ColorCreate) || !strings.Contains(outColor, ColorUpdate) ||
			!strings.Contains(outColor, ColorDelete) || !strings.Contains(outColor, ColorReplace) {
			t.Errorf("expected colored action counts in color output")
		}
	})

	t.Run("Summary nil", func(t *testing.T) {
		cfg := Config{
			Summary: nil,
		}

		outFallback := Format(cfg, false)
		if strings.Contains(outFallback, "Blast Radius:") {
			t.Errorf("did not expect Blast Radius when Summary is nil")
		}

		outColor := Format(cfg, true)
		if strings.Contains(outColor, "Blast Radius:") {
			t.Errorf("did not expect Blast Radius when Summary is nil")
		}
	})

	t.Run("Summary with zero counts", func(t *testing.T) {
		cfg := Config{
			Summary: &core.Summary{
				Total:   0,
				Create:  0,
				Update:  0,
				Delete:  0,
				Replace: 0,
			},
		}

		outFallback := Format(cfg, false)
		if !strings.Contains(outFallback, "+0 create, ~0 update, -0 delete, ±0 replace") {
			t.Errorf("expected zero counts in fallback output, got: %s", outFallback)
		}
	})
}

func TestBanner_NilSafetyAndDefaults(t *testing.T) {
	// Completely empty config must not panic
	cfg := Config{}

	defer func() {
		if r := recover(); r != nil {
			t.Fatalf("banner rendering panicked on empty Config: %v", r)
		}
	}()

	outFallback := Format(cfg, false)
	if !strings.Contains(outFallback, "PLAN-PARSE dev") {
		t.Errorf("expected default version 'dev' in fallback output, got: %s", outFallback)
	}
	if !strings.Contains(outFallback, "http://127.0.0.1:9000") {
		t.Errorf("expected default serverURL in fallback output, got: %s", outFallback)
	}
	if !strings.Contains(outFallback, "Waiting for plan upload via browser") {
		t.Errorf("expected default upload mode in fallback output, got: %s", outFallback)
	}

	outColor := Format(cfg, true)
	if !strings.Contains(outColor, "dev") {
		t.Errorf("expected default version 'dev' in color output, got: %s", outColor)
	}
	if !strings.Contains(outColor, "http://127.0.0.1:9000") {
		t.Errorf("expected default serverURL in color output, got: %s", outColor)
	}

	// Print with nil writer must return error, not panic
	err := Print(nil, cfg)
	if err == nil {
		t.Errorf("expected error when Print is called with nil writer")
	}
}

func TestBanner_IsColorEnabledDetection(t *testing.T) {
	origNoColor := os.Getenv("NO_COLOR")
	origTerm := os.Getenv("TERM")
	defer func() {
		os.Setenv("NO_COLOR", origNoColor)
		os.Setenv("TERM", origTerm)
	}()

	os.Unsetenv("NO_COLOR")
	os.Setenv("TERM", "xterm-256color")

	// Regular buffer (not a char device)
	buf := &bytes.Buffer{}
	if IsColorEnabled(buf, false) {
		t.Errorf("expected bytes.Buffer not to be identified as char device")
	}
	if !IsColorEnabled(buf, true) {
		t.Errorf("expected ForceColor: true to override non-terminal writer")
	}

	// Mock character device
	charDev := &mockCharDevice{}
	if !IsColorEnabled(charDev, false) {
		t.Errorf("expected mockCharDevice to enable color when environment is clean")
	}

	// Mock non-character device implementing statter
	nonCharDev := &mockNonCharDevice{}
	if IsColorEnabled(nonCharDev, false) {
		t.Errorf("expected mockNonCharDevice to disable color")
	}

	// Render helper
	rendered := Render(charDev, Config{Version: "v1.0.0"})
	if !strings.Contains(rendered, "\x1b[") {
		t.Errorf("expected Render with mockCharDevice to produce colored output")
	}
}
