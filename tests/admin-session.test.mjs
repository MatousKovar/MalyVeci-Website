import assert from "node:assert/strict";
import test from "node:test";
import { randomBytes } from "node:crypto";
import {
  hashPassword,
  isPasswordHashValid,
  isSessionSecretValid,
  SESSION_DURATION_MS,
  signAdminSession,
  verifyAdminSession,
  verifyPassword,
} from "../src/lib/admin/session-crypto.mjs";

test("password hashes verify the original password and reject other inputs", async () => {
  const password = "x";
  const encodedHash = await hashPassword(password);

  assert.equal(isPasswordHashValid(encodedHash), true);
  assert.equal(encodedHash.includes("$"), false);
  assert.equal(await verifyPassword(password, encodedHash), true);
  assert.equal(await verifyPassword("y", encodedHash), false);
  assert.equal(await verifyPassword("another-password", encodedHash), false);
  assert.equal(await verifyPassword(password, "not-a-hash"), false);
  assert.equal(await verifyPassword("", encodedHash), false);
});

test("existing dollar-delimited password hashes remain valid", async () => {
  const password = "legacy-password";
  const encodedHash = await hashPassword(password);
  const legacyHash = encodedHash.replaceAll(":", "$");

  assert.equal(isPasswordHashValid(legacyHash), true);
  assert.equal(await verifyPassword(password, legacyHash), true);
});

test("password hashing accepts passwords longer than 1024 bytes", async () => {
  const password = "😀".repeat(513);
  const encodedHash = await hashPassword(password);

  assert.equal(await verifyPassword(password, encodedHash), true);
  await assert.rejects(hashPassword(""));
});

test("signed sessions are accepted until their 30-day expiry", () => {
  const secret = randomBytes(32).toString("base64url");
  const issuedAt = Date.UTC(2026, 0, 1);
  const token = signAdminSession(secret, issuedAt);

  assert.equal(isSessionSecretValid(secret), true);
  assert.equal(verifyAdminSession(secret, token, issuedAt), true);
  assert.equal(
    verifyAdminSession(secret, token, issuedAt + SESSION_DURATION_MS - 1000),
    true,
  );
  assert.equal(
    verifyAdminSession(secret, token, issuedAt + SESSION_DURATION_MS),
    false,
  );
});

test("signed sessions reject altered tokens and wrong secrets", () => {
  const secret = randomBytes(32).toString("base64url");
  const wrongSecret = randomBytes(32).toString("base64url");
  const token = signAdminSession(secret);
  const [payload, signature] = token.split(".");

  assert.equal(verifyAdminSession(wrongSecret, token), false);
  assert.equal(verifyAdminSession(secret, `${payload}.${"A".repeat(43)}`), false);
  assert.equal(verifyAdminSession(secret, "not-a-session"), false);
});
