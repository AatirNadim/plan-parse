package core

import (
	"fmt"
	"path/filepath"
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
					addNode(Node{
						Data: NodeData{
							ID:          currentMod,
							Label:       currentMod,
							Type:        ResourceTypeModule,
							Parent:      parentMod,
							ParentColor: ColorModule,
						},
						Classes: "module",
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
			addNode(Node{
				Data: NodeData{
					ID:          fileID,
					Label:       fileName,
					Type:        ResourceTypeFile,
					Parent:      parentModID,
					ParentColor: ColorModule,
				},
				Classes: "fname",
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
		for vName := range p.plan.Config.RootModule.Variables {
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
		for vName := range p.plan.Variables {
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
		for oName, oc := range p.plan.OutputChanges {
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

	// Helper to resolve reference strings to node IDs
	resolveTarget := func(scopePrefix, ref string) string {
		if strings.HasPrefix(ref, "each.") || strings.HasPrefix(ref, "count.") {
			return ""
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

			// Strip attribute paths until we find a match
			cur := cand
			for strings.Contains(cur, ".") {
				lastDot := strings.LastIndex(cur, ".")
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

	// Traverse ConfigModule recursively to collect expressions & depends_on
	var traverseConfigModule func(modAddr string, cfgMod *tfjson.ConfigModule)
	traverseConfigModule = func(modAddr string, cfgMod *tfjson.ConfigModule) {
		if cfgMod == nil {
			return
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

			// Check expressions references
			for _, expr := range res.Expressions {
				if expr == nil {
					continue
				}
				for _, ref := range expr.References {
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
				tgt := resolveTarget(modAddr, dep)
				if tgt != "" {
					for _, src := range srcNodes {
						addEdge(src, tgt)
					}
				}
			}
		}

		// Process outputs
		for oName, out := range cfgMod.Outputs {
			srcAddr := "output." + oName
			if modAddr != "" {
				srcAddr = modAddr + ".output." + oName
			}
			if out != nil && out.Expression != nil {
				for _, ref := range out.Expression.References {
					tgt := resolveTarget(modAddr, ref)
					if tgt != "" {
						addEdge(srcAddr, tgt)
					}
				}
			}
		}

		// Process child modules
		for mName, mCall := range cfgMod.ModuleCalls {
			childModAddr := "module." + mName
			if modAddr != "" {
				childModAddr = modAddr + ".module." + mName
			}
			// Process module call expressions
			for _, expr := range mCall.Expressions {
				if expr == nil {
					continue
				}
				for _, ref := range expr.References {
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
		traverseConfigModule("", p.plan.Config.RootModule)
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
