"use client";

import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { TemplateCard } from "@/components/templates/TemplateCard";
import { DeleteTemplateDialog } from "@/components/templates/DeleteTemplateDialog";
import { Search, Sparkles, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useTemplates } from "@/hooks/use-queries";
import Link from "next/link";

interface Template {
  id: string;
  name: string;
  specs: Record<string, unknown>;
  market_region: string;
  created_at: string;
}

export default function TemplatesPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<Template | null>(null);

  const { data: templates = [], isLoading: loading } = useTemplates(
    user?.tenant_id,
    "BATTERY"
  );

  const handleDeleteClick = (template: Template) => {
    setTemplateToDelete(template);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!templateToDelete) return;
    try {
      const api = (await import("@/lib/api")).default;
      await api.delete(`/templates/${templateToDelete.id}`);
      toast.success(`Template "${templateToDelete.name}" deleted`);
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
    } catch {
      toast.error("Failed to delete template");
    }
  };

  // Filter templates by search query
  const filteredTemplates = templates.filter(
    (t: Template) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.specs.chemistry as string)?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--brand)]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 font-sans">
      <div className="w-full mx-auto space-y-8">
        {/* Header */}
        <div className="relative overflow-visible border border-border bg-transparent p-6">
          <span className="absolute -top-0.5 -left-0.5 w-1 h-1 bg-border" />
          <span className="absolute -top-0.5 -right-0.5 w-1 h-1 bg-border" />
          <span className="absolute -bottom-0.5 -left-0.5 w-1 h-1 bg-border" />
          <span className="absolute -bottom-0.5 -right-0.5 w-1 h-1 bg-border" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl text-foreground tracking-tight">
                Batch Templates
              </h1>
              <p className="text-muted-foreground mt-1">
                Saved templates with market-specific compliance data. Use them when creating new batches.
              </p>
            </div>
            <Link href="/dashboard/batches">
              <Button className="bg-background hover:bg-primary/90 text-white">
                <ArrowRight className="mr-2 h-4 w-4" />
                Create Batch
              </Button>
            </Link>
          </div>
        </div>

        {/* Search */}
        {templates.length > 0 && (
          <div className="relative mb-6 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        )}

        {/* Templates Grid */}
        {filteredTemplates.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTemplates.map((template: Template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onDelete={() => handleDeleteClick(template)}
                onUse={() => {
                  toast.info(`"${template.name}" — select this template from the dropdown when creating a batch`);
                }}
              />
            ))}
          </div>
        ) : templates.length === 0 ? (
          /* Empty State */
          <Card className="bg-transparent border-border">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="p-4 rounded-full bg-emerald-500/10 mb-4">
                <Sparkles className="h-10 w-10 text-emerald-500" />
              </div>
              <h3 className="text-xl text-foreground mb-2">No templates yet</h3>
              <p className="text-muted-foreground text-center max-w-sm mb-6">
                Create a batch and check &quot;Save as Template&quot; on the Review step to save your first template.
              </p>
              <Link href="/dashboard/batches">
                <Button className="bg-background hover:bg-primary/90 text-white">
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Go to Batches
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          /* No search results */
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No templates matching &quot;{searchQuery}&quot;
            </p>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <DeleteTemplateDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          templateName={templateToDelete?.name || ""}
          onConfirm={handleDeleteConfirm}
        />
      </div>
    </div>
  );
}
