package core_test

import (
	"fmt"
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

func TestSyntheticResourceChangesActions(t *testing.T) {
	testCases := []struct {
		name           string
		actions        []tfjson.Action
		expectedAction core.Action
	}{
		{
			name:           "create",
			actions:        []tfjson.Action{tfjson.ActionCreate},
			expectedAction: core.ActionCreate,
		},
		{
			name:           "update",
			actions:        []tfjson.Action{tfjson.ActionUpdate},
			expectedAction: core.ActionUpdate,
		},
		{
			name:           "delete",
			actions:        []tfjson.Action{tfjson.ActionDelete},
			expectedAction: core.ActionDelete,
		},
		{
			name:           "replace create delete",
			actions:        []tfjson.Action{tfjson.ActionCreate, tfjson.ActionDelete},
			expectedAction: core.ActionReplace,
		},
		{
			name:           "replace delete create",
			actions:        []tfjson.Action{tfjson.ActionDelete, tfjson.ActionCreate},
			expectedAction: core.ActionReplace,
		},
		{
			name:           "read",
			actions:        []tfjson.Action{tfjson.ActionRead},
			expectedAction: core.ActionRead,
		},
		{
			name:           "no-op",
			actions:        []tfjson.Action{tfjson.ActionNoop},
			expectedAction: core.ActionNoop,
		},
	}

	var resourceChanges []*tfjson.ResourceChange
	for i, tc := range testCases {
		rc := &tfjson.ResourceChange{
			Address: fmt.Sprintf("res.%s_%d", tc.name, i),
			Change: &tfjson.Change{
				Actions: tc.actions,
			},
		}
		action := core.GetChangeAction(rc)
		if action != tc.expectedAction {
			t.Errorf("GetChangeAction(%s) = %v; want %v", tc.name, action, tc.expectedAction)
		}
		resourceChanges = append(resourceChanges, rc)
	}

	// Also verify nil change, empty actions, and nil rc
	if act := core.GetChangeAction(nil); act != core.ActionNoop {
		t.Errorf("GetChangeAction(nil) = %v; want %v", act, core.ActionNoop)
	}
	if act := core.GetChangeAction(&tfjson.ResourceChange{}); act != core.ActionNoop {
		t.Errorf("GetChangeAction(empty rc) = %v; want %v", act, core.ActionNoop)
	}
	if act := core.GetChangeAction(&tfjson.ResourceChange{Change: &tfjson.Change{Actions: []tfjson.Action{}}}); act != core.ActionNoop {
		t.Errorf("GetChangeAction(empty actions) = %v; want %v", act, core.ActionNoop)
	}

	plan := &tfjson.Plan{
		FormatVersion:    "1.2",
		TerraformVersion: "1.5.0",
		ResourceChanges:  resourceChanges,
	}
	parser := core.NewParser(plan, "")
	summary := parser.ComputeSummary()

	if summary.Total != 7 {
		t.Errorf("summary.Total = %d; want 7", summary.Total)
	}
	if summary.Create != 1 {
		t.Errorf("summary.Create = %d; want 1", summary.Create)
	}
	if summary.Update != 1 {
		t.Errorf("summary.Update = %d; want 1", summary.Update)
	}
	if summary.Delete != 1 {
		t.Errorf("summary.Delete = %d; want 1", summary.Delete)
	}
	if summary.Replace != 2 {
		t.Errorf("summary.Replace = %d; want 2", summary.Replace)
	}
	if summary.Read != 1 {
		t.Errorf("summary.Read = %d; want 1", summary.Read)
	}
	if summary.Noop != 1 {
		t.Errorf("summary.Noop = %d; want 1", summary.Noop)
	}
}

func TestResolveTargetAndLocalsWorkspaceEdges(t *testing.T) {
	plan := &tfjson.Plan{
		FormatVersion:    "1.2",
		TerraformVersion: "1.5.0",
		ResourceChanges: []*tfjson.ResourceChange{
			{
				Address: "aws_s3_bucket.main",
				Mode:    "managed",
				Type:    "aws_s3_bucket",
				Name:    "main",
				Change: &tfjson.Change{
					Actions: []tfjson.Action{tfjson.ActionCreate},
				},
			},
			{
				Address:       "module.child.aws_instance.worker",
				ModuleAddress: "module.child",
				Mode:          "managed",
				Type:          "aws_instance",
				Name:          "worker",
				Change: &tfjson.Change{
					Actions: []tfjson.Action{tfjson.ActionCreate},
				},
			},
		},
		Config: &tfjson.Config{
			RootModule: &tfjson.ConfigModule{
				Resources: []*tfjson.ConfigResource{
					{
						Address: "aws_s3_bucket.main",
						Mode:    "managed",
						Type:    "aws_s3_bucket",
						Name:    "main",
						Expressions: map[string]*tfjson.Expression{
							"tags": {
								ExpressionData: &tfjson.ExpressionData{
									References: []string{"local.tags"},
								},
							},
							"bucket_prefix": {
								ExpressionData: &tfjson.ExpressionData{
									References: []string{"terraform.workspace"},
								},
							},
						},
					},
				},
				ModuleCalls: map[string]*tfjson.ModuleCall{
					"child": {
						Source: "./child",
						Module: &tfjson.ConfigModule{
							Variables: map[string]*tfjson.ConfigVariable{
								"subnet_id": {},
							},
							Outputs: map[string]*tfjson.ConfigOutput{
								"instance_id": {
									Expression: &tfjson.Expression{
										ExpressionData: &tfjson.ExpressionData{
											References: []string{"aws_instance.worker.id"},
										},
									},
								},
							},
							Resources: []*tfjson.ConfigResource{
								{
									Address: "aws_instance.worker",
									Mode:    "managed",
									Type:    "aws_instance",
									Name:    "worker",
									Expressions: map[string]*tfjson.Expression{
										"subnet_id": {
											ExpressionData: &tfjson.ExpressionData{
												References: []string{"var.subnet_id"},
											},
										},
									},
								},
							},
						},
					},
				},
			},
		},
	}

	parser := core.NewParser(plan, "")
	graph, err := parser.GenerateGraph()
	if err != nil {
		t.Fatalf("GenerateGraph failed: %v", err)
	}

	nodeMap := make(map[string]core.Node)
	for _, n := range graph.Nodes {
		nodeMap[n.Data.ID] = n
	}

	// 1. Verify local.tags node exists
	localNode, ok := nodeMap["local.tags"]
	if !ok {
		t.Error("expected node for 'local.tags' in graph.Nodes")
	} else {
		if localNode.Data.Type != core.ResourceTypeLocal {
			t.Errorf("expected local.tags type %s, got %s", core.ResourceTypeLocal, localNode.Data.Type)
		}
		if localNode.Classes != "locals" {
			t.Errorf("expected local.tags classes 'locals', got %s", localNode.Classes)
		}
		if localNode.Data.ParentColor != core.ColorLocal {
			t.Errorf("expected local.tags parentColor %s, got %s", core.ColorLocal, localNode.Data.ParentColor)
		}
	}

	// 2. Verify terraform.workspace node exists
	wsNode, ok := nodeMap["terraform.workspace"]
	if !ok {
		t.Error("expected node for 'terraform.workspace' in graph.Nodes")
	} else {
		if wsNode.Data.Type != core.ResourceTypeLocal {
			t.Errorf("expected terraform.workspace type %s, got %s", core.ResourceTypeLocal, wsNode.Data.Type)
		}
		if wsNode.Classes != "locals" {
			t.Errorf("expected terraform.workspace classes 'locals', got %s", wsNode.Classes)
		}
		if wsNode.Data.Parent != "root" {
			t.Errorf("expected terraform.workspace parent 'root', got %s", wsNode.Data.Parent)
		}
		if wsNode.Data.ParentColor != core.ColorLocal {
			t.Errorf("expected terraform.workspace parentColor %s, got %s", core.ColorLocal, wsNode.Data.ParentColor)
		}
	}

	// 3. Verify child module variable node exists
	varNode, ok := nodeMap["module.child.var.subnet_id"]
	if !ok {
		t.Error("expected node for 'module.child.var.subnet_id' in graph.Nodes")
	} else {
		if varNode.Data.Type != core.ResourceTypeVariable {
			t.Errorf("expected child var type %s, got %s", core.ResourceTypeVariable, varNode.Data.Type)
		}
		if varNode.Classes != "variable" {
			t.Errorf("expected child var classes 'variable', got %s", varNode.Classes)
		}
		if varNode.Data.ParentColor != core.ColorVariable {
			t.Errorf("expected child var parentColor %s, got %s", core.ColorVariable, varNode.Data.ParentColor)
		}
	}

	// 4. Verify child module output node exists
	outNode, ok := nodeMap["module.child.output.instance_id"]
	if !ok {
		t.Error("expected node for 'module.child.output.instance_id' in graph.Nodes")
	} else {
		if outNode.Data.Type != core.ResourceTypeOutput {
			t.Errorf("expected child out type %s, got %s", core.ResourceTypeOutput, outNode.Data.Type)
		}
		if outNode.Classes != "output" {
			t.Errorf("expected child out classes 'output', got %s", outNode.Classes)
		}
	}

	// 5. Verify directional edges
	edgeMap := make(map[string]core.Edge)
	for _, e := range graph.Edges {
		edgeMap[fmt.Sprintf("%s->%s", e.Data.Source, e.Data.Target)] = e
	}

	if _, ok := edgeMap["aws_s3_bucket.main->local.tags"]; !ok {
		t.Error("expected directional edge 'aws_s3_bucket.main->local.tags'")
	}
	if _, ok := edgeMap["aws_s3_bucket.main->terraform.workspace"]; !ok {
		t.Error("expected directional edge 'aws_s3_bucket.main->terraform.workspace'")
	}
	if _, ok := edgeMap["module.child.aws_instance.worker->module.child.var.subnet_id"]; !ok {
		t.Error("expected directional edge 'module.child.aws_instance.worker->module.child.var.subnet_id'")
	}
	if _, ok := edgeMap["module.child.output.instance_id->module.child.aws_instance.worker"]; !ok {
		t.Error("expected directional edge 'module.child.output.instance_id->module.child.aws_instance.worker'")
	}
}

func TestEmptyWorkingDirFallback(t *testing.T) {
	plan, err := core.ValidatePlanFile(getSamplePlanPath())
	if err != nil {
		t.Fatalf("failed to validate sample plan: %v", err)
	}

	parser := core.NewParser(plan, "")
	graph, err := parser.GenerateGraph()
	if err != nil {
		t.Fatalf("GenerateGraph failed with empty workingDir: %v", err)
	}
	if graph == nil {
		t.Fatal("expected non-nil graph")
	}

	resourceCount := 0
	for _, n := range graph.Nodes {
		if (n.Data.Type == core.ResourceTypeResource || n.Data.Type == core.ResourceTypeData) && n.Data.ResourceName != "" {
			resourceCount++
			if n.Data.File != core.DefaultFileName {
				t.Errorf("node %s: expected file %q, got %q", n.Data.ID, core.DefaultFileName, n.Data.File)
			}
		}
	}

	if resourceCount == 0 {
		t.Fatal("expected at least one resource/data node in graph")
	}
}

