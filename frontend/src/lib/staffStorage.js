const STORAGE_KEY = "bar-abrechnung.staff";
const DEFAULT_STAFF_SEED_KEY = "bar-abrechnung.staff-defaults-seeded";

const DEFAULT_STAFF_MEMBERS = [
  { id: "default-fabi", name: "Fabi", hourlyRate: 15, paidCash: true },
  { id: "default-mathi", name: "Mathi", hourlyRate: 0, paidCash: false },
  { id: "default-franz", name: "Franz", hourlyRate: 0, paidCash: false },
  { id: "default-anousa", name: "Anousa", hourlyRate: 15, paidCash: true },
  { id: "default-philina", name: "Philina", hourlyRate: 0, paidCash: false },
  { id: "default-micha", name: "Micha", hourlyRate: 0, paidCash: false },
  { id: "default-tim", name: "Tim", hourlyRate: 0, paidCash: false },
  { id: "default-sophie", name: "Sophie", hourlyRate: 0, paidCash: false },
  { id: "default-helen", name: "Helen", hourlyRate: 0, paidCash: false },
  { id: "default-antonia", name: "Antonia", hourlyRate: 0, paidCash: false },
  { id: "default-calvin", name: "Calvin", hourlyRate: 0, paidCash: false },
  { id: "default-luise", name: "Luise", hourlyRate: 0, paidCash: false },
];

export function loadStaffMembers() {
  try {
    const storedValue = window.localStorage.getItem(STORAGE_KEY);

    if (!storedValue) {
      return sortStaffMembers(seedDefaultStaffMembers([]));
    }

    const parsedValue = JSON.parse(storedValue);

    if (!Array.isArray(parsedValue)) {
      return sortStaffMembers(seedDefaultStaffMembers([]));
    }

    const storedStaffMembers = parsedValue
      .map(normalizeStaffMember)
      .filter((staffMember) => staffMember !== null);

    return sortStaffMembers(seedDefaultStaffMembers(storedStaffMembers));
  } catch (error) {
    console.error("Mitarbeiter konnten nicht geladen werden.", error);
    return sortStaffMembers(seedDefaultStaffMembers([]));
  }
}

export function saveStaffMembers(staffMembers) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sortStaffMembers(staffMembers)));
}

export function createStaffMember({ name, hourlyRate, paidCash }) {
  return {
    id: createId(),
    name: name.trim(),
    hourlyRate,
    paidCash,
  };
}

export function sortStaffMembers(staffMembers) {
  return [...staffMembers].sort((firstStaffMember, secondStaffMember) =>
    firstStaffMember.name.localeCompare(secondStaffMember.name, "de", {
      sensitivity: "base",
    }),
  );
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

function seedDefaultStaffMembers(staffMembers) {
  const defaultsAlreadySeeded =
    window.localStorage.getItem(DEFAULT_STAFF_SEED_KEY) === "true";

  if (defaultsAlreadySeeded) {
    return staffMembers;
  }

  window.localStorage.setItem(DEFAULT_STAFF_SEED_KEY, "true");

  const existingNames = new Set(
    staffMembers.map((staffMember) => staffMember.name.toLowerCase()),
  );
  const missingDefaults = DEFAULT_STAFF_MEMBERS.filter(
    (staffMember) => !existingNames.has(staffMember.name.toLowerCase()),
  );

  return [...staffMembers, ...missingDefaults];
}

function createId() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `staff-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
