export const SESSION_DURATION_MS: number;

export function isPasswordHashValid(encodedHash: unknown): boolean;
export function isSessionSecretValid(secret: unknown): boolean;
export function hashPassword(password: string): Promise<string>;
export function verifyPassword(
  password: string,
  encodedHash: string,
): Promise<boolean>;
export function signAdminSession(secret: string, now?: number): string;
export function verifyAdminSession(
  secret: string,
  token: string,
  now?: number,
): boolean;
