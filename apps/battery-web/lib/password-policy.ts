/**
 * Client-side password policy (S-13) — must stay aligned with
 * services/battery-api/internal/services/password_policy.go
 */
export const MIN_PASSWORD_LENGTH = 12;

export const PASSWORD_POLICY_HINT =
  "at least 12 characters, including a letter and a number";

/** Small offline blocklist (subset of server list) for immediate UX feedback. */
const COMMON_PASSWORDS = new Set([
  "password",
  "password1",
  "password12",
  "password123",
  "password1234",
  "passw0rd",
  "12345678",
  "123456789",
  "1234567890",
  "123456789012",
  "qwerty123",
  "qwertyuiop",
  "welcome123",
  "welcome1234",
  "admin123456",
  "changeme123",
  "exportready",
  "exportready123",
  "battery12345",
  "anvayalabs",
  "anvayalabs123",
]);

export type PasswordRequirement = {
  id: string;
  label: string;
  met: boolean;
};

export function getPasswordRequirements(
  password: string,
  email = "",
): PasswordRequirement[] {
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const minLength = [...password].length >= MIN_PASSWORD_LENGTH;
  const lower = password.trim().toLowerCase();
  const notCommon = password.length === 0 || !COMMON_PASSWORDS.has(lower);
  let notEmail = true;
  if (email && password) {
    const em = email.trim().toLowerCase();
    const local = em.includes("@") ? em.slice(0, em.indexOf("@")) : em;
    notEmail = lower !== em && lower !== local;
  }

  return [
    {
      id: "length",
      label: `At least ${MIN_PASSWORD_LENGTH} characters`,
      met: minLength,
    },
    { id: "letter", label: "At least one letter", met: hasLetter },
    { id: "number", label: "At least one number", met: hasNumber },
    { id: "common", label: "Not a common password", met: notCommon },
    ...(email
      ? [{ id: "email", label: "Not the same as your email", met: notEmail }]
      : []),
  ];
}

export function isPasswordValid(password: string, email = ""): boolean {
  return getPasswordRequirements(password, email).every((r) => r.met);
}
