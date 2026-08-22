import api from "../api";

export type PassportVCStatus = "draft" | "issued" | string;

export interface PassportVCDocument {
  "@context"?: string[];
  id?: string;
  type?: string[];
  issuer?: string;
  issuanceDate?: string;
  credentialSubject?: unknown;
  proof?: unknown;
  [key: string]: unknown;
}

export interface PassportVCResponse {
  vc: PassportVCDocument;
  status: PassportVCStatus;
  message?: string;
}

/** POST /passports/{uuid}/vc — sign (or return an unsigned draft if crypto is off). */
export async function issuePassportVC(passportUuid: string): Promise<PassportVCResponse> {
  const response = await api.post<PassportVCResponse>(`/passports/${passportUuid}/vc`);
  return response.data;
}

/** GET /passports/{uuid}/vc — latest stored credential. 404 if none issued. */
export async function getPassportVC(passportUuid: string): Promise<PassportVCResponse> {
  const response = await api.get<PassportVCResponse>(`/passports/${passportUuid}/vc`);
  return response.data;
}
