export function calculateSettlement({ cashRevenue, amountToSubmit, employees }) {
  const cashRevenueAmount = parsePositiveNumber(cashRevenue);
  const amountToSubmitValue = parsePositiveNumber(amountToSubmit);

  const employeeResults = employees.map((employee) => {
    const hours = calculateShiftHours(employee.startTime, employee.endTime);
    const hourlyWage = employee.paidInCash
      ? parsePositiveNumber(employee.hourlyWage)
      : 0;
    const cashWage = hours * hourlyWage;
    const wagePaidOut = Boolean(employee.paidInCash && employee.wagePaidOut);

    return {
      id: employee.id,
      name: employee.name.trim() || "Ohne Namen",
      paidInCash: employee.paidInCash,
      wagePaidOut,
      hours,
      hourlyWage,
      cashWage,
      tip: 0,
      totalCashPayout: cashWage,
      remainingCashPayout: wagePaidOut ? 0 : cashWage,
    };
  });

  const cashWagesTotal = employeeResults.reduce(
    (sum, employee) => sum + employee.cashWage,
    0,
  );
  const paidOutCashWagesTotal = employeeResults.reduce(
    (sum, employee) => sum + (employee.wagePaidOut ? employee.cashWage : 0),
    0,
  );
  const openCashWagesTotal = cashWagesTotal - paidOutCashWagesTotal;
  const adjustedAmountToSubmit = amountToSubmitValue - paidOutCashWagesTotal;
  const totalHours = employeeResults.reduce(
    (sum, employee) => sum + employee.hours,
    0,
  );
  const totalTips = cashRevenueAmount - adjustedAmountToSubmit;
  const amountToHandOver = adjustedAmountToSubmit - openCashWagesTotal;
  const canCalculateTips = totalHours > 0 && totalTips >= 0;
  const tipsPerHour = canCalculateTips ? totalTips / totalHours : 0;

  const resultsWithTips = employeeResults.map((employee) => {
    const tip = canCalculateTips ? employee.hours * tipsPerHour : 0;

    return {
      ...employee,
      tip,
      totalCashPayout: employee.cashWage + tip,
      remainingCashPayout:
        (employee.wagePaidOut ? 0 : employee.cashWage) + tip,
    };
  });

  return {
    cashRevenue: cashRevenueAmount,
    adjustedAmountToSubmit,
    amountToSubmit: amountToSubmitValue,
    amountToHandOver,
    cashWagesTotal,
    paidOutCashWagesTotal,
    openCashWagesTotal,
    totalTips,
    totalHours,
    tipsPerHour,
    employeeResults: resultsWithTips,
    warnings: createWarnings({
      cashRevenue: cashRevenueAmount,
      adjustedAmountToSubmit,
      amountToHandOver,
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
  adjustedAmountToSubmit,
  amountToHandOver,
  employees,
  totalHours,
}) {
  const warnings = [];

  if (adjustedAmountToSubmit > cashRevenue) {
    warnings.push(
      "Gesamt Abzugeben abzüglich bereits ausgezahltem Lohn ist größer als Bargeld gesamt.",
    );
  }

  if (amountToHandOver < 0) {
    warnings.push(
      "Die bereits ausgezahlten und offenen Barlöhne sind höher als Gesamt Abzugeben. Abzugeben nach Lohn ist deshalb negativ.",
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
