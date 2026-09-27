const STORAGE_KEY = "bar-abrechnung.staff";

export function loadStaffMembers() {
  try {
    const storedValue = window.localStorage.getItem(STORAGE_KEY);

    if (!storedValue) {
      return [];
    }

    const parsedValue = JSON.parse(storedValue);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue
      .map(normalizeStaffMember)
      .filter((staffMember) => staffMember !== null);
  } catch (error) {
    console.error("Mitarbeiter konnten nicht geladen werden.", error);
    return [];
  }
}

export function saveStaffMembers(staffMembers) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(staffMembers));
}

export function createStaffMember({ name, hourlyRate, paidCash }) {
  return {
    id: createId(),
    name: name.trim(),
    hourlyRate,
    paidCash,
  };
}

function normalizeStaffMember(value) {
  if (!value || typeof value !== "object") {
    return null;
  }

  const name = String(value.name ?? "").trim();
  const hourlyRate = Number(value.hourlyRate);

  if (!value.id || !name || !Number.isFinite(hourlyRate) || hourlyRate < 0) {
    return null;
  }

  return {
    id: String(value.id),
    name,
    hourlyRate,
    paidCash: Boolean(value.paidCash),
  };
}

function createId() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `staff-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
