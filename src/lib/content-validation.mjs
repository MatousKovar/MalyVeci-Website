function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isCalendarDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

function isLocalAssetPath(value) {
  return (
    typeof value === "string" &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.includes("\\") &&
    !/[?#]/.test(value) &&
    value.split("/").every((part) => part !== "..")
  );
}

function eventError(value, index) {
  const label = isRecord(value) && isNonEmptyString(value.id)
    ? `Akce "${value.id}"`
    : `Akce č. ${index + 1}`;

  if (!isRecord(value)) return `${label}: položka musí být objekt.`;
  if (!isNonEmptyString(value.id)) return `${label}: chybí platné ID.`;
  if (!isNonEmptyString(value.title)) return `${label}: chybí název.`;
  if (!isCalendarDate(value.date)) {
    return `${label}: datum musí být platné datum ve formátu YYYY-MM-DD.`;
  }
  if (!isNonEmptyString(value.location)) return `${label}: chybí místo.`;
  if (Object.hasOwn(value, "description") && typeof value.description !== "string") {
    return `${label}: popis musí být text.`;
  }
  if (Object.hasOwn(value, "posterPath") && !isLocalAssetPath(value.posterPath)) {
    return `${label}: cesta k plakátu musí být lokální cesta začínající lomítkem.`;
  }
  return undefined;
}

/** @param {unknown} input */
export function validateEvents(input) {
  /** @type {import("./content-types").EventContent[]} */
  const items = [];
  const errors = [];
  const ids = new Set();
  const dates = new Set();

  if (!Array.isArray(input)) {
    return { items, errors: ["Soubor akcí musí obsahovat JSON pole."] };
  }

  input.forEach((value, index) => {
    const error = eventError(value, index);
    if (error) {
      errors.push(error);
      return;
    }

    if (ids.has(value.id)) {
      errors.push(`Akce "${value.id}": ID už používá jiná akce.`);
      return;
    }

    if (dates.has(value.date)) {
      errors.push(`Akce "${value.id}": ve stejný den už je naplánovaná jiná akce.`);
      return;
    }

    ids.add(value.id);
    dates.add(value.date);
    items.push({
      id: value.id,
      title: value.title,
      date: value.date,
      location: value.location,
      ...(Object.hasOwn(value, "description") ? { description: value.description } : {}),
      ...(Object.hasOwn(value, "posterPath") ? { posterPath: value.posterPath } : {}),
    });
  });

  return { items, errors };
}

function shortError(value, index) {
  const label = isRecord(value) && isNonEmptyString(value.id)
    ? `Krátké video "${value.id}"`
    : `Krátké video č. ${index + 1}`;

  if (!isRecord(value)) return `${label}: položka musí být objekt.`;
  if (!isNonEmptyString(value.id)) return `${label}: chybí platné ID.`;
  if (typeof value.videoId !== "string" || !/^[A-Za-z0-9_-]{11}$/.test(value.videoId)) {
    return `${label}: videoId musí být kanonické 11znakové ID YouTube.`;
  }
  if (!Number.isInteger(value.order) || value.order < 0) {
    return `${label}: pořadí musí být celé číslo od nuly.`;
  }
  return undefined;
}

/** @param {unknown} input */
export function validateShorts(input) {
  /** @type {import("./content-types").ShortContent[]} */
  const items = [];
  const errors = [];
  const ids = new Set();
  const videoIds = new Set();
  const orders = new Set();

  if (!Array.isArray(input)) {
    return { items, errors: ["Soubor krátkých videí musí obsahovat JSON pole."] };
  }

  input.forEach((value, index) => {
    const error = shortError(value, index);
    if (error) {
      errors.push(error);
      return;
    }

    if (ids.has(value.id)) {
      errors.push(`Krátké video "${value.id}": ID už používá jiná položka.`);
      return;
    }
    if (videoIds.has(value.videoId)) {
      errors.push(`Krátké video "${value.id}": toto YouTube video už je v seznamu.`);
      return;
    }
    if (orders.has(value.order)) {
      errors.push(`Krátké video "${value.id}": pořadí ${value.order} už používá jiná položka.`);
      return;
    }

    ids.add(value.id);
    videoIds.add(value.videoId);
    orders.add(value.order);
    items.push({ id: value.id, videoId: value.videoId, order: value.order });
  });

  return { items, errors };
}

function galleryPhotoError(value, index) {
  const label = isRecord(value) && isNonEmptyString(value.id)
    ? `Fotka galerie "${value.id}"`
    : `Fotka galerie č. ${index + 1}`;

  if (!isRecord(value)) return `${label}: položka musí být objekt.`;
  if (!isNonEmptyString(value.id)) return `${label}: chybí platné ID.`;
  if (
    !isLocalAssetPath(value.src) ||
    !value.src.startsWith("/gallery/") ||
    value.src.slice("/gallery/".length).includes("/")
  ) {
    return `${label}: cesta musí ukazovat do složky /gallery/.`;
  }
  if (value.src.slice("/gallery/".length) !== value.id) {
    return `${label}: ID musí odpovídat názvu souboru.`;
  }
  if (!Number.isInteger(value.order) || value.order < 0) {
    return `${label}: pořadí musí být celé číslo od nuly.`;
  }
  if (
    !Number.isInteger(value.width) ||
    value.width <= 0 ||
    !Number.isInteger(value.height) ||
    value.height <= 0
  ) {
    return `${label}: rozměry musí být kladná celá čísla.`;
  }
  return undefined;
}

/** @param {unknown} input */
export function validateGalleryPhotos(input) {
  /** @type {import("./content-types").GalleryPhotoContent[]} */
  const items = [];
  const errors = [];
  const ids = new Set();
  const orders = new Set();

  if (!Array.isArray(input)) {
    return { items, errors: ["Soubor fotek galerie musí obsahovat JSON pole."] };
  }

  input.forEach((value, index) => {
    const error = galleryPhotoError(value, index);
    if (error) {
      errors.push(error);
      return;
    }

    if (ids.has(value.id)) {
      errors.push(`Fotka galerie "${value.id}": ID už používá jiná fotka.`);
      return;
    }
    if (orders.has(value.order)) {
      errors.push(`Fotka galerie "${value.id}": pořadí ${value.order} už používá jiná fotka.`);
      return;
    }

    ids.add(value.id);
    orders.add(value.order);
    items.push({
      id: value.id,
      src: value.src,
      order: value.order,
      width: value.width,
      height: value.height,
    });
  });

  return { items, errors };
}
