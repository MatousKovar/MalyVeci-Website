import { randomBytes } from "node:crypto";
import { stdin, stdout } from "node:process";
import { hashPassword } from "../src/lib/admin/session-crypto.mjs";

let pendingInput = "";
let skipNextLineFeed = false;

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

try {
  const password = await readHiddenPassword("Admin password (12+ characters): ");
  const confirmation = await readHiddenPassword("Repeat admin password: ");
  if (password !== confirmation) {
    throw new Error("The passwords did not match.");
  }

  const passwordHash = await hashPassword(password);
  const sessionSecret = randomBytes(32).toString("base64url");
  stdout.write("Add these values to .env.local and Vercel:\n");
  stdout.write(`ADMIN_PASSWORD_HASH=${passwordHash}\n`);
  stdout.write(`ADMIN_SESSION_SECRET=${sessionSecret}\n`);
} catch (error) {
  stdout.write(`${error instanceof Error ? error.message : "Could not generate admin secrets."}\n`);
  process.exitCode = 1;
}
