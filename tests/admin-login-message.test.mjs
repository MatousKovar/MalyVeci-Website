import assert from "node:assert/strict";
import test from "node:test";
import { getAdminErrorMessage } from "../src/lib/admin/login-message.mjs";

test("a stale configuration error is hidden when admin settings are valid", () => {
  assert.equal(getAdminErrorMessage("config", true), undefined);
});

test("a configuration error is shown while admin settings are invalid", () => {
  assert.equal(
    getAdminErrorMessage("config", false),
    "Přihlášení správce není nakonfigurované.",
  );
});

test("a failed password is reported only when admin settings are valid", () => {
  assert.equal(getAdminErrorMessage("invalid", true), "Heslo není správné.");
  assert.equal(
    getAdminErrorMessage("invalid", false),
    "Přihlášení správce není nakonfigurované.",
  );
});

test("unknown query errors do not show a stale message", () => {
  assert.equal(getAdminErrorMessage("other", true), undefined);
});
