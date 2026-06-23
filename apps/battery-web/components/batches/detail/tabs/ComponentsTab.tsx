"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Boxes } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import ComponentTree from "@/components/batches/component-tree";
import ComponentFormDialog, {
  type ComponentFormData,
} from "@/components/batches/component-form-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

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

interface ComponentsTabProps {
  batchId: string;
  isDraft: boolean;
}

export function ComponentsTab({ batchId, isDraft }: ComponentsTabProps) {
  const [tree, setTree] = useState<ComponentNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editComponent, setEditComponent] = useState<ComponentFormData | undefined>();
  const [parentId, setParentId] = useState<string | undefined>();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | undefined>();

  const fetchTree = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/batches/${batchId}/components/tree`);
      setTree(res.data.tree || []);
    } catch {
      toast.error("Failed to load component tree");
    } finally {
      setLoading(false);
    }
  }, [batchId]);

  useEffect(() => {
    fetchTree();
  }, [fetchTree]);

  const handleAdd = () => {
    setEditComponent(undefined);
    setParentId(undefined);
    setDialogOpen(true);
  };

  const handleAddChild = (nodeId: string) => {
    setEditComponent(undefined);
    setParentId(nodeId);
    setDialogOpen(true);
  };

  const handleEdit = (node: ComponentNode) => {
    const formData: ComponentFormData = {
      id: node.id,
      component_type: node.component_type,
      name: node.name,
      model_number: node.model_number,
      chemistry: node.chemistry,
      manufacturer: node.manufacturer,
      country_of_origin: node.country_of_origin,
      weight_kg: node.weight_kg,
      ce_marking: node.ce_marking,
      hazardous_lead: node.hazardous_lead,
      hazardous_mercury: node.hazardous_mercury,
      hazardous_cadmium: node.hazardous_cadmium,
    };
    setEditComponent(formData);
    setParentId(undefined);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/components/${id}`);
      toast.success("Component deleted");
      setConfirmDelete(null);
      setSelectedId(undefined);
      fetchTree();
    } catch {
      toast.error("Failed to delete component");
    }
  };

  const selectedNode = findNode(tree, selectedId);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Bill of Materials</h3>
          <p className="text-xs text-muted-foreground">
            {tree.length === 0
              ? "No components yet."
              : `${countNodes(tree)} component(s) defined.`}
          </p>
        </div>
        {isDraft && (
          <Button size="sm" onClick={handleAdd}>
            <Plus className="w-4 h-4 mr-1" />
            Add Component
          </Button>
        )}
      </div>

      {/* Tree + Detail panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 border border-border rounded-lg p-4">
          {loading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Loading components...
            </div>
          ) : (
            <ComponentTree
              tree={tree}
              selectedId={selectedId}
              onSelect={(node) => setSelectedId(node.id)}
            />
          )}
        </div>

        {/* Selection detail / actions */}
        <div className="border border-border rounded-lg p-4">
          {selectedNode ? (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium">{selectedNode.name}</h4>
                <p className="text-xs text-muted-foreground capitalize">
                  {selectedNode.component_type}
                </p>
              </div>

              <div className="space-y-2 text-sm">
                {selectedNode.model_number && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Model</span>
                    <span>{selectedNode.model_number}</span>
                  </div>
                )}
                {selectedNode.chemistry && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Chemistry</span>
                    <span>{selectedNode.chemistry}</span>
                  </div>
                )}
                {selectedNode.manufacturer && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Manufacturer</span>
                    <span className="truncate max-w-[140px]">
                      {selectedNode.manufacturer}
                    </span>
                  </div>
                )}
                {selectedNode.country_of_origin && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Origin</span>
                    <span>{selectedNode.country_of_origin}</span>
                  </div>
                )}
                {selectedNode.weight_kg !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Weight</span>
                    <span>{selectedNode.weight_kg} kg</span>
                  </div>
                )}
              </div>

              {isDraft && (
                <div className="flex flex-col gap-2 pt-2 border-t border-border">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddChild(selectedNode.id)}
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Add Child
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(selectedNode)}
                  >
                    <Pencil className="w-3.5 h-3.5 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setConfirmDelete(selectedNode.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    Delete
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
              <Boxes className="w-8 h-8 mb-2" />
              <p className="text-sm">Select a component to view details</p>
            </div>
          )}
        </div>
      </div>

      <ComponentFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        batchId={batchId}
        parentId={parentId}
        editComponent={editComponent}
        onSaved={fetchTree}
      />

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(open) => {
          if (!open) setConfirmDelete(null);
        }}
        title="Delete Component?"
        description="This will permanently remove the component and all its children from the BOM. This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
        onConfirm={() => {
          if (confirmDelete) handleDelete(confirmDelete);
        }}
      />
    </div>
  );
}

function countNodes(nodes: ComponentNode[]): number {
  let count = 0;
  for (const n of nodes) {
    count += 1;
    if (n.children) count += countNodes(n.children);
  }
  return count;
}

function findNode(
  nodes: ComponentNode[],
  id: string | undefined
): ComponentNode | undefined {
  if (!id) return undefined;
  for (const n of nodes) {
    if (n.id === id) return n;
    if (n.children) {
      const found = findNode(n.children, id);
      if (found) return found;
    }
  }
  return undefined;
}
