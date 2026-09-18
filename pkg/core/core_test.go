package core_test

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/hashicorp/terraform-config-inspect/tfconfig"
	tfjson "github.com/hashicorp/terraform-json"

	"plan-parse/pkg/core"
)

func getTestDataDir() string {
	candidates := []string{
		filepath.Join("..", "..", "testdata"),
		"testdata",
	}
	for _, c := range candidates {
		if _, err := os.Stat(filepath.Join(c, "tf_plan.json")); err == nil {
			return c
		}
	}
	return filepath.Join("..", "..", "testdata")
}

func getSamplePlanPath() string {
	return filepath.Join(getTestDataDir(), "tf_plan.json")
}

func TestValidatePlanFile(t *testing.T) {
	t.Run("Valid file", func(t *testing.T) {
		plan, err := core.ValidatePlanFile(getSamplePlanPath())
		if err != nil {
			t.Fatalf("expected valid plan file, got error: %v", err)
		}
		if plan == nil {
			t.Fatal("expected non-nil plan")
		}
		if plan.FormatVersion != "1.2" {
			t.Errorf("expected format_version 1.2, got %s", plan.FormatVersion)
		}
		if plan.TerraformVersion != "1.16.2" {
			t.Errorf("expected terraform_version 1.16.2, got %s", plan.TerraformVersion)
		}
	})

	t.Run("Non-existent file", func(t *testing.T) {
		_, err := core.ValidatePlanFile("/non/existent/path/plan.json")
		if err == nil {
			t.Fatal("expected error for non-existent file, got nil")
		}
	})

	t.Run("Directory path", func(t *testing.T) {
		tmpDir := t.TempDir()
		_, err := core.ValidatePlanFile(tmpDir)
		if err == nil {
			t.Fatal("expected error when path is directory, got nil")
		}
	})

	t.Run("Invalid file extension", func(t *testing.T) {
		tmpDir := t.TempDir()
		nonJSON := filepath.Join(tmpDir, "plan.txt")
		if err := os.WriteFile(nonJSON, []byte("{}"), 0644); err != nil {
			t.Fatal(err)
		}
		_, err := core.ValidatePlanFile(nonJSON)
		if err == nil {
			t.Fatal("expected error for non-.json file, got nil")
		}
	})

	t.Run("Empty path", func(t *testing.T) {
		_, err := core.ValidatePlanFile("")
		if err == nil {
			t.Fatal("expected error for empty path, got nil")
		}
	})
}

func TestValidatePlanBytes(t *testing.T) {
	t.Run("Empty bytes", func(t *testing.T) {
		_, err := core.ValidatePlanBytes([]byte(""))
		if err == nil {
			t.Fatal("expected error for empty bytes, got nil")
		}
	})

	t.Run("Invalid JSON syntax", func(t *testing.T) {
		_, err := core.ValidatePlanBytes([]byte("{invalid-json}"))
		if err == nil {
			t.Fatal("expected error for invalid JSON, got nil")
		}
	})

	t.Run("Missing format_version", func(t *testing.T) {
		data := []byte(`{"terraform_version": "1.5.0"}`)
		_, err := core.ValidatePlanBytes(data)
		if err == nil {
			t.Fatal("expected error for missing format_version, got nil")
		}
	})

	t.Run("Missing terraform_version", func(t *testing.T) {
		data := []byte(`{"format_version": "1.2"}`)
		_, err := core.ValidatePlanBytes(data)
		if err == nil {
			t.Fatal("expected error for missing terraform_version, got nil")
		}
	})

	t.Run("Valid minimal plan", func(t *testing.T) {
		data := []byte(`{"format_version": "1.2", "terraform_version": "1.5.0"}`)
		plan, err := core.ValidatePlanBytes(data)
		if err != nil {
			t.Fatalf("expected valid plan, got error: %v", err)
		}
		if plan.FormatVersion != "1.2" {
			t.Errorf("expected format_version 1.2, got %s", plan.FormatVersion)
		}
	})
}

func TestModules(t *testing.T) {
	t.Run("FindModulesJSON and LoadModuleLocations", func(t *testing.T) {
		sampleDir := getTestDataDir()
		manifestPath, baseDir := core.FindModulesJSON(sampleDir)
		if manifestPath == "" {
			t.Fatalf("expected to find modules.json in %s", sampleDir)
		}

		locations, err := core.LoadModuleLocations(manifestPath, baseDir)
		if err != nil {
			t.Fatalf("failed to load module locations: %v", err)
		}

		if len(locations) == 0 {
			t.Fatal("expected non-empty module locations")
		}

		// Verify expected keys from modules.json
		for _, key := range []string{"networking", "storage", "compute", "database"} {
			if _, ok := locations[key]; !ok {
				t.Errorf("expected module %q in locations", key)
			}
		}

		// Test loading module configs
		configs := core.LoadModuleConfigs(locations, baseDir)
		if len(configs) == 0 {
			t.Fatal("expected non-empty module configs")
		}
	})

	t.Run("FindModulesJSON non-existent", func(t *testing.T) {
		manifestPath, _ := core.FindModulesJSON(t.TempDir())
		if manifestPath != "" {
			t.Errorf("expected empty manifest path for temp dir, got %s", manifestPath)
		}
	})
}

func TestSamplePlanParsing(t *testing.T) {
	plan, err := core.ValidatePlanFile(getSamplePlanPath())
	if err != nil {
		t.Fatalf("failed to validate sample plan: %v", err)
	}

	sampleDir := getTestDataDir()
	parser := core.NewParser(plan, sampleDir)

	graph, err := parser.GenerateGraph()
	if err != nil {
		t.Fatalf("failed to generate graph: %v", err)
	}

	// 1. Verify summary
	if graph.Summary.Total != 66 {
		t.Errorf("expected 66 total resources, got %d", graph.Summary.Total)
	}
	if graph.Summary.Create != 66 {
		t.Errorf("expected 66 create actions, got %d", graph.Summary.Create)
	}
	if graph.Summary.Delete != 0 {
		t.Errorf("expected 0 delete actions, got %d", graph.Summary.Delete)
	}

	// 2. Verify nodes
	if len(graph.Nodes) == 0 {
		t.Fatal("expected non-empty nodes list")
	}

	nodeMap := make(map[string]core.Node)
	for _, n := range graph.Nodes {
		nodeMap[n.Data.ID] = n
	}

	// Root node must exist
	if rootNode, ok := nodeMap["root"]; !ok {
		t.Error("expected 'root' node in graph")
	} else if rootNode.Data.Type != core.ResourceTypeBasename {
		t.Errorf("expected root type basename, got %s", rootNode.Data.Type)
	}

	// Verify that child nodes have existing parents
	for _, n := range graph.Nodes {
		if n.Data.Parent != "" {
			if _, ok := nodeMap[n.Data.Parent]; !ok {
				t.Errorf("node %s references non-existent parent %s", n.Data.ID, n.Data.Parent)
			}
		}
	}

	// 3. Verify edges
	if len(graph.Edges) == 0 {
		t.Fatal("expected non-empty edges list")
	}

	for _, e := range graph.Edges {
		if _, ok := nodeMap[e.Data.Source]; !ok {
			t.Errorf("edge %s has non-existent source %s", e.Data.ID, e.Data.Source)
		}
		if _, ok := nodeMap[e.Data.Target]; !ok {
			t.Errorf("edge %s has non-existent target %s", e.Data.ID, e.Data.Target)
		}
		if e.Data.Gradient == "" {
			t.Errorf("edge %s missing gradient color", e.Data.ID)
		}
	}

	// 4. Verify Colors helper
	if core.GetActionColor(core.ActionCreate) != core.ColorCreate {
		t.Errorf("expected ColorCreate, got %s", core.GetActionColor(core.ActionCreate))
	}
	if core.GetResourceTypeColor(core.ResourceTypeModule) != core.ColorModule {
		t.Errorf("expected ColorModule, got %s", core.GetResourceTypeColor(core.ResourceTypeModule))
	}
}

func TestFindResourceFileNestedModuleKey(t *testing.T) {
	plan := &tfjson.Plan{}
	dummyMod := &tfconfig.Module{
		Path: "test",
		ManagedResources: map[string]*tfconfig.Resource{
			"aws_s3_bucket.bucket": {
				Type: "aws_s3_bucket",
				Name: "bucket",
				Pos: tfconfig.SourcePos{
					Filename: "s3.tf",
					Line:     42,
				},
			},
		},
	}
	configs := map[string]*tfconfig.Module{
		"parent.child": dummyMod,
	}
	parser := core.NewParserWithConfigs(plan, configs, "")
	fname, line := parser.FindResourceFile("module.parent.module.child", "managed", "aws_s3_bucket", "bucket")
	if fname != "s3.tf" {
		t.Errorf("expected s3.tf, got %s", fname)
	}
	if line == nil || *line != 42 {
		t.Errorf("expected line 42, got %v", line)
	}
}
