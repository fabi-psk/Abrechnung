const DRAFT_STORAGE_KEY = "bar-abrechnung.current-draft";
const MIN_EMPLOYEES = 2;
const MAX_EMPLOYEES = 6;

export function loadSettlementDraft() {
  try {
    const storedValue = window.localStorage.getItem(DRAFT_STORAGE_KEY);

    if (!storedValue) {
      return null;
    }

    const parsedValue = JSON.parse(storedValue);

    if (!parsedValue || typeof parsedValue !== "object") {
      return null;
    }

    const employees = Array.isArray(parsedValue.employees)
      ? parsedValue.employees.map(normalizeDraftEmployee).filter(Boolean)
      : [];

    if (employees.length < MIN_EMPLOYEES || employees.length > MAX_EMPLOYEES) {
      return null;
    }

    return {
      cashRevenue: normalizeTextInput(parsedValue.cashRevenue),
      amountToSubmit: normalizeTextInput(parsedValue.amountToSubmit),
      employees,
      activePreset:
        parsedValue.activePreset === "weekday" ||
        parsedValue.activePreset === "weekend"
          ? parsedValue.activePreset
          : null,
    };
  } catch (error) {
    console.error("Abrechnungsentwurf konnte nicht geladen werden.", error);
    return null;
  }
}

export function saveSettlementDraft({
  cashRevenue,
  amountToSubmit,
  employees,
  activePreset,
}) {
  try {
    const draft = {
      cashRevenue,
      amountToSubmit,
      employees,
      activePreset,
    };

    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
  } catch (error) {
    console.error("Abrechnungsentwurf konnte nicht gespeichert werden.", error);
  }
}

function normalizeDraftEmployee(value) {
  if (!value || typeof value !== "object") {
    return null;
  }

  const id = normalizeTextInput(value.id);

  if (!id) {
    return null;
  }

  return {
    id,
    name: normalizeTextInput(value.name),
    staffMemberId: normalizeTextInput(value.staffMemberId),
    startTime: normalizeTimeInput(value.startTime),
    endTime: normalizeTimeInput(value.endTime),
    paidInCash: Boolean(value.paidInCash),
    wagePaidOut: Boolean(value.wagePaidOut),
    hourlyWage: normalizeTextInput(value.hourlyWage),
  };
}

function normalizeTextInput(value) {
  return typeof value === "string" ? value : "";
}

function normalizeTimeInput(value) {
  const textValue = normalizeTextInput(value);
  return /^\d{2}:\d{2}$/.test(textValue) ? textValue : "";
}
