import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createRequire, registerHooks } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import test, { after } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import { getTodayInPrague } from "../src/lib/admin/event-update.mjs";

const require = createRequire(import.meta.url);
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "server-only") {
      return { url: "calendar-test:server-only", shortCircuit: true };
    }
    if (["next/navigation", "next/cache", "next/headers"].includes(specifier)) {
      return nextResolve(pathToFileURL(require.resolve(specifier)).href, context);
    }
    if (specifier.startsWith("@/")) {
      specifier = new URL(`../src/${specifier.slice(2)}`, import.meta.url).href;
    }
    if (specifier.startsWith("file:") || specifier.startsWith(".")) {
      const url = new URL(specifier, context.parentURL);
      for (const extension of [".ts", ".tsx"]) {
        if (existsSync(fileURLToPath(`${url.href}${extension}`))) {
          return { url: `${url.href}${extension}`, shortCircuit: true };
        }
      }
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url === "calendar-test:server-only") {
      return { format: "module", source: "export {};", shortCircuit: true };
    }
    if (/\.tsx?$/.test(url)) {
      const source = ts.transpileModule(readFileSync(fileURLToPath(url), "utf8"), {
        compilerOptions: {
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ES2022,
          jsx: ts.JsxEmit.ReactJSX,
        },
        fileName: fileURLToPath(url),
      }).outputText;
      return { format: "module", source, shortCircuit: true };
    }
    return nextLoad(url, context);
  },
});
after(() => hooks.deregister());

const { default: EventSection } = await import("../components/sections/EventSection.tsx");

function render(today, dates) {
  return renderToStaticMarkup(createElement(EventSection, {
    today,
    events: dates.map((date) => ({ id: date, title: `Akce ${date}`, date, location: "Praha" })),
    errors: [],
    isAdmin: false,
    showPosterFunction() {},
  }));
}

function day(html, date) {
  const cell = html.match(new RegExp(`<td[^>]*data-day="${date}"[^>]*>[\\s\\S]*?</td>`));
  assert.ok(cell, `Calendar contains ${date}`);
  return cell[0];
}

test("only today's and upcoming akce appear, while yesterday is disabled", () => {
  const html = render("2026-10-14", ["2026-10-13", "2026-10-14", "2026-10-15"]);
  assert.doesNotMatch(html, /data-event-date="2026-10-13"/);
  assert.match(html, /data-event-date="2026-10-14"/);
  assert.match(html, /data-event-date="2026-10-15"/);
  assert.match(day(html, "2026-10-13"), /<button[^>]* disabled=""/);
  assert.match(day(html, "2026-10-13"), /text-stone-500/);
  assert.doesNotMatch(day(html, "2026-10-14"), /<button[^>]* disabled=""/);
  assert.doesNotMatch(day(html, "2026-10-15"), /<button[^>]* disabled=""/);
});

test("navigation and dropdowns cannot reach a month before the current month", () => {
  const html = render("2026-10-14", []);
  const previous = html.match(/<button[^>]*aria-label="Go to the Previous Month"[^>]*>/)?.[0];
  assert.ok(previous);
  assert.match(previous, /aria-disabled="true"/);
  const months = html.match(/<select[^>]*aria-label="Choose the Month"[^>]*>([\s\S]*?)<\/select>/)?.[1];
  assert.ok(months);
  const availableMonths = [...months.matchAll(/<option[^>]*value="(\d+)"[^>]*>/g)]
    .filter((match) => !match[0].includes('disabled=""'))
    .map((match) => match[1]);
  assert.deepEqual(availableMonths, ["9", "10", "11"]);
  const years = html.match(/<select[^>]*aria-label="Choose the Year"[^>]*>([\s\S]*?)<\/select>/)?.[1];
  assert.ok(years);
  assert.doesNotMatch(years, /value="2025"/);
});

for (const [instant, expectedToday, yesterday, tomorrow] of [
  ["2026-10-31T23:30:00Z", "2026-11-01", "2026-10-31", "2026-11-02"],
  ["2026-12-31T23:30:00Z", "2027-01-01", "2026-12-31", "2027-01-02"],
  ["2026-03-28T23:30:00Z", "2026-03-29", "2026-03-28", "2026-03-30"],
  ["2026-10-24T22:30:00Z", "2026-10-25", "2026-10-24", "2026-10-26"],
]) {
  test(`calendar follows Prague on ${expectedToday} regardless of the visitor's time zone`, () => {
    const previousTimeZone = process.env.TZ;
    try {
      for (const timeZone of ["UTC", "America/Los_Angeles", "Asia/Tokyo"]) {
        process.env.TZ = timeZone;
        const today = getTodayInPrague(new Date(instant));
        assert.equal(today, expectedToday);
        const html = render(today, [yesterday, today, tomorrow]);
        assert.doesNotMatch(html, new RegExp(`data-event-date="${yesterday}"`));
        assert.match(html, new RegExp(`data-event-date="${expectedToday}"`));
        assert.match(html, new RegExp(`data-event-date="${tomorrow}"`));
        assert.doesNotMatch(day(html, expectedToday), /<button[^>]* disabled=""/);
        const previous = html.match(/<button[^>]*aria-label="Go to the Previous Month"[^>]*>/)?.[0];
        assert.ok(previous);
        assert.match(previous, /aria-disabled="true"/);
      }
    } finally {
      if (previousTimeZone === undefined) delete process.env.TZ;
      else process.env.TZ = previousTimeZone;
    }
  });
}

test("a list containing only past akce shows the empty state", () => {
  const html = render("2026-10-14", ["2026-10-13"]);
  assert.match(html, /Zatím tu nejsou žádné naplánované akce\./);
  assert.doesNotMatch(html, /data-event-date=/);
});
