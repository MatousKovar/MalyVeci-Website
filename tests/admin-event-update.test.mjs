import assert from "node:assert/strict";
import test from "node:test";
import {
  getTodayInPrague,
  updateManagedEvent,
} from "../src/lib/admin/event-update.mjs";

function makeFormData(values) {
  const formData = new FormData();
  for (const [name, value] of Object.entries(values)) {
    formData.set(name, value);
  }
  return formData;
}

function makeDependencies(overrides = {}) {
  const calls = { findById: [], findByDate: [], update: [] };
  const dependencies = {
    isAuthorized: async () => true,
    getTodayInPrague: () => "2026-01-01",
    findEventById: async (id) => {
      calls.findById.push(id);
      return { id, date: "2026-07-11" };
    },
    findOtherEventOnDate: async (date, excludedId) => {
      calls.findByDate.push([date, excludedId]);
      return undefined;
    },
    updateEvent: async (id, fields) => {
      calls.update.push([id, fields]);
    },
    ...overrides,
  };

  return { calls, dependencies };
}

test("authorized administrator can update event details without replacing its poster", async () => {
  const { calls, dependencies } = makeDependencies();
  const result = await updateManagedEvent(
    makeFormData({
      id: "event-123",
      title: "  Letní koncert  ",
      date: "2026-07-18",
      location: "  Brno  ",
      description: "  Vstup zdarma  ",
    }),
    dependencies,
  );

  assert.deepEqual(result, {
    status: "success",
    event: {
      id: "event-123",
      title: "Letní koncert",
      date: "2026-07-18",
      location: "Brno",
      description: "Vstup zdarma",
    },
  });
  assert.deepEqual(calls.findById, ["event-123"]);
  assert.deepEqual(calls.findByDate, [["2026-07-18", "event-123"]]);
  assert.deepEqual(calls.update, [
    [
      "event-123",
      {
        title: "Letní koncert",
        date: "2026-07-18",
        location: "Brno",
        description: "Vstup zdarma",
      },
    ],
  ]);
});

test("required fields and real calendar dates are validated before a write", async () => {
  const { calls, dependencies } = makeDependencies();

  const missingTitle = await updateManagedEvent(
    makeFormData({
      id: "event-123",
      title: "   ",
      date: "2026-07-18",
      location: "Brno",
      description: "",
    }),
    dependencies,
  );
  const impossibleDate = await updateManagedEvent(
    makeFormData({
      id: "event-123",
      title: "Letní koncert",
      date: "2026-02-30",
      location: "Brno",
      description: "",
    }),
    dependencies,
  );

  assert.deepEqual(missingTitle, {
    status: "error",
    message: "Zadejte název, dnešní nebo pozdější datum a místo akce.",
  });
  assert.deepEqual(impossibleDate, {
    status: "error",
    message: "Zadejte název, dnešní nebo pozdější datum a místo akce.",
  });
  assert.deepEqual(calls.findById, []);
  assert.deepEqual(calls.update, []);
});

test("date and location cannot be empty", async () => {
  const { calls, dependencies } = makeDependencies();
  const emptyDate = await updateManagedEvent(
    makeFormData({
      id: "event-123",
      title: "Letní koncert",
      date: "",
      location: "Brno",
      description: "",
    }),
    dependencies,
  );
  const emptyLocation = await updateManagedEvent(
    makeFormData({
      id: "event-123",
      title: "Letní koncert",
      date: "2026-07-18",
      location: "   ",
      description: "",
    }),
    dependencies,
  );

  assert.deepEqual(emptyDate, {
    status: "error",
    message: "Zadejte název, dnešní nebo pozdější datum a místo akce.",
  });
  assert.deepEqual(emptyLocation, {
    status: "error",
    message: "Zadejte název, dnešní nebo pozdější datum a místo akce.",
  });
  assert.deepEqual(calls.findById, []);
  assert.deepEqual(calls.update, []);
});

test("an event cannot move to a date occupied by another event", async () => {
  const { calls, dependencies } = makeDependencies({
    findOtherEventOnDate: async (date, excludedId) => {
      calls.findByDate.push([date, excludedId]);
      return { id: "event-456" };
    },
  });

  const result = await updateManagedEvent(
    makeFormData({
      id: "event-123",
      title: "Letní koncert",
      date: "2026-07-18",
      location: "Brno",
      description: "",
    }),
    dependencies,
  );

  assert.deepEqual(result, {
    status: "error",
    message: "Na vybraný den už je naplánovaná jiná akce.",
  });
  assert.deepEqual(calls.update, []);
});

test("dates before today in Prague are rejected before a Sanity read", async () => {
  const { calls, dependencies } = makeDependencies({
    getTodayInPrague: () => "2026-07-19",
  });

  const result = await updateManagedEvent(
    makeFormData({
      id: "event-123",
      title: "Letní koncert",
      date: "2026-07-18",
      location: "Brno",
      description: "",
    }),
    dependencies,
  );

  assert.deepEqual(result, {
    status: "error",
    message: "Zadejte název, dnešní nebo pozdější datum a místo akce.",
  });
  assert.deepEqual(calls.findById, []);
  assert.deepEqual(calls.update, []);
});

test("today in Prague follows the Europe/Prague calendar", () => {
  assert.equal(
    getTodayInPrague(new Date("2026-01-01T23:30:00.000Z")),
    "2026-01-02",
  );
});

test("an anonymous request is rejected before reading or changing Sanity", async () => {
  const { calls, dependencies } = makeDependencies({
    isAuthorized: async () => false,
  });

  const result = await updateManagedEvent(
    makeFormData({
      id: "event-123",
      title: "Letní koncert",
      date: "2026-07-18",
      location: "Brno",
      description: "",
    }),
    dependencies,
  );

  assert.deepEqual(result, {
    status: "error",
    message: "Přihlášení správce vypršelo. Přihlaste se znovu.",
  });
  assert.deepEqual(calls.findById, []);
  assert.deepEqual(calls.findByDate, []);
  assert.deepEqual(calls.update, []);
});

test("clearing the optional description removes its value", async () => {
  const { calls, dependencies } = makeDependencies();

  const result = await updateManagedEvent(
    makeFormData({
      id: "event-123",
      title: "Letní koncert",
      date: "2026-07-18",
      location: "Brno",
      description: "   ",
    }),
    dependencies,
  );

  assert.deepEqual(result, {
    status: "success",
    event: {
      id: "event-123",
      title: "Letní koncert",
      date: "2026-07-18",
      location: "Brno",
    },
  });
  assert.deepEqual(calls.update, [
    [
      "event-123",
      {
        title: "Letní koncert",
        date: "2026-07-18",
        location: "Brno",
        description: null,
      },
    ],
  ]);
});
