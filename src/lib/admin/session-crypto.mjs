import {
  createHmac,
  randomBytes,
  scrypt,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);
const PASSWORD_HASH_ALGORITHM = "scrypt";
const SCRYPT_COST = 32768;
const SCRYPT_BLOCK_SIZE = 8;
const SCRYPT_PARALLELIZATION = 1;
const PASSWORD_SALT_BYTES = 16;
const PASSWORD_KEY_BYTES = 64;
const SESSION_SECRET_BYTES = 32;
export const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;
const SCRYPT_OPTIONS = Object.freeze({
  N: SCRYPT_COST,
  r: SCRYPT_BLOCK_SIZE,
  p: SCRYPT_PARALLELIZATION,
  maxmem: 64 * 1024 * 1024,
});

function isValidAdminPassword(password) {
  return typeof password === "string" && password.length > 0;
}

function parsePasswordHash(encodedHash) {
  if (typeof encodedHash !== "string") return undefined;

  const delimiter = encodedHash.startsWith(`${PASSWORD_HASH_ALGORITHM}$`)
    ? "$"
    : ":";
  const parts = encodedHash.split(delimiter);
  if (parts.length !== 6) return undefined;

  const [algorithm, cost, blockSize, parallelization, saltText, keyText] = parts;
  if (
    algorithm !== PASSWORD_HASH_ALGORITHM ||
    cost !== String(SCRYPT_COST) ||
    blockSize !== String(SCRYPT_BLOCK_SIZE) ||
    parallelization !== String(SCRYPT_PARALLELIZATION) ||
    !/^[A-Za-z0-9_-]+$/.test(saltText) ||
    !/^[A-Za-z0-9_-]+$/.test(keyText)
  ) {
    return undefined;
  }

  const salt = Buffer.from(saltText, "base64url");
  const key = Buffer.from(keyText, "base64url");
  if (
    salt.length !== PASSWORD_SALT_BYTES ||
    key.length !== PASSWORD_KEY_BYTES ||
    salt.toString("base64url") !== saltText ||
    key.toString("base64url") !== keyText
  ) {
    return undefined;
  }

  return { salt, key };
}

export function isPasswordHashValid(encodedHash) {
  return Boolean(parsePasswordHash(encodedHash));
}

export function isSessionSecretValid(secret) {
  if (
    typeof secret !== "string" ||
    !/^[A-Za-z0-9_-]{43}$/.test(secret)
  ) {
    return false;
  }

  const decoded = Buffer.from(secret, "base64url");
  return (
    decoded.length === SESSION_SECRET_BYTES &&
    decoded.toString("base64url") === secret
  );
}

export async function hashPassword(password) {
  if (!isValidAdminPassword(password)) {
    throw new Error("Admin password must not be empty.");
  }

  const salt = randomBytes(PASSWORD_SALT_BYTES);
  const key = await scryptAsync(password, salt, PASSWORD_KEY_BYTES, SCRYPT_OPTIONS);

  return [
    PASSWORD_HASH_ALGORITHM,
    SCRYPT_COST,
    SCRYPT_BLOCK_SIZE,
    SCRYPT_PARALLELIZATION,
    salt.toString("base64url"),
    key.toString("base64url"),
  ].join(":");
}

export async function verifyPassword(password, encodedHash) {
  const parsed = parsePasswordHash(encodedHash);
  if (!parsed || !isValidAdminPassword(password)) {
    return false;
  }

  try {
    const candidate = await scryptAsync(
      password,
      parsed.salt,
      PASSWORD_KEY_BYTES,
      SCRYPT_OPTIONS,
    );
    return timingSafeEqual(candidate, parsed.key);
  } catch {
    return false;
  }
}

export function signAdminSession(secret, now = Date.now()) {
  if (!isSessionSecretValid(secret)) {
    throw new Error("ADMIN_SESSION_SECRET must be a 32-byte base64url value.");
  }

  const issuedAt = Math.floor(now / 1000);
  const payload = Buffer.from(
    JSON.stringify({
      version: 1,
      issuedAt,
      expiresAt: issuedAt + SESSION_DURATION_MS / 1000,
      nonce: randomBytes(16).toString("base64url"),
    }),
  ).toString("base64url");
  const signature = createHmac("sha256", Buffer.from(secret, "base64url"))
    .update(payload)
    .digest("base64url");

  return `${payload}.${signature}`;
}

export function verifyAdminSession(secret, token, now = Date.now()) {
  if (
    !isSessionSecretValid(secret) ||
    typeof token !== "string" ||
    token.length > 1024
  ) {
    return false;
  }

  const parts = token.split(".");
  if (
    parts.length !== 2 ||
    !/^[A-Za-z0-9_-]+$/.test(parts[0]) ||
    !/^[A-Za-z0-9_-]{43}$/.test(parts[1])
  ) {
    return false;
  }

  const [payload, signatureText] = parts;
  const suppliedSignature = Buffer.from(signatureText, "base64url");
  if (
    suppliedSignature.length !== 32 ||
    suppliedSignature.toString("base64url") !== signatureText
  ) {
    return false;
  }

  const expectedSignature = createHmac(
    "sha256",
    Buffer.from(secret, "base64url"),
  )
    .update(payload)
    .digest();

  if (!timingSafeEqual(suppliedSignature, expectedSignature)) return false;

  try {
    const payloadText = Buffer.from(payload, "base64url").toString("utf8");
    if (Buffer.from(payloadText, "utf8").toString("base64url") !== payload) {
      return false;
    }

    const claims = JSON.parse(payloadText);
    if (
      typeof claims !== "object" ||
      claims === null ||
      Object.keys(claims).sort().join(",") !== "expiresAt,issuedAt,nonce,version" ||
      claims.version !== 1 ||
      !Number.isSafeInteger(claims.issuedAt) ||
      !Number.isSafeInteger(claims.expiresAt) ||
      typeof claims.nonce !== "string" ||
      !/^[A-Za-z0-9_-]{22}$/.test(claims.nonce)
    ) {
      return false;
    }

    const nowSeconds = Math.floor(now / 1000);
    return (
      claims.issuedAt <= nowSeconds &&
      claims.expiresAt > nowSeconds &&
      claims.expiresAt - claims.issuedAt === SESSION_DURATION_MS / 1000
    );
  } catch {
    return false;
  }
}
