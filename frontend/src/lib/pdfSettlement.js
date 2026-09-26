const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 42;
const BOTTOM_MARGIN = 42;
const LINE_HEIGHT = 15;

const euroFormatter = new Intl.NumberFormat("de-DE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat("de-DE", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function createSettlementPdf({ settlement, employees }) {
  const writer = createPdfWriter();
  const now = new Date();
  const titleDate = now.toLocaleDateString("de-DE");
  const fileDate = now.toISOString().slice(0, 10);
  let y = MARGIN;

  const page = () => writer.currentPage;
  const ensureSpace = (neededHeight = LINE_HEIGHT) => {
    if (y + neededHeight <= PAGE_HEIGHT - BOTTOM_MARGIN) {
      return;
    }

    writer.addPage();
    y = MARGIN;
  };

  const text = (value, x, size = 10, options = {}) => {
    writer.text(page(), value, x, y, size, options);
    y += options.lineHeight ?? LINE_HEIGHT;
  };

  text("Abrechnung", MARGIN, 22, { bold: true, lineHeight: 24 });
  text(`Erstellt am ${titleDate}`, MARGIN, 10, { color: "muted" });
  y += 10;

  drawSectionTitle(writer, page(), "Zusammenfassung", y);
  y += 20;

  const summaryRows = [
    ["Umsatz", formatCurrencyForPdf(settlement.cashRevenue)],
    ["Brutto abzugeben", formatCurrencyForPdf(settlement.amountToSubmit)],
    ["Bar ausgezahlte Loehne", formatCurrencyForPdf(settlement.cashWagesTotal)],
    ["Netto abzugeben", formatCurrencyForPdf(Math.max(settlement.amountToHandOver, 0))],
    ["Trinkgeld gesamt", formatCurrencyForPdf(settlement.totalTips)],
    ["Trinkgeld pro Stunde", formatCurrencyForPdf(settlement.tipsPerHour)],
    ["Gesamtstunden", formatHoursForPdf(settlement.totalHours)],
  ];

  y = drawKeyValueRows(writer, page(), summaryRows, y);
  y += 14;

  ensureSpace(90);
  drawSectionTitle(writer, page(), "Mitarbeiter", y);
  y += 20;

  y = drawTableHeader(writer, page(), y);

  settlement.employeeResults.forEach((result) => {
    ensureSpace(34);
    const sourceEmployee = employees.find((employee) => employee.id === result.id);
    y = drawEmployeeRow(writer, page(), {
      y,
      name: result.name,
      startTime: sourceEmployee?.startTime || "-",
      endTime: sourceEmployee?.endTime || "-",
      hours: formatHoursForPdf(result.hours),
      paidInCash: result.paidInCash ? "Ja" : "Nein",
      cashWage: formatCurrencyForPdf(result.cashWage),
      tip: formatCurrencyForPdf(result.tip),
      payout: formatCurrencyForPdf(result.totalCashPayout),
    });
  });

  if (settlement.warnings.length > 0) {
    y += 16;
    ensureSpace(60);
    drawSectionTitle(writer, page(), "Hinweise", y);
    y += 20;
    settlement.warnings.forEach((warning) => {
      ensureSpace(24);
      text(`- ${warning}`, MARGIN, 9, { color: "muted", lineHeight: 13 });
    });
  }

  const blob = writer.finish();
  const fileName = `abrechnung-${fileDate}.pdf`;

  return { blob, fileName };
}

export async function shareOrDownloadPdf(pdf) {
  const file = new File([pdf.blob], pdf.fileName, { type: "application/pdf" });

  if (
    navigator.share &&
    navigator.canShare &&
    navigator.canShare({ files: [file] })
  ) {
    await navigator.share({
      files: [file],
      title: "Abrechnung",
      text: "Abrechnung als PDF",
    });
    return "shared";
  }

  const url = URL.createObjectURL(pdf.blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = pdf.fileName;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  return "downloaded";
}

function createPdfWriter() {
  const pages = [[]];

  const api = {
    get currentPage() {
      return pages.length - 1;
    },
    addPage() {
      pages.push([]);
    },
    text(pageIndex, value, x, y, size, options = {}) {
      const font = options.bold ? "F2" : "F1";
      const color = options.color === "muted" ? "0.35 0.32 0.27" : "0.08 0.08 0.08";
      pages[pageIndex].push(
        `${color} rg BT /${font} ${size} Tf ${x.toFixed(2)} ${(PAGE_HEIGHT - y).toFixed(
          2,
        )} Td (${escapePdfText(value)}) Tj ET`,
      );
    },
    line(pageIndex, x1, y1, x2, y2, color = "0.82 0.75 0.63") {
      pages[pageIndex].push(
        `${color} RG 0.6 w ${x1.toFixed(2)} ${(PAGE_HEIGHT - y1).toFixed(
          2,
        )} m ${x2.toFixed(2)} ${(PAGE_HEIGHT - y2).toFixed(2)} l S`,
      );
    },
    rect(pageIndex, x, y, width, height, fill = "0.96 0.93 0.87") {
      pages[pageIndex].push(
        `${fill} rg ${x.toFixed(2)} ${(PAGE_HEIGHT - y - height).toFixed(
          2,
        )} ${width.toFixed(2)} ${height.toFixed(2)} re f`,
      );
    },
    finish() {
      return buildPdf(pages);
    },
  };

  return api;
}

function drawSectionTitle(writer, pageIndex, title, y) {
  writer.text(pageIndex, title, MARGIN, y, 13, { bold: true });
  writer.line(pageIndex, MARGIN, y + 7, PAGE_WIDTH - MARGIN, y + 7);
}

function drawKeyValueRows(writer, pageIndex, rows, y) {
  const columnWidth = (PAGE_WIDTH - MARGIN * 2) / 2;

  rows.forEach(([label, value], index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const x = MARGIN + column * columnWidth;
    const rowY = y + row * 38;

    writer.rect(pageIndex, x, rowY, columnWidth - 8, 30, "0.98 0.96 0.91");
    writer.text(pageIndex, label, x + 8, rowY + 11, 8, { color: "muted" });
    writer.text(pageIndex, value, x + 8, rowY + 25, 12, { bold: true });
  });

  return y + Math.ceil(rows.length / 2) * 38;
}

function drawTableHeader(writer, pageIndex, y) {
  writer.rect(pageIndex, MARGIN, y - 2, PAGE_WIDTH - MARGIN * 2, 22, "0.90 0.82 0.67");
  [
    ["Wer", MARGIN + 6],
    ["Von", 160],
    ["Bis", 205],
    ["Std.", 250],
    ["Barlohn", 300],
    ["TG", 365],
    ["Auszahlung", 430],
    ["Lohn bar?", 505],
  ].forEach(([label, x]) => {
    writer.text(pageIndex, label, x, y + 13, 8, { bold: true });
  });
  return y + 25;
}

function drawEmployeeRow(writer, pageIndex, row) {
  const rowHeight = 30;
  writer.line(pageIndex, MARGIN, row.y + rowHeight, PAGE_WIDTH - MARGIN, row.y + rowHeight);

  [
    [truncateText(row.name, 22), MARGIN + 6, 9, true],
    [row.startTime, 160, 9],
    [row.endTime, 205, 9],
    [row.hours, 250, 9],
    [row.cashWage, 300, 9],
    [row.tip, 365, 9],
    [row.payout, 430, 9, true],
    [row.paidInCash, 505, 9],
  ].forEach(([value, x, size, bold]) => {
    writer.text(pageIndex, value, x, row.y + 18, size, { bold });
  });

  return row.y + rowHeight;
}

function buildPdf(pages) {
  const objects = [];
  const addObject = (body) => {
    objects.push(body);
    return objects.length;
  };

  const fontRegularId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const fontBoldId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");
  const pageIds = [];
  const contentIds = [];

  pages.forEach((commands) => {
    const stream = commands.join("\n");
    contentIds.push(
      addObject(
        `<< /Length ${byteLength(stream)} >>\nstream\n${stream}\nendstream`,
      ),
    );
    pageIds.push(null);
  });

  const pagesId = objects.length + pages.length + 1;

  pages.forEach((_, index) => {
    pageIds[index] = addObject(
      `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R >> >> /Contents ${contentIds[index]} 0 R >>`,
    );
  });

  addObject(`<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`);
  const catalogId = addObject(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((body, index) => {
    offsets.push(byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });

  const xrefOffset = byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new Blob([pdf], { type: "application/pdf" });
}

function formatCurrencyForPdf(value) {
  return `${euroFormatter.format(value)} EUR`;
}

function formatHoursForPdf(value) {
  return `${numberFormatter.format(value)} Std.`;
}

function truncateText(value, maxLength) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}.` : value;
}

function escapePdfText(value) {
  return sanitizePdfText(value)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function sanitizePdfText(value) {
  return String(value)
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/Ä/g, "Ae")
    .replace(/Ö/g, "Oe")
    .replace(/Ü/g, "Ue")
    .replace(/ß/g, "ss")
    .replace(/€/g, "EUR")
    .replace(/[^\x20-\x7E]/g, "");
}

function byteLength(value) {
  return new TextEncoder().encode(value).length;
}
