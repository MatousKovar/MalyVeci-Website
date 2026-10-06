const requiredFieldsError = {
  status: "error",
  message: "Vyplňte název, platné datum a místo akce.",
};

function readText(formData, name) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function isCalendarDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const parsed = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value
  );
}

export async function updateManagedEvent(formData, dependencies) {
  if (!(await dependencies.isAuthorized())) {
    return {
      status: "error",
      message: "Přihlášení správce vypršelo. Přihlaste se znovu.",
    };
  }

  const id = readText(formData, "id");
  const title = readText(formData, "title");
  const date = readText(formData, "date");
  const location = readText(formData, "location");
  const description = readText(formData, "description");

  if (!id || !title || !isCalendarDate(date) || !location) {
    return requiredFieldsError;
  }

  const currentEvent = await dependencies.findEventById(id);
  if (!currentEvent) {
    return {
      status: "error",
      message: "Vybraná akce už neexistuje. Obnovte stránku a vyberte ji znovu.",
    };
  }

  if (date !== currentEvent.date) {
    const conflictingEvent = await dependencies.findOtherEventOnDate(date, id);
    if (conflictingEvent) {
      return {
        status: "error",
        message: "Na vybraný den už je naplánovaná jiná akce.",
      };
    }
  }

  await dependencies.updateEvent(id, {
    title,
    date,
    location,
    description: description || null,
  });

  return {
    status: "success",
    event: {
      id,
      title,
      date,
      location,
      ...(description ? { description } : {}),
    },
  };
}
