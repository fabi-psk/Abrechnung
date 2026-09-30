const TM_PRINT_ASSISTANT_URL =
  import.meta.env.VITE_TM_PRINT_ASSISTANT_URL ||
  "tmprintassistant://tmprintassistant.epson.com/print";
const EPOS_PRINT_XMLNS = "http://www.epson-pos.com/schemas/2011/03/epos-print";
const RECEIPT_COLUMNS = 42;

const euroFormatter = new Intl.NumberFormat("de-DE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const hourFormatter = new Intl.NumberFormat("de-DE", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function printSettlementReceipt({ settlement, employees }) {
  const xml = createSettlementReceiptXml({ settlement, employees });
  const url = createTmPrintAssistantUrl(xml);

  window.location.href = url;
}

export function createSettlementReceiptXml({ settlement, employees }) {
  const writer = createEposReceiptWriter();
  const now = new Date();
  const titleDate = now.toLocaleDateString("de-DE");
  const employeeLookup = new Map(employees.map((employee) => [employee.id, employee]));

  writer.separator();
  writer.center("TAGESABRECHNUNG", { bold: true });
  writer.center(titleDate);
  writer.separator();
  writer.feed();

  writer.heading("ABZUGEBEN");
  writer.row("Bargeld gesamt:", formatCurrency(settlement.cashRevenue));
  writer.row("Ausgangsbetrag:", formatCurrency(settlement.amountToSubmit), {
    bold: true,
  });
  writer.row("- ausgez. Lohn:", formatCurrency(settlement.paidOutCashWagesTotal));
  writer.feed();

  writer.heading("PERSONAL");
  writer.separator("-");

  settlement.employeeResults.forEach((result, index) => {
    const sourceEmployee = employeeLookup.get(result.id);

    writer.wrap(result.name, { bold: true });
    writer.row(
      `${sourceEmployee?.startTime || "--:--"} - ${sourceEmployee?.endTime || "--:--"}`,
      formatHours(result.hours),
    );

    if (result.paidInCash) {
      writer.row("Barlohn:", formatCurrency(result.cashWage), { indent: 2 });
      if (result.wagePaidOut) {
        writer.row("Bereits ausgezahlt:", "Ja", { indent: 2 });
      }
    }

    if (index < settlement.employeeResults.length - 1) {
      writer.feed();
    }
  });

  writer.feed();
  writer.separator("-");
  writer.row("Barlohn gesamt:", formatCurrency(settlement.cashWagesTotal), {
    bold: true,
  });
  writer.row("Bereits ausgezahlt:", formatCurrency(settlement.paidOutCashWagesTotal));
  writer.row("Noch auszuzahlen:", formatCurrency(settlement.openCashWagesTotal), {
    bold: true,
  });
  writer.feed();

  writer.heading("TRINKGELD");
  writer.separator("-");
  writer.row("Trinkgeld gesamt:", formatCurrency(settlement.totalTips), {
    bold: true,
  });

  if (settlement.employeeResults.length > 0) {
    writer.feed();
    settlement.employeeResults.forEach((result) => {
      writer.wrap(result.name);
      writer.row("Trinkgeld:", formatCurrency(result.tip), { indent: 2 });
    });
  }

  writer.feed();
  writer.separator();
  writer.heading("ABZUGEBEN");
  writer.bigAmount(formatCurrency(settlement.amountToHandOver));
  writer.separator();
  writer.feed(3);
  writer.cut();

  return writer.finish();
}

function createTmPrintAssistantUrl(xml) {
  const params = [
    ["ver", "1"],
    ["data-type", "eposprintxml"],
    ["data", xml],
    ["timeout", "30000"],
    ["error-dialog", "yes"],
    ["reselect", "yes"],
  ];
  const query = params
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join("&");

  return `${TM_PRINT_ASSISTANT_URL}?${query}`;
}

function createEposReceiptWriter() {
  const commands = [`<epos-print xmlns="${EPOS_PRINT_XMLNS}">`];

  const api = {
    text(value, options = {}) {
      commands.push(createTextElement(value, options));
    },
    center(value, options = {}) {
      api.text(value, { ...options, align: "center" });
    },
    heading(value) {
      api.text(value, { bold: true });
    },
    row(label, value, options = {}) {
      const indent = " ".repeat(options.indent ?? 0);
      api.text(formatRow(`${indent}${label}`, value), { bold: options.bold });
    },
    wrap(value, options = {}) {
      wrapText(normalizeText(value), RECEIPT_COLUMNS).forEach((line) => {
        api.text(line, options);
      });
    },
    bigAmount(value) {
      api.text(value, {
        align: "right",
        bold: true,
        width: 2,
        height: 2,
      });
    },
    separator(character = "=") {
      api.text(character.repeat(RECEIPT_COLUMNS));
    },
    feed(lines = 1) {
      commands.push(`<feed line="${lines}" />`);
    },
    cut() {
      commands.push('<cut type="feed" />');
    },
    finish() {
      commands.push("</epos-print>");
      return commands.join("");
    },
  };

  return api;
}

function createTextElement(value, options) {
  const attributes = [];

  if (options.align) {
    attributes.push(`align="${options.align}"`);
  }

  if (options.bold) {
    attributes.push('em="true"');
  }

  if (options.width) {
    attributes.push(`width="${options.width}"`);
  }

  if (options.height) {
    attributes.push(`height="${options.height}"`);
  }

  const attributeText = attributes.length > 0 ? ` ${attributes.join(" ")}` : "";
  const text = escapeXml(normalizeText(value)).replace(/\r?\n/g, "&#10;");
  return `<text${attributeText}>${text}&#10;</text>`;
}

function formatRow(label, value) {
  const safeLabel = truncateText(normalizeText(label), RECEIPT_COLUMNS - 4);
  const safeValue = normalizeText(value);
  const gapLength = RECEIPT_COLUMNS - safeLabel.length - safeValue.length;

  if (gapLength < 1) {
    return `${safeLabel}\n${safeValue.padStart(RECEIPT_COLUMNS)}`;
  }

  return `${safeLabel}${" ".repeat(gapLength)}${safeValue}`;
}

function formatCurrency(value) {
  return `${euroFormatter.format(value)} EUR`;
}

function formatHours(value) {
  return `${hourFormatter.format(value)} Std.`;
}

function wrapText(value, maxLength) {
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

function truncateText(value, maxLength) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}.` : value;
}

function normalizeText(value) {
  return String(value)
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/Ä/g, "Ae")
    .replace(/Ö/g, "Oe")
    .replace(/Ü/g, "Ue")
    .replace(/ß/g, "ss")
    .replace(/€/g, "EUR");
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
