import api from "@/lib/api";

export async function inviteSupplier(invitation: {
  email: string;
  company_name: string;
  contact_phone: string;
  country: string;
}) {
  const { data } = await api.post<{ invitation_token: string; email_sent: boolean }>(
    "/suppliers/invitations",
    invitation,
  );
  return data;
}
