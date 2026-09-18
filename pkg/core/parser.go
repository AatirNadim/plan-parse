package core

import (
	"path/filepath"
	"regexp"
	"strings"

	"github.com/hashicorp/terraform-config-inspect/tfconfig"
	tfjson "github.com/hashicorp/terraform-json"
)

var (
	indexRegex   = regexp.MustCompile(`\[[^\[\]]*\]$`)
	bracketRegex = regexp.MustCompile(`\[[^\[\]]*\]`)
)

// Parser handles transforming a tfjson.Plan and optional filesystem module configs into a DAG.
type Parser struct {
	plan          *tfjson.Plan
	moduleConfigs map[string]*tfconfig.Module
	workingDir    string
}

// NewParser creates a new Parser with optional modules.json detection around workingDir.
func NewParser(plan *tfjson.Plan, workingDir string) *Parser {
	configs := make(map[string]*tfconfig.Module)

	if workingDir != "" {
		manifestPath, baseDir := FindModulesJSON(workingDir)
		if manifestPath != "" {
			locations, err := LoadModuleLocations(manifestPath, baseDir)
			if err == nil {
				configs = LoadModuleConfigs(locations, baseDir)
			}
		} else {
			// Try loading root module config directly if present
			rootMod, err := tfconfig.LoadModule(workingDir)
			if err == nil && rootMod != nil && !rootMod.Diagnostics.HasErrors() {
				configs[""] = rootMod
			}
		}
	}

	return &Parser{
		plan:          plan,
		moduleConfigs: configs,
		workingDir:    workingDir,
	}
}

// NewParserWithConfigs creates a Parser with pre-loaded module configurations.
func NewParserWithConfigs(plan *tfjson.Plan, configs map[string]*tfconfig.Module, workingDir string) *Parser {
	if configs == nil {
		configs = make(map[string]*tfconfig.Module)
	}
	return &Parser{
		plan:          plan,
		moduleConfigs: configs,
		workingDir:    workingDir,
	}
}

// ComputeSummary calculates resource change counts for the plan.
func (p *Parser) ComputeSummary() PlanSummary {
	summary := PlanSummary{
		Total: len(p.plan.ResourceChanges),
	}

	for _, rc := range p.plan.ResourceChanges {
		if rc.Change == nil || len(rc.Change.Actions) == 0 {
			summary.Noop++
			continue
		}

		if len(rc.Change.Actions) > 1 {
			summary.Replace++
			continue
		}

		switch rc.Change.Actions[0] {
		case tfjson.ActionCreate:
			summary.Create++
		case tfjson.ActionDelete:
			summary.Delete++
		case tfjson.ActionUpdate:
			summary.Update++
		case tfjson.ActionNoop:
			summary.Noop++
		case tfjson.ActionRead:
			summary.Read++
		default:
			summary.Noop++
		}
	}

	return summary
}

// GetChangeAction determines the single Action enum from a ResourceChange.
func GetChangeAction(rc *tfjson.ResourceChange) Action {
	if rc == nil || rc.Change == nil || len(rc.Change.Actions) == 0 {
		return ActionNoop
	}
	if len(rc.Change.Actions) > 1 {
		return ActionReplace
	}
	switch rc.Change.Actions[0] {
	case tfjson.ActionCreate:
		return ActionCreate
	case tfjson.ActionDelete:
		return ActionDelete
	case tfjson.ActionUpdate:
		return ActionUpdate
	case tfjson.ActionNoop:
		return ActionNoop
	case tfjson.ActionRead:
		return ActionRead
	default:
		return Action(string(rc.Change.Actions[0]))
	}
}

// FindResourceFile searches loaded tfconfig.Module configs for the filename and line of a resource.
func (p *Parser) FindResourceFile(moduleAddr, mode, resType, resName string) (string, *int) {
	configKey := strings.TrimPrefix(moduleAddr, "module.")
	configKey = strings.ReplaceAll(configKey, ".module.", ".")
	configKey = bracketRegex.ReplaceAllString(configKey, "")

	modConfig := p.moduleConfigs[configKey]
	if modConfig == nil {
		return DefaultFileName, nil
	}

	key := resType + "." + resName
	if mode == "data" {
		if dataRes, ok := modConfig.DataResources["data."+key]; ok && dataRes != nil {
			fname := filepath.Base(dataRes.Pos.Filename)
			line := dataRes.Pos.Line
			return fname, &line
		}
	} else {
		if managedRes, ok := modConfig.ManagedResources[key]; ok && managedRes != nil {
			fname := filepath.Base(managedRes.Pos.Filename)
			line := managedRes.Pos.Line
			return fname, &line
		}
	}

	return DefaultFileName, nil
}
