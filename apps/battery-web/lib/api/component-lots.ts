import api from "@/lib/api";

export interface ComponentLotIssue {
  line: number;
  field: string;
  message: string;
}

interface ComponentLotPreviewRow {
  line: number;
  batch_id: string;
  batch_name: string;
  scope: "pack" | "batch_all" | "batch_unknown";
  serial_number: string;
  source: string;
  part_number: string;
  lot_code: string;
  status: "new" | "existing" | "duplicate" | "invalid";
}

export interface ComponentLotResult {
  rows: ComponentLotPreviewRow[];
  issues: ComponentLotIssue[];
  new_rows: number;
  existing_rows: number;
  validation_token?: string;
  import_id?: string;
}

export async function processComponentLots(file: File, validationToken?: string) {
  const form = new FormData();
  form.append("file", file);
  if (validationToken) form.append("validation_token", validationToken);
  const path = validationToken ? "/component-lot-imports" : "/component-lot-imports/validate";
  const { data } = await api.post<ComponentLotResult>(path, form, {
    headers: { "Content-Type": "multipart/form-data" },
    validateStatus: (status) => status === 200 || status === 422,
  });
  return data;
}
