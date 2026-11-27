import { isAxiosError } from "axios";
import api from "@/lib/api";
import { prepareSupplierCache } from "@/lib/supplier-cache";

export interface BatteryModel {
  id: string;
  code: string;
  name: string;
  created_at: string;
}

export interface IntendedBatteryPart {
  part_number: string;
  name: string;
  quantity: number;
}

export interface ModelRevisionSpecs {
  chemistry: string;
  voltage: string;
  capacity: string;
  battery_category?: string;
  intended_bom?: IntendedBatteryPart[];
}

export interface BatteryModelRevision {
  id: string;
  model_id: string;
  revision_number: number;
  version: number;
  specs: ModelRevisionSpecs;
  released_at: string | null;
  updated_at: string;
}

interface PageResult {
  page: number;
  total_pages: number;
  has_more: boolean;
}

const collection = "/battery-models";
const modelPath = (modelId: string) => `${collection}/${encodeURIComponent(modelId)}`;

export async function listBatteryModels(page: number) {
  await prepareSupplierCache();
  const { data } = await api.get<PageResult & { models: BatteryModel[] }>(collection, { params: { page, limit: 25 } });
  return data;
}

export async function getBatteryModel(modelId: string, page: number) {
  await prepareSupplierCache();
  const { data } = await api.get<PageResult & { model: BatteryModel; revisions: BatteryModelRevision[] }>(
    modelPath(modelId), { params: { page, limit: 20 } },
  );
  return data;
}

export async function createBatteryModel(code: string, name: string) {
  const { data } = await api.post<BatteryModel>(collection, { code, name });
  return data;
}

export async function createBatteryModelDraft(modelId: string) {
  const { data } = await api.post<BatteryModelRevision>(`${modelPath(modelId)}/revisions`);
  return data;
}

export async function saveBatteryModelDraft(revision: BatteryModelRevision, specs: ModelRevisionSpecs) {
  const path = `${modelPath(revision.model_id)}/revisions/${encodeURIComponent(revision.id)}`;
  const { data } = await api.put<BatteryModelRevision>(path, { version: revision.version, specs });
  return data;
}

export async function releaseBatteryModelDraft(revision: BatteryModelRevision) {
  const path = `${modelPath(revision.model_id)}/revisions/${encodeURIComponent(revision.id)}/release`;
  const { data } = await api.post<BatteryModelRevision>(path, { version: revision.version });
  return data;
}

export function batteryModelError(error: unknown, fallback: string) {
  if (!isAxiosError<{ error?: string }>(error)) return fallback;
  const status = error.response?.status;
  if (status === 404) return "Battery model or revision not found.";
  if (status === 400 || status === 403 || status === 409 || status === 422) {
    return error.response?.data?.error || fallback;
  }
  return fallback;
}
