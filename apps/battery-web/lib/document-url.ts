import api, { apiAnonymous } from "@/lib/api";

// Certificate/DoC URLs are captured as 1-hour Supabase signed URLs at upload
// time and persisted on the batch/passport record. By the time a viewer
// clicks the link the signed URL may already be expired, so instead of using
// the stored URL directly we ask the backend to mint a fresh one on click.
async function openFreshDocumentUrl(fetchFreshUrl: () => Promise<string>) {
  // Open the tab synchronously (before the await) so browser popup blockers
  // still treat this as a direct result of the user's click.
  const win = window.open("", "_blank", "noopener,noreferrer");
  try {
    const url = await fetchFreshUrl();
    if (win) {
      win.location.href = url;
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  } catch (error) {
    win?.close();
    throw error;
  }
}

/** Opens a batch's PLI certificate or Declaration of Conformity in a new tab, re-signing the URL first. */
export async function openBatchDocument(batchId: string, type: "pli" | "doc") {
  await openFreshDocumentUrl(async () => {
    const res = await api.get<{ url: string }>(`/batches/${batchId}/document-url`, {
      params: { type },
    });
    return res.data.url;
  });
}

/** Opens a passport's public Declaration of Conformity in a new tab, re-signing the URL first. */
export async function openPublicPassportDocument(passportUuid: string) {
  await openFreshDocumentUrl(async () => {
    const res = await apiAnonymous.get<{ url: string }>(
      `/passports/${passportUuid}/document-url`,
      { params: { type: "doc" } },
    );
    return res.data.url;
  });
}
