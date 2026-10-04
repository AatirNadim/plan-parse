package core

import (
	"fmt"
	"maps"
	"path/filepath"
	"slices"
	"strings"

	tfjson "github.com/hashicorp/terraform-json"
)

// GenerateGraph builds the complete Cytoscape DAG (Nodes, Edges, Summary) from the parsed plan.
func (p *Parser) GenerateGraph() (*Graph, error) {
	summary := p.ComputeSummary()

	nodeMap := make(map[string]Node)
	nodeOrder := []string{}

	addNode := func(n Node) {
		if _, exists := nodeMap[n.Data.ID]; !exists {
			nodeOrder = append(nodeOrder, n.Data.ID)
		}
		nodeMap[n.Data.ID] = n
	}

	// 1. Root container node
	rootID := "root"
	rootLabel := "root"
	if p.workingDir != "" && p.workingDir != "." {
		rootLabel = filepath.Base(p.workingDir)
	}
	addNode(Node{
		Data: NodeData{
			ID:    rootID,
			Label: rootLabel,
			Type:  ResourceTypeBasename,
		},
		Classes: "basename",
	})

	// Helper to ensure all parent modules exist
	ensureModuleHierarchy := func(moduleAddr string) {
		if moduleAddr == "" || moduleAddr == "root" {
			return
		}

		parts := strings.Split(moduleAddr, ".")
		var currentMod string
		parentMod := rootID

		for i := 0; i < len(parts); i++ {
			if parts[i] == "module" && i+1 < len(parts) {
				segment := parts[i] + "." + parts[i+1]
				if currentMod == "" {
					currentMod = segment
				} else {
					currentMod = currentMod + "." + segment
				}
				i++ // skip next token since consumed

				if _, exists := nodeMap[currentMod]; !exists {
					classes := "module"
					if parentMod != rootID {
						classes = "module nested-module"
					}
					addNode(Node{
						Data: NodeData{
							ID:          currentMod,
							Label:       currentMod,
							Type:        ResourceTypeModule,
							Parent:      parentMod,
							ParentColor: ColorModule,
						},
						Classes:     classes,
					})
				}
				parentMod = currentMod
			}
		}
	}

	// Helper to ensure file node exists
	ensureFileNode := func(parentModule, fileName string) string {
		parentModID := rootID
		if parentModule != "" {
			ensureModuleHierarchy(parentModule)
			parentModID = parentModule
		}

		fileID := fileName
		if parentModID != rootID {
			fileID = parentModID + "/" + fileName
		}

		if _, exists := nodeMap[fileID]; !exists {
			classes := "fname"
			if strings.EqualFold(fileName, "main.tf") {
				if parentModule != "" {
					classes = "fname main-file module-main-file"
				} else {
					classes = "fname main-file"
				}
			}
			addNode(Node{
				Data: NodeData{
					ID:          fileID,
					Label:       fileName,
					Type:        ResourceTypeFile,
					Parent:      parentModID,
					ParentColor: ColorModule,
				},
				Classes:     classes,
			})
		}
		return fileID
	}

	// Helper to ensure resource type node exists
	ensureResourceTypeNode := func(fileID, parentModule, resType string, isData bool) string {
		typeID := fileID + "/" + resType
		if isData {
			typeID = fileID + "/data." + resType
		}

		if _, exists := nodeMap[typeID]; !exists {
			rType := ResourceTypeResource
			classes := "resource-type"
			label := resType
			if isData {
				rType = ResourceTypeData
				classes = "data-type"
				label = "data." + resType
			}

			addNode(Node{
				Data: NodeData{
					ID:          typeID,
					Label:       label,
					Type:        rType,
					Parent:      fileID,
					ParentColor: ColorResource,
				},
				Classes: classes,
			})
		}
		return typeID
	}

	// 2. Add Variables from config or planned values
	if p.plan.Config != nil && p.plan.Config.RootModule != nil {
		vNames := slices.Sorted(maps.Keys(p.plan.Config.RootModule.Variables))
		for _, vName := range vNames {
			vID := "var." + vName
			fileID := ensureFileNode("", "variables.tf")
			addNode(Node{
				Data: NodeData{
					ID:          vID,
					Label:       vID,
					Type:        ResourceTypeVariable,
					Parent:      fileID,
					ParentColor: ColorVariable,
				},
				Classes: "variable",
			})
		}
	} else if p.plan.Variables != nil {
		vNames := slices.Sorted(maps.Keys(p.plan.Variables))
		for _, vName := range vNames {
			vID := "var." + vName
			fileID := ensureFileNode("", "variables.tf")
			addNode(Node{
				Data: NodeData{
					ID:          vID,
					Label:       vID,
					Type:        ResourceTypeVariable,
					Parent:      fileID,
					ParentColor: ColorVariable,
				},
				Classes: "variable",
			})
		}
	}

	// 3. Add Outputs from output changes or config
	if p.plan.OutputChanges != nil {
		oNames := slices.Sorted(maps.Keys(p.plan.OutputChanges))
		for _, oName := range oNames {
			oc := p.plan.OutputChanges[oName]
			oID := "output." + oName
			fileID := ensureFileNode("", "outputs.tf")
			addNode(Node{
				Data: NodeData{
					ID:            oID,
					Label:         oID,
					Type:          ResourceTypeOutput,
					Parent:        fileID,
					ParentColor:   ColorOutput,
					ChangeDetails: oc,
				},
				Classes: "output",
			})
		}
	}

	// 4. Add Resource changes (managed and data resources)
	for _, rc := range p.plan.ResourceChanges {
		action := GetChangeAction(rc)
		isData := string(rc.Mode) == "data"

		fname, line := p.FindResourceFile(rc.ModuleAddress, string(rc.Mode), rc.Type, rc.Name)
		fileID := ensureFileNode(rc.ModuleAddress, fname)
		typeID := ensureResourceTypeNode(fileID, rc.ModuleAddress, rc.Type, isData)

		rType := ResourceTypeResource
		classes := fmt.Sprintf("resource-name %s", string(action))
		if isData {
			rType = ResourceTypeData
			classes = fmt.Sprintf("data-name %s", string(action))
		}

		resLabel := rc.Name
		if idx := indexRegex.FindString(rc.Address); idx != "" {
			resLabel = rc.Name + idx
		}

		addNode(Node{
			Data: NodeData{
				ID:            rc.Address,
				Label:         resLabel,
				Type:          rType,
				Parent:        typeID,
				ParentColor:   ColorResource,
				Change:        action,
				ResourceType:  rc.Type,
				ResourceName:  rc.Name,
				Module:        rc.ModuleAddress,
				File:          fname,
				Line:          line,
				ChangeDetails: rc.Change,
			},
			Classes: classes,
		})
	}

	// 5. Generate Edges
	edgeMap := make(map[string]Edge)
	edgeOrder := []string{}

	addEdge := func(src, tgt string) {
		if src == "" || tgt == "" || src == tgt {
			return
		}
		// Both nodes must exist in nodeMap
		srcNode, srcOk := nodeMap[src]
		tgtNode, tgtOk := nodeMap[tgt]
		if !srcOk || !tgtOk {
			return
		}

		edgeID := fmt.Sprintf("%s->%s", src, tgt)
		if _, exists := edgeMap[edgeID]; !exists {
			srcColor := GetActionColor(srcNode.Data.Change)
			if srcNode.Data.Type != ResourceTypeResource && srcNode.Data.Type != ResourceTypeData {
				srcColor = GetResourceTypeColor(srcNode.Data.Type)
			}
			tgtColor := GetActionColor(tgtNode.Data.Change)
			if tgtNode.Data.Type != ResourceTypeResource && tgtNode.Data.Type != ResourceTypeData {
				tgtColor = GetResourceTypeColor(tgtNode.Data.Type)
			}

			edgeMap[edgeID] = Edge{
				Data: EdgeData{
					ID:       edgeID,
					Source:   src,
					Target:   tgt,
					Gradient: fmt.Sprintf("%s %s", srcColor, tgtColor),
				},
				Classes: "edge",
			}
			edgeOrder = append(edgeOrder, edgeID)
		}
	}

	// Helper to synthesize locals and terraform.workspace nodes
	ensureLocalOrWorkspace := func(modAddr, ref string) {
		if ref == "terraform.workspace" || strings.HasPrefix(ref, "terraform.workspace.") || strings.HasPrefix(ref, "terraform.workspace[") {
			wsID := "terraform.workspace"
			if _, exists := nodeMap[wsID]; !exists {
				addNode(Node{
					Data: NodeData{
						ID:          wsID,
						Label:       wsID,
						Type:        ResourceTypeLocal,
						Parent:      rootID,
						ParentColor: ColorLocal,
					},
					Classes: "locals",
				})
			}
			return
		}

		if strings.HasPrefix(ref, "local.") {
			name := strings.TrimPrefix(ref, "local.")
			if idx := strings.IndexAny(name, ".["); idx != -1 {
				name = name[:idx]
			}
			if name == "" {
				return
			}
			localRef := "local." + name
			localID := localRef
			if modAddr != "" {
				localID = modAddr + ".local." + name
			}

			if _, exists := nodeMap[localID]; !exists {
				fileID := ensureFileNode(modAddr, "locals.tf")
				addNode(Node{
					Data: NodeData{
						ID:          localID,
						Label:       localRef,
						Type:        ResourceTypeLocal,
						Parent:      fileID,
						ParentColor: ColorLocal,
					},
					Classes: "locals",
				})
			}
			return
		}

		if strings.Contains(ref, ".local.") {
			idx := strings.Index(ref, ".local.")
			mAddr := ref[:idx]
			name := ref[idx+len(".local."):]
			if dotIdx := strings.IndexAny(name, ".["); dotIdx != -1 {
				name = name[:dotIdx]
			}
			if name == "" {
				return
			}
			localRef := "local." + name
			localID := mAddr + ".local." + name
			if _, exists := nodeMap[localID]; !exists {
				fileID := ensureFileNode(mAddr, "locals.tf")
				addNode(Node{
					Data: NodeData{
						ID:          localID,
						Label:       localRef,
						Type:        ResourceTypeLocal,
						Parent:      fileID,
						ParentColor: ColorLocal,
					},
					Classes: "locals",
				})
			}
		}
	}

	// Helper to resolve reference strings to node IDs
	resolveTarget := func(scopePrefix, ref string) string {
		if strings.HasPrefix(ref, "each.") || strings.HasPrefix(ref, "count.") {
			return ""
		}

		// Handle terraform.workspace
		if ref == "terraform.workspace" || strings.HasPrefix(ref, "terraform.workspace.") || strings.HasPrefix(ref, "terraform.workspace[") {
			if _, ok := nodeMap["terraform.workspace"]; ok {
				return "terraform.workspace"
			}
		}

		// Handle local.<name>
		if strings.HasPrefix(ref, "local.") {
			name := strings.TrimPrefix(ref, "local.")
			if idx := strings.IndexAny(name, ".["); idx != -1 {
				name = name[:idx]
			}
			if scopePrefix != "" {
				scopedID := scopePrefix + ".local." + name
				if _, ok := nodeMap[scopedID]; ok {
					return scopedID
				}
			}
			unscopedID := "local." + name
			if _, ok := nodeMap[unscopedID]; ok {
				return unscopedID
			}
		}

		// Handle scoped local references, e.g. module.foo.local.bar
		if strings.Contains(ref, ".local.") {
			idx := strings.Index(ref, ".local.")
			mAddr := ref[:idx]
			name := ref[idx+len(".local."):]
			if dotIdx := strings.IndexAny(name, ".["); dotIdx != -1 {
				name = name[:dotIdx]
			}
			scopedID := mAddr + ".local." + name
			if _, ok := nodeMap[scopedID]; ok {
				return scopedID
			}
		}

		// Candidate with scopePrefix
		var candidates []string
		if scopePrefix != "" {
			candidates = append(candidates, scopePrefix+"."+ref)
		}
		candidates = append(candidates, ref)

		for _, cand := range candidates {
			// Direct match
			if _, ok := nodeMap[cand]; ok {
				return cand
			}

			// If candidate is module.<mod>.<attr>, check if module.<mod>.output.<attr> exists
			if strings.HasPrefix(cand, "module.") {
				lastDot := strings.LastIndex(cand, ".")
				if lastDot != -1 {
					modPart := cand[:lastDot]
					outPart := cand[lastDot+1:]
					outCand := modPart + ".output." + outPart
					outPartClean := bracketRegex.ReplaceAllString(outPart, "")
					outCand = modPart + ".output." + outPartClean
					if _, ok := nodeMap[outCand]; ok {
						return outCand
					}
				}
			}

			// Strip attribute paths until we find a match
			cur := cand
			for strings.Contains(cur, ".") {
				lastDot := strings.LastIndex(cur, ".")
				if strings.HasPrefix(cur, "module.") {
					modPart := cur[:lastDot]
					outPart := cur[lastDot+1:]
					outPartClean := bracketRegex.ReplaceAllString(outPart, "")
					outCand := modPart + ".output." + outPartClean
					if _, ok := nodeMap[outCand]; ok {
						return outCand
					}
				}

				cur = cur[:lastDot]
				if _, ok := nodeMap[cur]; ok {
					return cur
				}
				// Also check without bracket index if present
				nobracket := bracketRegex.ReplaceAllString(cur, "")
				if _, ok := nodeMap[nobracket]; ok {
					return nobracket
				}
			}
		}

		return ""
	}

	// Scan ConfigModule recursively to synthesize submodule variables, outputs, locals, and workspace
	var scanConfigModule func(modAddr string, cfgMod *tfjson.ConfigModule)
	scanConfigModule = func(modAddr string, cfgMod *tfjson.ConfigModule) {
		if cfgMod == nil {
			return
		}

		if modAddr != "" {
			varNames := slices.Sorted(maps.Keys(cfgMod.Variables))
			for _, vName := range varNames {
				vID := modAddr + ".var." + vName
				fileID := ensureFileNode(modAddr, "variables.tf")
				addNode(Node{
					Data: NodeData{
						ID:          vID,
						Label:       vID,
						Type:        ResourceTypeVariable,
						Parent:      fileID,
						ParentColor: ColorVariable,
					},
					Classes: "variable",
				})
			}

			outNames := slices.Sorted(maps.Keys(cfgMod.Outputs))
			for _, oName := range outNames {
				oID := modAddr + ".output." + oName
				fileID := ensureFileNode(modAddr, "outputs.tf")
				addNode(Node{
					Data: NodeData{
						ID:          oID,
						Label:       oID,
						Type:        ResourceTypeOutput,
						Parent:      fileID,
						ParentColor: ColorOutput,
					},
					Classes: "output",
				})
			}
		}

		for _, res := range cfgMod.Resources {
			for _, expr := range res.Expressions {
				if expr == nil {
					continue
				}
				for _, ref := range expr.References {
					ensureLocalOrWorkspace(modAddr, ref)
				}
			}
			for _, dep := range res.DependsOn {
				ensureLocalOrWorkspace(modAddr, dep)
			}
		}

		for _, out := range cfgMod.Outputs {
			if out != nil && out.Expression != nil {
				for _, ref := range out.Expression.References {
					ensureLocalOrWorkspace(modAddr, ref)
				}
			}
		}

		mNames := slices.Sorted(maps.Keys(cfgMod.ModuleCalls))
		for _, mName := range mNames {
			mCall := cfgMod.ModuleCalls[mName]
			if mCall == nil {
				continue
			}
			childModAddr := "module." + mName
			if modAddr != "" {
				childModAddr = modAddr + ".module." + mName
			}
			ensureModuleHierarchy(childModAddr)

			for _, expr := range mCall.Expressions {
				if expr == nil {
					continue
				}
				for _, ref := range expr.References {
					ensureLocalOrWorkspace(modAddr, ref)
				}
			}
			for _, dep := range mCall.DependsOn {
				ensureLocalOrWorkspace(modAddr, dep)
			}

			if mCall.Module != nil {
				scanConfigModule(childModAddr, mCall.Module)
			}
		}
	}

	// Traverse ConfigModule recursively to collect expressions & depends_on
	var traverseConfigModule func(modAddr string, cfgMod *tfjson.ConfigModule)
	traverseConfigModule = func(modAddr string, cfgMod *tfjson.ConfigModule) {
		if cfgMod == nil {
			return
		}

		// When modAddr != "" (child modules): evaluate submodule output expressions
		if modAddr != "" {
			outNames := slices.Sorted(maps.Keys(cfgMod.Outputs))
			for _, oName := range outNames {
				out := cfgMod.Outputs[oName]
				oID := modAddr + ".output." + oName
				if out != nil && out.Expression != nil {
					for _, ref := range out.Expression.References {
						ensureLocalOrWorkspace(modAddr, ref)
						tgt := resolveTarget(modAddr, ref)
						if tgt != "" {
							addEdge(oID, tgt)
						}
					}
				}
			}
		} else {
			// modAddr == "": Root module outputs
			outNames := slices.Sorted(maps.Keys(cfgMod.Outputs))
			for _, oName := range outNames {
				out := cfgMod.Outputs[oName]
				srcAddr := "output." + oName
				if _, exists := nodeMap[srcAddr]; !exists {
					fileID := ensureFileNode("", "outputs.tf")
					addNode(Node{
						Data: NodeData{
							ID:          srcAddr,
							Label:       srcAddr,
							Type:        ResourceTypeOutput,
							Parent:      fileID,
							ParentColor: ColorOutput,
						},
						Classes: "output",
					})
				}
				if out != nil && out.Expression != nil {
					for _, ref := range out.Expression.References {
						ensureLocalOrWorkspace(modAddr, ref)
						tgt := resolveTarget(modAddr, ref)
						if tgt != "" {
							addEdge(srcAddr, tgt)
						}
					}
				}
			}
		}

		// Process resources
		for _, res := range cfgMod.Resources {
			srcAddr := res.Address
			if modAddr != "" {
				srcAddr = modAddr + "." + res.Address
			}

			// Find all instances matching srcAddr in nodeMap
			srcNodes := []string{}
			if _, ok := nodeMap[srcAddr]; ok {
				srcNodes = append(srcNodes, srcAddr)
			}
			// Also find indexed instances, e.g. srcAddr[0]
			for nodeID := range nodeMap {
				if strings.HasPrefix(nodeID, srcAddr+"[") {
					srcNodes = append(srcNodes, nodeID)
				}
			}
			slices.Sort(srcNodes)

			// Check expressions references
			exprKeys := slices.Sorted(maps.Keys(res.Expressions))
			for _, k := range exprKeys {
				expr := res.Expressions[k]
				if expr == nil {
					continue
				}
				for _, ref := range expr.References {
					ensureLocalOrWorkspace(modAddr, ref)
					tgt := resolveTarget(modAddr, ref)
					if tgt != "" {
						for _, src := range srcNodes {
							addEdge(src, tgt)
						}
					}
				}
			}

			// Check depends_on
			for _, dep := range res.DependsOn {
				ensureLocalOrWorkspace(modAddr, dep)
				tgt := resolveTarget(modAddr, dep)
				if tgt != "" {
					for _, src := range srcNodes {
						addEdge(src, tgt)
					}
				}
			}
		}

		// Process child modules
		mNames := slices.Sorted(maps.Keys(cfgMod.ModuleCalls))
		for _, mName := range mNames {
			mCall := cfgMod.ModuleCalls[mName]
			if mCall == nil {
				continue
			}
			childModAddr := "module." + mName
			if modAddr != "" {
				childModAddr = modAddr + ".module." + mName
			}
			ensureModuleHierarchy(childModAddr)

			// Process module call expressions
			exprKeys := slices.Sorted(maps.Keys(mCall.Expressions))
			for _, k := range exprKeys {
				expr := mCall.Expressions[k]
				if expr == nil {
					continue
				}
				for _, ref := range expr.References {
					ensureLocalOrWorkspace(modAddr, ref)
					tgt := resolveTarget(modAddr, ref)
					if tgt != "" {
						addEdge(childModAddr, tgt)
					}
				}
			}

			if mCall.Module != nil {
				traverseConfigModule(childModAddr, mCall.Module)
			}
		}
	}

	if p.plan.Config != nil && p.plan.Config.RootModule != nil {
		scanConfigModule("", p.plan.Config.RootModule)
		traverseConfigModule("", p.plan.Config.RootModule)
	}

	// Identify modules that contain child modules (nested modules) and/or main.tf files
	childrenByParent := make(map[string][]Node, len(nodeMap))
	for _, n := range nodeMap {
		if n.Data.Parent != "" {
			childrenByParent[n.Data.Parent] = append(childrenByParent[n.Data.Parent], n)
		}
	}

	for id, modNode := range nodeMap {
		if modNode.Data.Type != ResourceTypeModule {
			continue
		}
		hasNestedModule := false
		hasMainTF := false
		for _, child := range childrenByParent[modNode.Data.ID] {
			if child.Data.Type == ResourceTypeModule {
				hasNestedModule = true
			}
			if child.Data.Type == ResourceTypeFile && strings.EqualFold(child.Data.Label, "main.tf") {
				hasMainTF = true
			}
		}
		if hasNestedModule && hasMainTF {
			modNode.Classes = strings.TrimSpace(modNode.Classes + " has-nested composite-module")
		} else if hasNestedModule {
			modNode.Classes = strings.TrimSpace(modNode.Classes + " has-nested")
		}
		nodeMap[id] = modNode
	}

	// Convert maps to ordered slices
	nodes := make([]Node, 0, len(nodeOrder))
	for _, id := range nodeOrder {
		nodes = append(nodes, nodeMap[id])
	}

	edges := make([]Edge, 0, len(edgeOrder))
	for _, id := range edgeOrder {
		edges = append(edges, edgeMap[id])
	}

	return &Graph{
		Nodes:   nodes,
		Edges:   edges,
		Summary: summary,
	}, nil
}
