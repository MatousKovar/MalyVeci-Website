import assert from "node:assert/strict";
import test from "node:test";
import {
  createManagedEvent,
  deleteManagedEvent,
} from "../src/lib/admin/event-update.mjs";

function makeFormData(values) {
  const formData = new FormData();
  for (const [name, value] of Object.entries(values)) {
    formData.set(name, value);
  }
  return formData;
}

test("authorized administrator can create a new event", async () => {
  const calls = { findByDate: [], create: [] };
  const result = await createManagedEvent(
    makeFormData({
      title: "  Letní koncert  ",
      date: "2026-07-18",
      location: "  Brno  ",
      description: "  Vstup zdarma  ",
    }),
    {
      isAuthorized: async () => true,
      getTodayInPrague: () => "2026-01-01",
      findOtherEventOnDate: async (date, excludedId) => {
        calls.findByDate.push([date, excludedId]);
        return undefined;
      },
      createEvent: async (fields) => {
        calls.create.push(fields);
        return "created-event";
      },
    },
  );

  assert.deepEqual(result, {
    status: "success",
    event: {
      id: "created-event",
      title: "Letní koncert",
      date: "2026-07-18",
      location: "Brno",
      description: "Vstup zdarma",
    },
  });
  assert.deepEqual(calls.findByDate, [["2026-07-18", ""]]);
  assert.deepEqual(calls.create, [
    {
      title: "Letní koncert",
      date: "2026-07-18",
      location: "Brno",
      description: "Vstup zdarma",
    },
  ]);
});

test("invalid and duplicate new events are rejected before a write", async () => {
  const calls = { findByDate: [], create: [] };
  const dependencies = {
    isAuthorized: async () => true,
    getTodayInPrague: () => "2026-01-01",
    findOtherEventOnDate: async (date, excludedId) => {
      calls.findByDate.push([date, excludedId]);
      return { id: "existing-event" };
    },
    createEvent: async (fields) => calls.create.push(fields),
  };
  const invalid = await createManagedEvent(
    makeFormData({ title: "Koncert", date: "2026-02-30", location: "Brno" }),
    dependencies,
  );
  const duplicate = await createManagedEvent(
    makeFormData({ title: "Koncert", date: "2026-07-18", location: "Brno" }),
    dependencies,
  );

  assert.equal(invalid.status, "error");
  assert.equal(duplicate.status, "error");
  assert.deepEqual(calls.findByDate, [["2026-07-18", ""]]);
  assert.deepEqual(calls.create, []);
});

test("anonymous requests cannot create events or read Sanity", async () => {
  const result = await createManagedEvent(
    makeFormData({ title: "Koncert", date: "2026-07-18", location: "Brno" }),
    {
      isAuthorized: async () => false,
      findOtherEventOnDate: async () => {
        assert.fail("anonymous requests must not read Sanity");
      },
      createEvent: async () => {
        assert.fail("anonymous requests must not write to Sanity");
      },
    },
  );

  assert.deepEqual(result, {
    status: "error",
    message: "Přihlášení správce vypršelo. Přihlaste se znovu.",
  });
});

test("authorized administrator can delete an existing event", async () => {
  const calls = { findById: [], delete: [] };
  const result = await deleteManagedEvent(makeFormData({ id: "event-123" }), {
    isAuthorized: async () => true,
    findEventById: async (id) => {
      calls.findById.push(id);
      return { id, date: "2026-07-18" };
    },
    deleteEvent: async (id) => calls.delete.push(id),
  });

  assert.deepEqual(result, { status: "success", id: "event-123" });
  assert.deepEqual(calls.findById, ["event-123"]);
  assert.deepEqual(calls.delete, ["event-123"]);
});

test("anonymous administrator deletion is rejected before reading or deleting", async () => {
  const result = await deleteManagedEvent(makeFormData({ id: "event-123" }), {
    isAuthorized: async () => false,
    findEventById: async () => {
      assert.fail("anonymous requests must not read Sanity");
    },
    deleteEvent: async () => {
      assert.fail("anonymous requests must not delete from Sanity");
    },
  });

  assert.deepEqual(result, {
    status: "error",
    message: "Přihlášení správce vypršelo. Přihlaste se znovu.",
  });
});

test("a missing event cannot be deleted", async () => {
  let deleteCount = 0;
  const result = await deleteManagedEvent(makeFormData({ id: "deleted-event" }), {
    isAuthorized: async () => true,
    findEventById: async () => undefined,
    deleteEvent: async () => {
      deleteCount += 1;
    },
  });

  assert.deepEqual(result, {
    status: "error",
    message: "Vybraná akce už neexistuje. Obnovte stránku a vyberte ji znovu.",
  });
  assert.equal(deleteCount, 0);
});
