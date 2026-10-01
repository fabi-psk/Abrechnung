export function getSettlementDate({ employees, now = new Date() }) {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const overnightStartMinutes = employees
    .map((employee) => ({
      start: parseTimeToMinutes(employee.startTime),
      end: parseTimeToMinutes(employee.endTime),
    }))
    .filter(
      ({ start, end }) => start !== null && end !== null && end < start,
    )
    .map(({ start }) => start);

  if (
    overnightStartMinutes.length > 0 &&
    currentMinutes < Math.max(...overnightStartMinutes)
  ) {
    const settlementDate = new Date(now);
    settlementDate.setDate(settlementDate.getDate() - 1);
    return settlementDate;
  }

  return new Date(now);
}

export function formatSettlementDisplayDate(date) {
  return date.toLocaleDateString("de-DE");
}

export function formatSettlementFileDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseTimeToMinutes(timeValue) {
  if (typeof timeValue !== "string") {
    return null;
  }

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
