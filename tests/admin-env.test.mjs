import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { hashPassword } from "../src/lib/admin/session-crypto.mjs";

test("password hashes stay valid after Next loads .env.local", async () => {
  const passwordHash = await hashPassword("test-password");
  const directory = await mkdtemp(join(tmpdir(), "admin-env-test-"));

  try {
    await writeFile(
      join(directory, ".env.local"),
      `ADMIN_PASSWORD_HASH='${passwordHash}'\n`,
    );

    const childEnv = { ...process.env };
    delete childEnv.ADMIN_PASSWORD_HASH;
    delete childEnv.ADMIN_SESSION_SECRET;

    const childScript = `
      import { createRequire } from "node:module";
      import { isPasswordHashValid } from ${JSON.stringify(
        new URL("../src/lib/admin/session-crypto.mjs", import.meta.url).href,
      )};
      const { loadEnvConfig } = createRequire(import.meta.url)("@next/env");
      loadEnvConfig(process.argv[1], false, { info() {}, error() {} }, true);
      console.log(JSON.stringify({ valid: isPasswordHashValid(process.env.ADMIN_PASSWORD_HASH) }));
    `;
    const result = spawnSync(
      process.execPath,
      ["--input-type=module", "-e", childScript, directory],
      { cwd: process.cwd(), env: childEnv, encoding: "utf8" },
    );

    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(JSON.parse(result.stdout), { valid: true });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
