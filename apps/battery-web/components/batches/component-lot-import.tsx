"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/auth-context";
import { processComponentLots, type ComponentLotResult } from "@/lib/api/component-lots";
import { canWrite } from "@/lib/rbac";
import { getApiErrorMessage } from "@/lib/utils";

const allocationLabels = {
  pack: "Specified pack",
  batch_all: "Every pack in batch",
  batch_unknown: "Pack allocation unknown",
};

function ImportForm() {
  const [file, setFile] = useState<File | null>(null);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<ComponentLotResult | null>(null);
  const [committed, setCommitted] = useState(false);
  const [error, setError] = useState("");

  async function process(validationToken?: string) {
    if (!file || pending) return;
    setPending(true);
    setError("");
    setResult(null);
    setCommitted(false);
    try {
      const response = await processComponentLots(file, validationToken);
      setResult(response);
      setCommitted(Boolean(validationToken && response.issues.length === 0));
    } catch (err) {
      setError(await getApiErrorMessage(err, "Could not process the CSV. Try again."));
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <section className="space-y-4 rounded-lg border bg-card p-5">
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>The template shows two example batches. Replace their IDs with UUIDs from Production Batches and use the exact serials recorded there.</p>
          <ul className="list-disc space-y-1 pl-5">
            <li><code>pack</code> requires the serial of a specific pack in the chosen batch.</li>
            <li><code>batch_all</code> means the source confirms every pack used the lot. Leave the serial blank.</li>
            <li><code>batch_unknown</code> records the lot against the batch when pack allocation is unknown. Leave the serial blank.</li>
          </ul>
          <p>Use any consistent supplier or source identifier in the source column. Keep leading zeros in lot codes. CSV limit is 500 data rows and 1 MiB.</p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <a href="/templates/component-lots.csv" download>Download example CSV</a>
        </Button>
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(event) => { event.preventDefault(); void process(); }}
        >
          <div className="w-full max-w-sm space-y-2">
            <Label htmlFor="component-lot-file">Component lot CSV</Label>
            <Input
              id="component-lot-file"
              type="file"
              accept=".csv,text/csv"
              disabled={pending}
              onChange={(event) => {
                const selected = event.currentTarget.files?.[0] ?? null;
                setFile(selected && selected.size <= 1024 * 1024 ? selected : null);
                setResult(null);
                setCommitted(false);
                setError(selected && selected.size > 1024 * 1024 ? "Use a CSV of 1 MiB or smaller." : "");
              }}
            />
          </div>
          <Button type="submit" disabled={!file || pending}>Validate CSV</Button>
        </form>
        {pending && <p role="status" className="text-sm text-muted-foreground">Processing CSV…</p>}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      </section>
      {result && (
        <section className="space-y-4 rounded-lg border bg-card p-5" aria-labelledby="lot-import-result">
          <h2 id="lot-import-result" className="text-lg font-medium">{committed ? "Import complete" : "Validation results"}</h2>
          <p role="status" className="text-sm text-muted-foreground">
            {committed ? `${result.new_rows} saved` : `${result.new_rows} new`}, {result.existing_rows} {committed ? "skipped" : "existing or repeated"}.
          </p>
          {result.issues.length > 0 && (
            <div role="alert" className="space-y-2 text-sm">
              <p className="font-medium text-destructive">Fix these issues in the CSV and validate again. No rows were saved.</p>
              <ul className="max-h-64 list-disc space-y-1 overflow-y-auto pl-5">
                {result.issues.map((issue) => (
                  <li key={`${issue.line}:${issue.field}:${issue.message}`}>
                    Line {issue.line} · <code>{issue.field}</code> · {issue.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {result.rows.length > 0 && (
            <div className="max-h-96 overflow-auto rounded-md border">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-muted">
                  <tr>{["Line", "Batch", "Allocation", "Serial", "Source", "Part", "Lot", "Result"].map((heading) => (
                    <th key={heading} scope="col" className="whitespace-nowrap px-3 py-2 font-medium">{heading}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {result.rows.map((row) => (
                    <tr key={row.line} className="border-t border-border">
                      <td className="px-3 py-2 tabular-nums">{row.line}</td>
                      <td className="break-all px-3 py-2" title={row.batch_id}>{row.batch_name || row.batch_id}</td>
                      <td className="min-w-36 px-3 py-2">{allocationLabels[row.scope]}</td>
                      <td className="break-all px-3 py-2">{row.serial_number || "—"}</td>
                      <td className="break-all px-3 py-2">{row.source}</td>
                      <td className="break-all px-3 py-2">{row.part_number}</td>
                      <td className="break-all px-3 py-2 font-mono">{row.lot_code}</td>
                      <td className="whitespace-nowrap px-3 py-2 capitalize">{committed && row.status === "new" ? "Saved" : row.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {result.validation_token && (
            <Button onClick={() => void process(result.validation_token)}>Confirm import</Button>
          )}
        </section>
      )}
    </>
  );
}

export default function ComponentLotImportPage() {
  const { user, loading } = useAuth();
  return (
    <main className="mx-auto max-w-6xl space-y-5 p-6">
      <Link href="/dashboard/batches" className="text-sm text-muted-foreground hover:text-foreground">← Production Batches</Link>
      <div>
        <h1 className="text-2xl font-medium tracking-tight">Import component lots</h1>
        <p className="mt-1 text-sm text-muted-foreground">Validate recorded lot links against existing production batches and packs before saving.</p>
      </div>
      {loading ? <p role="status">Loading workspace…</p> : canWrite(user?.role) ? (
        <ImportForm key={`${user?.tenant_id}:${user?.id}`} />
      ) : (
        <p className="text-sm text-muted-foreground">Importing component lots requires workspace write access.</p>
      )}
    </main>
  );
}
