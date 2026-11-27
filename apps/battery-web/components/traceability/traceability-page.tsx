"use client";

import { useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/auth-context";
import { queryKeys } from "@/hooks/use-queries";
import { findTraceLots, findTracePacks, getTraceLot, getTracePack, type TraceEvidence } from "@/lib/api/traceability";
import { parseDispatchScan } from "@/lib/dispatch-scan";
import { toApiError } from "@/lib/utils";

type Lookup = { kind: "serial" | "code" | "pack" | "lot"; value: string };
type SelectLookup = (lookup: Lookup) => void;

const uuidLength = 36;

function packLookup(value: string): Lookup {
  // A scanner sends the passport URL as text. Resolve only its ID through our
  // private API. Arbitrary serials keep their original spelling and case.
  const path = value.match(/^(?:https?:\/\/[^/?#]+)?\/p\/([^/?#]+)\/?(?:[?#].*)?$/i)?.[1];
  const candidate = path ?? value;
  const scan = parseDispatchScan(candidate);
  return scan.kind === "uuid" && candidate.length === uuidLength
    ? { kind: "pack", value: scan.uuid.toLowerCase() }
    : { kind: "serial", value };
}

function useTraceQuery<T>(workspace: string, kind: Lookup["kind"], value: string, page: number,
  fetcher: (value: string, page: number, signal: AbortSignal) => Promise<T>) {
  return useQuery({
    queryKey: queryKeys.traceability(workspace, kind, value, page),
    queryFn: ({ signal }) => fetcher(value, page, signal),
    retry: false,
    gcTime: 0,
    refetchOnWindowFocus: false,
  });
}

function LookupForm({ mode, onSearch }: { mode: "pack" | "lot"; onSearch: SelectLookup }) {
  const [value, setValue] = useState("");
  const isPack = mode === "pack";
  return (
    <form className="flex flex-wrap items-end gap-3" onSubmit={(event) => {
      event.preventDefault();
      const input = value.trim();
      if (input) onSearch(isPack ? packLookup(input) : { kind: "code", value: input });
    }}>
      <div className="w-full max-w-md space-y-2">
        <Label htmlFor={`trace-${mode}`}>{isPack ? "Pack serial or passport QR link" : "Component lot code"}</Label>
        <Input id={`trace-${mode}`} value={value} onChange={(event) => setValue(event.target.value)}
          maxLength={isPack ? 2048 : 120} autoComplete="off" spellCheck={false} />
      </div>
      <Button type="submit" disabled={!value.trim()}>Search</Button>
    </form>
  );
}

function Pagination({ page, hasMore, onPage }: { page: number; hasMore: boolean; onPage: (page: number) => void }) {
  if (page === 0 && !hasMore) return null;
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="outline" size="sm" disabled={page === 0} onClick={() => onPage(page - 1)}>Previous</Button>
      <span className="text-sm text-muted-foreground">Page {page + 1}</span>
      <Button variant="outline" size="sm" disabled={!hasMore} onClick={() => onPage(page + 1)}>Next</Button>
    </div>
  );
}

function LookupError({ error }: { error: unknown }) {
  const { response } = toApiError(error);
  return <p role="alert" className="text-sm text-destructive">{response?.data?.error ?? "Could not load traceability records. Try the lookup again."}</p>;
}

function Records({ headings, children }: { headings: string[]; children: ReactNode }) {
  return (
    <div className="overflow-auto rounded-md border">
      <table className="w-full text-left text-sm">
        <thead className="bg-muted">
          <tr>{headings.map((label) => <th key={label} scope="col" className="px-3 py-2 font-medium">{label}</th>)}</tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function EvidenceCells({ evidence, pack = true }: { evidence: TraceEvidence; pack?: boolean }) {
  const possible = evidence.scope === "batch_unknown";
  const label = !pack ? "Batch record only" : possible ? "Possibly affected" : "Confirmed";
  const basis = evidence.scope === "pack" ? "Direct pack assignment"
    : possible ? "Pack allocation unknown" : "All packs in the batch";
  return (
    <>
      <td className="min-w-44 px-3 py-2">
        <Badge variant={possible || !pack ? "outline" : "secondary"}>{label}</Badge>
        <div className="mt-1 text-muted-foreground">{basis}</div>
      </td>
      <td className="min-w-40 break-all px-3 py-2">
        {evidence.file_name} · row {evidence.source_row}
        <div className="mt-1 text-muted-foreground">{new Date(evidence.recorded_at).toLocaleDateString()}</div>
      </td>
    </>
  );
}

function PackResults({ workspace, serial, select }: { workspace: string; serial: string; select: SelectLookup }) {
  const [page, setPage] = useState(0);
  const query = useTraceQuery(workspace, "serial", serial, page, findTracePacks);
  if (query.isPending) return <p role="status">Searching packs…</p>;
  if (query.isError) return <LookupError error={query.error} />;
  const { items, has_more } = query.data;
  if (page === 0 && items.length === 1 && !has_more) {
    return <PackDetails workspace={workspace} id={items[0].id} select={select} />;
  }
  return (
    <section className="space-y-3" aria-label="Pack search results">
      {items.length ? <p>More than one pack has this serial. Select its production batch.</p> : <p>No packs found for this serial.</p>}
      {items.map((pack) => <Button key={pack.id} variant="outline" className="mr-2 h-auto max-w-full whitespace-normal text-left"
        onClick={() => select({ kind: "pack", value: pack.id })}>{pack.batch_name} · {pack.batch_status} · {pack.batch_id}</Button>)}
      <Pagination page={page} hasMore={has_more} onPage={setPage} />
    </section>
  );
}

function LotResults({ workspace, code, select }: { workspace: string; code: string; select: SelectLookup }) {
  const [page, setPage] = useState(0);
  const query = useTraceQuery(workspace, "code", code, page, findTraceLots);
  if (query.isPending) return <p role="status">Searching lots…</p>;
  if (query.isError) return <LookupError error={query.error} />;
  const { items, has_more } = query.data;
  if (page === 0 && items.length === 1 && !has_more) {
    return <LotDetails workspace={workspace} id={items[0].id} select={select} />;
  }
  return (
    <section className="space-y-3" aria-label="Lot search results">
      {items.length ? <p>More than one lot has this code. Select the source and part number.</p> : <p>No lots found for this code.</p>}
      {items.map((lot) => <Button key={lot.id} variant="outline" className="mr-2 h-auto max-w-full whitespace-normal text-left"
        onClick={() => select({ kind: "lot", value: lot.id })}>{lot.source} · {lot.part_number}</Button>)}
      <Pagination page={page} hasMore={has_more} onPage={setPage} />
    </section>
  );
}

function PackDetails({ workspace, id, select }: { workspace: string; id: string; select: SelectLookup }) {
  const [page, setPage] = useState(0);
  const query = useTraceQuery(workspace, "pack", id, page, getTracePack);
  if (query.isPending) return <p role="status">Loading pack history…</p>;
  if (query.isError) return <LookupError error={query.error} />;
  const { pack, lots } = query.data;
  return (
    <section className="space-y-3" aria-label="Pack lot links">
      <h2 className="text-lg font-medium">{pack.serial_number}</h2>
      <p className="text-sm text-muted-foreground">{pack.batch_name} · {pack.batch_status} · {pack.batch_id}</p>
      {lots.items.length ? <Records headings={["Lot", "Source and part", "Match", "Import evidence"]}>
        {lots.items.map(({ lot, evidence }) => (
          <tr key={lot.id} className="border-t">
            <td className="px-3 py-2"><Button variant="link" className="h-auto break-all p-0 whitespace-normal" onClick={() => select({ kind: "lot", value: lot.id })}>{lot.lot_code}</Button></td>
            <td className="min-w-36 break-all px-3 py-2">{lot.source} · {lot.part_number}</td>
            <EvidenceCells evidence={evidence} />
          </tr>
        ))}
      </Records> : <p>No lot links are recorded for this pack on this page.</p>}
      <Pagination page={page} hasMore={lots.has_more} onPage={setPage} />
    </section>
  );
}

function LotDetails({ workspace, id, select }: { workspace: string; id: string; select: SelectLookup }) {
  const [page, setPage] = useState(0);
  const query = useTraceQuery(workspace, "lot", id, page, getTraceLot);
  if (query.isPending) return <p role="status">Loading lot impact…</p>;
  if (query.isError) return <LookupError error={query.error} />;
  const { lot, impact } = query.data;
  return (
    <section className="space-y-3" aria-label="Lot impact">
      <h2 className="text-lg font-medium">Lot {lot.lot_code}</h2>
      <p className="text-sm text-muted-foreground">{lot.source} · {lot.part_number}</p>
      {impact.items.length ? <Records headings={["Pack", "Batch", "Match", "Import evidence"]}>
        {impact.items.map(({ pack_id, serial_number, batch_id, batch_name, batch_status, evidence }) => (
          <tr key={pack_id ?? batch_id} className="border-t">
            <td className="min-w-36 px-3 py-2">{pack_id
              ? <Button variant="link" className="h-auto break-all p-0 whitespace-normal" onClick={() => select({ kind: "pack", value: pack_id })}>{serial_number}</Button>
              : "No packs registered"}</td>
            <td className="min-w-36 px-3 py-2" title={batch_id}>{batch_name} · {batch_status}</td>
            <EvidenceCells evidence={evidence} pack={Boolean(pack_id)} />
          </tr>
        ))}
      </Records> : <p>No packs or batch links are recorded for this lot on this page.</p>}
      <Pagination page={page} hasMore={impact.has_more} onPage={setPage} />
    </section>
  );
}

function Traceability({ workspace }: { workspace: string }) {
  const [mode, setMode] = useState<"pack" | "lot">("pack");
  const [selection, setSelection] = useState<Lookup>();
  const select = (lookup: Lookup) => {
    setMode(lookup.kind === "pack" || lookup.kind === "serial" ? "pack" : "lot");
    setSelection(lookup);
  };
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Traceability lookup type">
        {(["pack", "lot"] as const).map((option) => (
          <Button key={option} type="button" aria-pressed={mode === option}
            variant={mode === option ? "default" : "outline"}
            onClick={() => { setMode(option); setSelection(undefined); }}>
            Find a {option}
          </Button>
        ))}
      </div>
      <LookupForm key={mode} mode={mode} onSearch={select} />
      {selection?.kind === "serial" && <PackResults key={selection.value} workspace={workspace} serial={selection.value} select={select} />}
      {selection?.kind === "code" && <LotResults key={selection.value} workspace={workspace} code={selection.value} select={select} />}
      {selection?.kind === "pack" && <PackDetails key={selection.value} workspace={workspace} id={selection.value} select={select} />}
      {selection?.kind === "lot" && <LotDetails key={selection.value} workspace={workspace} id={selection.value} select={select} />}
    </div>
  );
}

export default function TraceabilityPage() {
  const { user, loading } = useAuth();
  const workspace = user ? `${user.tenant_id}:${user.id}` : undefined;
  return (
    <main className="mx-auto max-w-6xl space-y-5 p-6">
      <h1 className="text-2xl font-medium tracking-tight">Traceability</h1>
      {workspace ? <Traceability key={workspace} workspace={workspace} />
        : <p role="status">{loading ? "Loading workspace…" : "Sign in to look up traceability records."}</p>}
    </main>
  );
}
