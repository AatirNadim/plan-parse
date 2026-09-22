package core

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"

	"github.com/hashicorp/terraform-config-inspect/tfconfig"
)

// ModuleLocation describes a single module entry in .terraform/modules/modules.json.
type ModuleLocation struct {
	Key    string `json:"Key"`
	Source string `json:"Source"`
	Dir    string `json:"Dir"`
}

// ModuleManifest represents the structure of .terraform/modules/modules.json.
type ModuleManifest struct {
	Modules []ModuleLocation `json:"Modules"`
}

// FindModulesJSON searches for .terraform/modules/modules.json starting at startPath
// and walking upwards through parent directories. Returns empty strings if not found.
func FindModulesJSON(startPath string) (manifestPath string, baseDir string) {
	if startPath == "" {
		startPath = "."
	}

	absPath, err := filepath.Abs(startPath)
	if err != nil {
		return "", ""
	}

	cur := absPath
	info, err := os.Stat(cur)
	if err == nil && !info.IsDir() {
		cur = filepath.Dir(cur)
	}

	for range 5 {
		candidate := filepath.Join(cur, ".terraform", "modules", "modules.json")
		if _, err := os.Stat(candidate); err == nil {
			return candidate, cur
		}
		parent := filepath.Dir(cur)
		if parent == cur {
			break
		}
		cur = parent
	}

	return "", ""
}

// LoadModuleLocations parses the modules.json manifest and maps module keys to absolute directory paths.
func LoadModuleLocations(manifestPath string, baseDir string) (map[string]string, error) {
	locations := make(map[string]string)
	if manifestPath == "" {
		return locations, nil
	}

	data, err := os.ReadFile(manifestPath)
	if err != nil {
		if os.IsNotExist(err) {
			return locations, nil
		}
		return nil, fmt.Errorf("error reading %s: %w", manifestPath, err)
	}

	var manifest ModuleManifest
	if err := json.Unmarshal(data, &manifest); err != nil {
		return nil, fmt.Errorf("failed to parse modules.json: %w", err)
	}

	for _, mod := range manifest.Modules {
		if mod.Key == "" {
			continue
		}
		dir := mod.Dir
		if !filepath.IsAbs(dir) {
			dir = filepath.Join(baseDir, dir)
		}
		locations[mod.Key] = dir
	}

	return locations, nil
}

// LoadModuleConfigs loads tfconfig.Module for each module directory present.
func LoadModuleConfigs(locations map[string]string, rootDir string) map[string]*tfconfig.Module {
	configs := make(map[string]*tfconfig.Module)

	if rootDir != "" {
		rootMod, err := tfconfig.LoadModule(rootDir)
		if err == nil && rootMod != nil && !rootMod.Diagnostics.HasErrors() {
			configs[""] = rootMod
		}
	}

	for key, dir := range locations {
		mod, err := tfconfig.LoadModule(dir)
		if err == nil && mod != nil && !mod.Diagnostics.HasErrors() {
			configs[key] = mod
		}
	}

	return configs
}
