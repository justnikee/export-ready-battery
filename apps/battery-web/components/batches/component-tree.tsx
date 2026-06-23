"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronDown, Box, Beaker, Layers, Cpu, AlertTriangle } from "lucide-react";

interface ComponentNode {
  id: string;
  component_type: string;
  name: string;
  model_number?: string;
  chemistry?: string;
  manufacturer?: string;
  country_of_origin?: string;
  weight_kg?: number;
  ce_marking?: boolean;
  hazardous_lead?: boolean;
  hazardous_mercury?: boolean;
  hazardous_cadmium?: boolean;
  children?: ComponentNode[];
}

interface ComponentTreeProps {
  tree: ComponentNode[];
  onSelect?: (node: ComponentNode) => void;
  selectedId?: string;
}

function getTypeIcon(type: string) {
  switch (type) {
    case "pack": return <Box className="w-4 h-4" />;
    case "module": return <Layers className="w-4 h-4" />;
    case "cell": return <Beaker className="w-4 h-4" />;
    default: return <Cpu className="w-4 h-4" />;
  }
}

function getTypeColor(type: string) {
  switch (type) {
    case "pack": return "bg-blue-500/10 text-blue-600 border-blue-200";
    case "module": return "bg-purple-500/10 text-purple-600 border-purple-200";
    case "cell": return "bg-emerald-500/10 text-emerald-600 border-emerald-200";
    default: return "bg-gray-500/10 text-gray-600 border-gray-200";
  }
}

function TreeNode({ node, level, onSelect, selectedId }: {
  node: ComponentNode;
  level: number;
  onSelect?: (node: ComponentNode) => void;
  selectedId?: string;
}) {
  const [expanded, setExpanded] = useState(level < 2);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedId === node.id;

  return (
    <div className="select-none">
      <div
        className={`flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer transition-colors ${
          isSelected ? "bg-primary/10 border border-primary/20" : "hover:bg-muted/50"
        }`}
        style={{ marginLeft: level * 24 }}
        onClick={() => onSelect?.(node)}
      >
        {hasChildren ? (
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            className="w-5 h-5 flex items-center justify-center rounded hover:bg-muted"
          >
            {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        ) : (
          <span className="w-5" />
        )}

        <div className={`p-1.5 rounded-md ${getTypeColor(node.component_type)}`}>
          {getTypeIcon(node.component_type)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate">{node.name}</span>
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 ${getTypeColor(node.component_type)}`}>
              {node.component_type}
            </Badge>
            {node.ce_marking && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-green-500/10 text-green-600 border-green-200">
                CE
              </Badge>
            )}
            {(node.hazardous_lead || node.hazardous_mercury || node.hazardous_cadmium) && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-red-500/10 text-red-600 border-red-200">
                <AlertTriangle className="w-3 h-3 mr-0.5" />
                Hazard
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            {node.model_number && (
              <span className="text-xs text-muted-foreground">{node.model_number}</span>
            )}
            {node.chemistry && (
              <span className="text-xs text-muted-foreground">{node.chemistry}</span>
            )}
            {node.manufacturer && (
              <span className="text-xs text-muted-foreground truncate max-w-[150px]">{node.manufacturer}</span>
            )}
            {node.country_of_origin && (
              <span className="text-xs text-muted-foreground">{node.country_of_origin}</span>
            )}
            {node.weight_kg && (
              <span className="text-xs text-muted-foreground">{node.weight_kg} kg</span>
            )}
          </div>
        </div>
      </div>

      {expanded && hasChildren && (
        <div className="mt-0.5">
          {node.children!.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              onSelect={onSelect}
              selectedId={selectedId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ComponentTree({ tree, onSelect, selectedId }: ComponentTreeProps) {
  if (tree.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Box className="w-8 h-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">No components defined for this batch.</p>
        <p className="text-xs text-muted-foreground">Add cells, modules, and pack details to build the BOM.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {tree.map((node) => (
        <TreeNode
          key={node.id}
          node={node}
          level={0}
          onSelect={onSelect}
          selectedId={selectedId}
        />
      ))}
    </div>
  );
}
