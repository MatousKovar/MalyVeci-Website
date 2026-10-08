import { chmod, readFile, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { stdin, stdout } from "node:process";
import { resolve } from "node:path";
import { hashPassword } from "../src/lib/admin/session-crypto.mjs";

let pendingInput = "";
let skipNextLineFeed = false;
const adminEnvNames = ["ADMIN_PASSWORD_HASH", "ADMIN_SESSION_SECRET"];

function readHiddenPassword(promptText) {
  if (!stdin.isTTY || typeof stdin.setRawMode !== "function") {
    throw new Error("Run npm run admin:secrets in an interactive terminal.");
  }

  return new Promise((resolve, reject) => {
    let password = "";
    stdout.write(promptText);
    stdin.setRawMode(true);
    stdin.resume();

    const finish = (error) => {
      stdin.setRawMode(false);
      stdin.pause();
      stdin.off("data", onData);
      stdout.write("\n");
      if (error) reject(error);
      else resolve(password);
    };

    const onData = (chunk) => {
      let input = pendingInput + chunk.toString("utf8");
      pendingInput = "";
      if (skipNextLineFeed && input.startsWith("\n")) input = input.slice(1);
      skipNextLineFeed = false;

      const lineEndIndex = input.search(/[\r\n]/);
      if (lineEndIndex !== -1) {
        const isCarriageReturn = input[lineEndIndex] === "\r";
        const hasPair = isCarriageReturn && input[lineEndIndex + 1] === "\n";
        const consumedLength = lineEndIndex + (hasPair ? 2 : 1);
        pendingInput = input.slice(consumedLength);
        skipNextLineFeed = isCarriageReturn && !hasPair;
        input = input.slice(0, lineEndIndex);
      }

      for (const character of input) {
        if (character === "\u0003" || character === "\u0004") {
          finish(new Error("Cancelled."));
          return;
        }
        if (character === "\u007f" || character === "\b") {
          password = Array.from(password).slice(0, -1).join("");
        } else {
          password += character;
        }
      }

      if (lineEndIndex !== -1) {
        finish();
      }
    };

    stdin.on("data", onData);
    if (pendingInput) {
      const bufferedInput = pendingInput;
      pendingInput = "";
      onData(Buffer.from(bufferedInput));
    }
  });
}

async function saveAdminSecrets(passwordHash, sessionSecret) {
  const envPath = resolve(process.cwd(), ".env.local");
  let contents = "";

  try {
    contents = await readFile(envPath, "utf8");
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }

  const lines = contents.split(/\r?\n/);
  if (lines.at(-1) === "") lines.pop();

  const values = new Map([
    ["ADMIN_PASSWORD_HASH", passwordHash],
    ["ADMIN_SESSION_SECRET", sessionSecret],
  ]);
  const written = new Set();
  const updatedLines = [];

  for (const line of lines) {
    const matchedName = adminEnvNames.find((name) =>
      new RegExp(`^\\s*(?:export\\s+)?${name}\\s*=`).test(line),
    );
    if (!matchedName) {
      updatedLines.push(line);
      continue;
    }
    if (!written.has(matchedName)) {
      updatedLines.push(`${matchedName}='${values.get(matchedName)}'`);
      written.add(matchedName);
    }
  }

  for (const name of adminEnvNames) {
    if (written.has(name)) continue;
    if (updatedLines.length > 0 && updatedLines.at(-1) !== "") {
      updatedLines.push("");
    }
    updatedLines.push(`${name}='${values.get(name)}'`);
  }

  await writeFile(envPath, `${updatedLines.join("\n")}\n`, { mode: 0o600 });
  await chmod(envPath, 0o600);
}

try {
  const password = await readHiddenPassword("Admin password: ");
  const confirmation = await readHiddenPassword("Repeat admin password: ");
  if (password !== confirmation) {
    throw new Error("The passwords did not match.");
  }

  const passwordHash = await hashPassword(password);
  const sessionSecret = randomBytes(32).toString("base64url");
  await saveAdminSecrets(passwordHash, sessionSecret);
  stdout.write("Admin credentials saved to .env.local. The password was not printed.\n");
  stdout.write("Restart the local dev server to load them.\n");
  stdout.write("For Vercel, copy ADMIN_PASSWORD_HASH and ADMIN_SESSION_SECRET from .env.local into the project environment variables, then redeploy.\n");
  stdout.write("To save events from the admin panel on Vercel, also set GITHUB_REPOSITORY and GITHUB_CONTENTS_TOKEN in Production.\n");
} catch (error) {
  stdout.write(`${error instanceof Error ? error.message : "Could not generate admin secrets."}\n`);
  process.exitCode = 1;
}
