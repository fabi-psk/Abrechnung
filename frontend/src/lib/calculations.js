export function calculateSettlement({ cashRevenue, amountToSubmit, employees }) {
  const cashRevenueAmount = parsePositiveNumber(cashRevenue);
  const amountToSubmitValue = parsePositiveNumber(amountToSubmit);

  const employeeResults = employees.map((employee) => {
    const hours = calculateShiftHours(employee.startTime, employee.endTime);
    const hourlyWage = employee.paidInCash
      ? parsePositiveNumber(employee.hourlyWage)
      : 0;
    const cashWage = hours * hourlyWage;

    return {
      id: employee.id,
      name: employee.name.trim() || "Ohne Namen",
      paidInCash: employee.paidInCash,
      hours,
      hourlyWage,
      cashWage,
      tip: 0,
      totalCashPayout: cashWage,
    };
  });

  const cashWagesTotal = employeeResults.reduce(
    (sum, employee) => sum + employee.cashWage,
    0,
  );
  const totalHours = employeeResults.reduce(
    (sum, employee) => sum + employee.hours,
    0,
  );
  const totalTips = cashRevenueAmount - amountToSubmitValue;
  const amountToHandOver = amountToSubmitValue - cashWagesTotal;
  const canCalculateTips = totalHours > 0 && totalTips >= 0;
  const tipsPerHour = canCalculateTips ? totalTips / totalHours : 0;

  const resultsWithTips = employeeResults.map((employee) => {
    const tip = canCalculateTips ? employee.hours * tipsPerHour : 0;

    return {
      ...employee,
      tip,
      totalCashPayout: employee.cashWage + tip,
    };
  });

  return {
    cashRevenue: cashRevenueAmount,
    amountToSubmit: amountToSubmitValue,
    amountToHandOver,
    cashWagesTotal,
    totalTips,
    totalHours,
    tipsPerHour,
    employeeResults: resultsWithTips,
    warnings: createWarnings({
      cashRevenue: cashRevenueAmount,
      amountToSubmit: amountToSubmitValue,
      amountToHandOver,
      cashWagesTotal,
      employees,
      totalHours,
    }),
  };
}

export function calculateShiftHours(startTime, endTime) {
  if (!startTime || !endTime) {
    return 0;
  }

  const startMinutes = parseTimeToMinutes(startTime);
  const endMinutes = parseTimeToMinutes(endTime);

  if (startMinutes === null || endMinutes === null) {
    return 0;
  }

  const minutesInDay = 24 * 60;
  const durationMinutes =
    endMinutes >= startMinutes
      ? endMinutes - startMinutes
      : minutesInDay - startMinutes + endMinutes;

  return durationMinutes / 60;
}

function parseTimeToMinutes(timeValue) {
  const [hours, minutes] = timeValue.split(":").map(Number);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return hours * 60 + minutes;
}

function parsePositiveNumber(value) {
  const number = Number(String(value).replace(",", "."));

  if (!Number.isFinite(number) || number < 0) {
    return 0;
  }

  return number;
}

function createWarnings({
  cashRevenue,
  amountToSubmit,
  amountToHandOver,
  employees,
  totalHours,
}) {
  const warnings = [];

  if (amountToSubmit > cashRevenue) {
    warnings.push(
      "Der Brutto-abzugeben-Betrag ist groesser als der eingetragene Umsatz.",
    );
  }

  if (amountToHandOver < 0) {
    warnings.push(
      "Die Barlöhne sind höher als der Brutto-abzugeben-Betrag. Es kann kein Netto-abzugeben-Betrag berechnet werden.",
    );
  }

  if (totalHours === 0) {
    warnings.push("Trinkgeld wird erst berechnet, wenn Arbeitsstunden vorhanden sind.");
  }

  const hasMissingTimes = employees.some(
    (employee) => !employee.startTime || !employee.endTime,
  );

  if (hasMissingTimes) {
    warnings.push("Bei mindestens einem Mitarbeiter fehlen Arbeitszeiten.");
  }

  return warnings;
}
