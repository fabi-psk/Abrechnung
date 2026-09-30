const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 42;
const BOTTOM_MARGIN = 42;
const LINE_HEIGHT = 15;
const RECEIPT_WIDTH = 226.77;
const RECEIPT_MARGIN = 12;
const RECEIPT_LINE_HEIGHT = 11;

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
    ["Bargeld gesamt", formatCurrencyForPdf(settlement.cashRevenue)],
    ["Gesamt Abzugeben", formatCurrencyForPdf(settlement.amountToSubmit)],
    [
      "Bereits ausgezahlter Lohn",
      `- ${formatCurrencyForPdf(settlement.paidOutCashWagesTotal)}`,
    ],
    [
      "Noch auszuzahlende Barloehne",
      formatCurrencyForPdf(settlement.openCashWagesTotal),
    ],
    ["Abzugeben nach Lohn", formatCurrencyForPdf(settlement.amountToHandOver)],
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
      wagePaidOut: result.wagePaidOut ? "Ja" : "Nein",
      cashWage: formatCurrencyForPdf(result.cashWage),
      tip: formatCurrencyForPdf(result.tip),
      payout: formatCurrencyForPdf(result.remainingCashPayout),
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

export function createReceiptSettlementPdf({ settlement, employees }) {
  const writer = createReceiptPdfWriter();
  const now = new Date();
  const titleDate = now.toLocaleDateString("de-DE");
  const fileDate = now.toISOString().slice(0, 10);
  const employeeLookup = new Map(employees.map((employee) => [employee.id, employee]));

  writer.separator();
  writer.center("TAGESABRECHNUNG", 11, { bold: true });
  writer.center(titleDate, 9);
  writer.separator();
  writer.space(5);

  writer.heading("ABZUGEBEN");
  writer.row("Bargeld gesamt:", formatCurrencyForPdf(settlement.cashRevenue));
  writer.row("Ausgangsbetrag:", formatCurrencyForPdf(settlement.amountToSubmit));
  writer.row(
    "- ausgez. Lohn:",
    formatCurrencyForPdf(settlement.paidOutCashWagesTotal),
  );
  writer.space(7);

  writer.heading("PERSONAL");
  writer.separator();
  writer.space(4);

  settlement.employeeResults.forEach((result, index) => {
    const sourceEmployee = employeeLookup.get(result.id);

    writer.wrap(result.name, 9, { bold: true });
    writer.row(
      `${sourceEmployee?.startTime || "--:--"} - ${sourceEmployee?.endTime || "--:--"}`,
      formatHoursForReceipt(result.hours),
    );

    if (result.paidInCash) {
      writer.row("Barlohn:", formatCurrencyForPdf(result.cashWage), { indent: 8 });
      if (result.wagePaidOut) {
        writer.row("Bereits ausgezahlt:", "Ja", { indent: 8 });
      }
    }

    if (index < settlement.employeeResults.length - 1) {
      writer.space(7);
    }
  });

  writer.space(5);
  writer.separator();
  writer.row("Barlohn gesamt:", formatCurrencyForPdf(settlement.cashWagesTotal), {
    boldValue: true,
  });
  writer.row("Bereits ausgezahlt:", formatCurrencyForPdf(settlement.paidOutCashWagesTotal));
  writer.row("Noch auszuzahlen:", formatCurrencyForPdf(settlement.openCashWagesTotal), {
    boldValue: true,
  });
  writer.space(8);

  writer.heading("TRINKGELD");
  writer.separator();
  writer.row("Trinkgeld gesamt:", formatCurrencyForPdf(settlement.totalTips), {
    boldValue: true,
  });

  if (settlement.employeeResults.length > 0) {
    writer.space(5);
    settlement.employeeResults.forEach((result) => {
      writer.wrap(result.name, 8.5);
      writer.row("Trinkgeld:", formatCurrencyForPdf(result.tip), {
        indent: 8,
        size: 8.5,
      });
    });
  }

  writer.space(7);
  writer.separator();
  writer.heading("ABZUGEBEN");
  writer.bigAmount(formatCurrencyForPdf(settlement.amountToHandOver));
  writer.separator();

  const blob = writer.finish();
  const fileName = `tagesabrechnung-${fileDate}.pdf`;

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

function createReceiptPdfWriter() {
  const commands = [];
  let y = RECEIPT_MARGIN;

  const api = {
    text(value, x, size = 9, options = {}) {
      commands.push({
        type: "text",
        value,
        x,
        y,
        size,
        bold: Boolean(options.bold),
        align: options.align,
      });
      y += options.lineHeight ?? RECEIPT_LINE_HEIGHT;
    },
    center(value, size = 9, options = {}) {
      api.text(value, RECEIPT_WIDTH / 2, size, { ...options, align: "center" });
    },
    heading(value) {
      api.text(value, RECEIPT_MARGIN, 9, { bold: true, lineHeight: 12 });
    },
    row(label, value, options = {}) {
      const size = options.size ?? 8.6;
      const labelX = RECEIPT_MARGIN + (options.indent ?? 0);
      api.text(label, labelX, size, { bold: options.boldLabel, lineHeight: 0 });
      api.text(value, RECEIPT_WIDTH - RECEIPT_MARGIN, size, {
        align: "right",
        bold: options.boldValue,
      });
    },
    wrap(value, size = 9, options = {}) {
      wrapReceiptText(value, 29).forEach((line) => {
        api.text(line, RECEIPT_MARGIN, size, options);
      });
    },
    bigAmount(value) {
      api.text(value, RECEIPT_WIDTH - RECEIPT_MARGIN, 13, {
        align: "right",
        bold: true,
        lineHeight: 17,
      });
    },
    separator() {
      commands.push({ type: "line", y: y + 5 });
      y += 12;
    },
    space(height) {
      y += height;
    },
    finish() {
      const pageHeight = Math.max(y + RECEIPT_MARGIN, 160);
      const pageCommands = commands.map((command) =>
        command.type === "line"
          ? drawReceiptLine(command, pageHeight)
          : drawReceiptText(command, pageHeight),
      );

      return buildPdfWithSize([pageCommands], RECEIPT_WIDTH, pageHeight);
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
    ["Ausgez.?", 505],
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
    [row.wagePaidOut, 505, 9],
  ].forEach(([value, x, size, bold]) => {
    writer.text(pageIndex, value, x, row.y + 18, size, { bold });
  });

  return row.y + rowHeight;
}

function buildPdf(pages) {
  return buildPdfWithSize(pages, PAGE_WIDTH, PAGE_HEIGHT);
}

function buildPdfWithSize(pages, pageWidth, pageHeight) {
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
      `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${pageWidth.toFixed(2)} ${pageHeight.toFixed(2)}] /Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R >> >> /Contents ${contentIds[index]} 0 R >>`,
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

function drawReceiptText(command, pageHeight) {
  const font = command.bold ? "F2" : "F1";
  const safeValue = escapePdfText(command.value);
  const estimatedWidth = estimatePdfTextWidth(command.value, command.size);
  const x =
    command.align === "center"
      ? command.x - estimatedWidth / 2
      : command.align === "right"
        ? command.x - estimatedWidth
        : command.x;

  return `0.08 0.08 0.08 rg BT /${font} ${command.size} Tf ${x.toFixed(2)} ${(pageHeight - command.y).toFixed(
    2,
  )} Td (${safeValue}) Tj ET`;
}

function drawReceiptLine(command, pageHeight) {
  return `0.08 0.08 0.08 RG 0.5 w ${RECEIPT_MARGIN.toFixed(2)} ${(pageHeight - command.y).toFixed(
    2,
  )} m ${(RECEIPT_WIDTH - RECEIPT_MARGIN).toFixed(2)} ${(pageHeight - command.y).toFixed(2)} l S`;
}

function formatCurrencyForPdf(value) {
  return `${euroFormatter.format(value)} EUR`;
}

function formatHoursForPdf(value) {
  return `${numberFormatter.format(value)} Std.`;
}

function formatHoursForReceipt(value) {
  return `${new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value)} Std.`;
}

function wrapReceiptText(value, maxLength) {
  const words = String(value).trim().split(/\s+/).filter(Boolean);
  const lines = [];
  let currentLine = "";

  words.forEach((word) => {
    if (word.length > maxLength) {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = "";
      }
      for (let index = 0; index < word.length; index += maxLength) {
        lines.push(word.slice(index, index + maxLength));
      }
      return;
    }

    const nextLine = currentLine ? `${currentLine} ${word}` : word;
    if (nextLine.length > maxLength) {
      lines.push(currentLine);
      currentLine = word;
      return;
    }

    currentLine = nextLine;
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.length > 0 ? lines : ["Ohne Namen"];
}

function estimatePdfTextWidth(value, size) {
  return sanitizePdfText(value).length * size * 0.52;
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
