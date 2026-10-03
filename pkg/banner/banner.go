package banner

import (
	"errors"
	"fmt"
	"io"
	"os"
	"strings"

	"github.com/AatirNadim/plan-parse/pkg/core"
)

// ANSI escape codes for styling and formatting.
const (
	ansiReset = "\x1b[0m"
	ansiBold  = "\x1b[1m"
	ansiDim   = "\x1b[2m"

	// UI Theme TrueColor 24-bit ANSI codes matching ui/tailwind.config.js & assets/banner.svg
	ColorSky     = "\x1b[38;2;56;189;248m"  // #38BDF8 (Brand Sky)
	ColorIndigo  = "\x1b[38;2;99;102;241m"  // #6366F1 (Brand Indigo)
	ColorMuted   = "\x1b[38;2;148;163;184m" // #94A3B8 (Muted Text)
	ColorBorder  = "\x1b[38;2;35;41;54m"    // #232936 (Workbench Border)
	ColorCreate  = "\x1b[38;2;16;185;129m"  // #10B981 (Action Create +)
	ColorUpdate  = "\x1b[38;2;2;132;199m"   // #0284C7 (Action Update ~)
	ColorDelete  = "\x1b[38;2;244;63;94m"   // #F43F5E (Action Delete -)
	ColorReplace = "\x1b[38;2;245;158;11m"  // #F59E0B (Action Replace ±)
	ColorWhite   = "\x1b[38;2;255;255;255m" // #FFFFFF (High-contrast text)
)

// Subtitle is the brand tagline displayed under the ASCII logo.
const Subtitle = "Terraform Plan DAG Visualizer & Blast Radius Analyzer"

// Config defines startup banner parameters.
type Config struct {
	Version    string
	ServerURL  string
	PlanPath   string
	DirPath    string
	Summary    *core.Summary
	ForceColor bool // Optional override for testing or manual flag
}

// Statter is an interface for types capable of returning FileInfo (e.g. *os.File).
type Statter interface {
	Stat() (os.FileInfo, error)
}

// isCharDevice checks if an io.Writer represents a terminal character device.
func isCharDevice(w io.Writer) bool {
	if s, ok := w.(Statter); ok {
		stat, err := s.Stat()
		if err == nil {
			return (stat.Mode() & os.ModeCharDevice) != 0
		}
	}
	return false
}

// IsColorEnabled checks whether ANSI color escapes should be emitted.
// It honors ForceColor, NO_COLOR (https://no-color.org), TERM=dumb, and terminal character device detection.
func IsColorEnabled(w io.Writer, forceColor bool) bool {
	if forceColor {
		return true
	}
	if _, ok := os.LookupEnv("NO_COLOR"); ok {
		return false
	}
	if os.Getenv("TERM") == "dumb" {
		return false
	}
	return isCharDevice(w)
}

var logoParts = []struct {
	plan  string
	sep   string
	parse string
}{
	{"    ____  __    ___    _   __ ", "      ", " ____  ___    ____  _____ ______"},
	{"   / __ \\/ /   /   |  / | / /", "      ", " / __ \\/   |  / __ \\/ ___// ____/"},
	{"  / /_/ / /   / /| | /  |/ / ", " ---  ", "/ /_/ / /| | / /_/ /\\__ \\/ __/   "},
	{" / ____/ /___/ ___ |/ /|  /  ", "     ", "/ ____/ ___ |/ _, _/___/ / /___   "},
	{"/_/   /_____/_/  |_/_/ |_/  ", "     ", "/_/   /_/  |_/_/ |_|/____/_____/   "},
}

// Format renders the banner as a string with or without ANSI colors.
func Format(cfg Config, useColor bool) string {
	ver := cfg.Version
	if ver == "" {
		ver = "dev"
	}

	serverURL := cfg.ServerURL
	if serverURL == "" {
		serverURL = "http://127.0.0.1:9000"
	}

	var sb strings.Builder

	if useColor {
		sb.WriteString("\n")
		// Top border
		sb.WriteString("  " + ColorBorder + strings.Repeat("─", 68) + ansiReset + "\n")

		// ASCII Logo
		for _, p := range logoParts {
			sb.WriteString("  " + ColorSky + ansiBold + p.plan + ansiReset +
				ColorMuted + p.sep + ansiReset +
				ColorIndigo + ansiBold + p.parse + ansiReset + "\n")
		}

		// Version tag and Subtitle
		sb.WriteString(fmt.Sprintf("  %s%s%s %s%s%s\n", ColorWhite+ansiBold, "PLAN-PARSE", ansiReset, ColorMuted, ver, ansiReset))
		sb.WriteString(fmt.Sprintf("  %s%s%s\n\n", ColorMuted, Subtitle, ansiReset))

		// Action badges: + CREATE, ~ UPDATE, - DELETE, ± REPLACE
		sb.WriteString(fmt.Sprintf("  %s[%s%s+ CREATE%s%s]%s   %s[%s%s~ UPDATE%s%s]%s   %s[%s%s- DELETE%s%s]%s   %s[%s%s± REPLACE%s%s]%s\n\n",
			ColorBorder, ansiReset, ColorCreate+ansiBold, ansiReset, ColorBorder, ansiReset,
			ColorBorder, ansiReset, ColorUpdate+ansiBold, ansiReset, ColorBorder, ansiReset,
			ColorBorder, ansiReset, ColorDelete+ansiBold, ansiReset, ColorBorder, ansiReset,
			ColorBorder, ansiReset, ColorReplace+ansiBold, ansiReset, ColorBorder, ansiReset,
		))

		// Runtime context lines
		sb.WriteString(fmt.Sprintf("  %s➜%s %sLocal Workbench:%s %s%s%s\n",
			ColorSky, ansiReset, ColorMuted, ansiReset, ColorWhite+ansiBold, serverURL, ansiReset))

		if cfg.PlanPath != "" {
			sb.WriteString(fmt.Sprintf("  %s➜%s %sTarget Plan:%s %s%s%s\n",
				ColorSky, ansiReset, ColorMuted, ansiReset, ColorWhite, cfg.PlanPath, ansiReset))
		} else if cfg.DirPath != "" {
			sb.WriteString(fmt.Sprintf("  %s➜%s %sDirectory:%s %s%s%s\n",
				ColorSky, ansiReset, ColorMuted, ansiReset, ColorWhite, cfg.DirPath, ansiReset))
		} else {
			sb.WriteString(fmt.Sprintf("  %s➜%s %sMode:%s %s%s%s\n",
				ColorSky, ansiReset, ColorMuted, ansiReset, ColorWhite, "Waiting for plan upload via browser", ansiReset))
		}

		if cfg.Summary != nil {
			sb.WriteString(fmt.Sprintf("  %s➜%s %sBlast Radius:%s %s+%d create%s, %s~%d update%s, %s-%d delete%s, %s±%d replace%s\n",
				ColorSky, ansiReset, ColorMuted, ansiReset,
				ColorCreate, cfg.Summary.Create, ansiReset,
				ColorUpdate, cfg.Summary.Update, ansiReset,
				ColorDelete, cfg.Summary.Delete, ansiReset,
				ColorReplace, cfg.Summary.Replace, ansiReset,
			))
		}

		// Bottom border
		sb.WriteString("  " + ColorBorder + strings.Repeat("─", 68) + ansiReset + "\n\n")
	} else {
		// Clean plain-text fallback banner
		sb.WriteString("--------------------------------------------------------------------\n")
		sb.WriteString(fmt.Sprintf("PLAN-PARSE %s\n", ver))
		sb.WriteString(fmt.Sprintf("%s\n\n", Subtitle))
		sb.WriteString("[+ CREATE]   [~ UPDATE]   [- DELETE]   [± REPLACE]\n\n")
		sb.WriteString(fmt.Sprintf("➜ Local Workbench: %s\n", serverURL))

		if cfg.PlanPath != "" {
			sb.WriteString(fmt.Sprintf("➜ Target Plan: %s\n", cfg.PlanPath))
		} else if cfg.DirPath != "" {
			sb.WriteString(fmt.Sprintf("➜ Directory: %s\n", cfg.DirPath))
		} else {
			sb.WriteString("➜ Mode: Waiting for plan upload via browser\n")
		}

		if cfg.Summary != nil {
			sb.WriteString(fmt.Sprintf("➜ Blast Radius: +%d create, ~%d update, -%d delete, ±%d replace\n",
				cfg.Summary.Create, cfg.Summary.Update, cfg.Summary.Delete, cfg.Summary.Replace))
		}

		sb.WriteString("--------------------------------------------------------------------\n")
	}

	return sb.String()
}

// Render formats the startup banner based on output writer color support and configuration.
func Render(w io.Writer, cfg Config) string {
	useColor := IsColorEnabled(w, cfg.ForceColor)
	return Format(cfg, useColor)
}

// Print writes the styled startup banner to the specified writer.
func Print(w io.Writer, cfg Config) error {
	if w == nil {
		return errors.New("banner: writer is nil")
	}
	_, err := fmt.Fprint(w, Render(w, cfg))
	return err
}
