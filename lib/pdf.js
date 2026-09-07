import { formatRupeesInWords } from "./billing.js";
import { deflateSync, inflateSync } from "node:zlib";

function escapePdfText(value) {
  return String(value || "")
    .replaceAll("\\", "\\\\")
    .replaceAll("(", "\\(")
    .replaceAll(")", "\\)");
}

function setColor(color = "black") {
  if (color === "red") {
    return "0.78 0.02 0.05 rg";
  }

  return "0 0 0 rg";
}

function textLine(text, x, y, fontSize = 10, font = "F1", color = "black") {
  return `${setColor(color)} BT /${font} ${fontSize} Tf ${x} ${y} Td (${escapePdfText(text)}) Tj ET`;
}

const helveticaWidths = {
  " ": 278,
  "-": 333,
  ".": 278,
  "/": 278,
  ":": 278,
  A: 667,
  B: 667,
  C: 722,
  D: 722,
  E: 667,
  F: 611,
  G: 778,
  H: 722,
  I: 278,
  J: 500,
  K: 667,
  L: 556,
  M: 833,
  N: 722,
  O: 778,
  P: 667,
  Q: 778,
  R: 722,
  S: 667,
  T: 611,
  U: 722,
  V: 667,
  W: 944,
  X: 667,
  Y: 667,
  Z: 611,
  a: 556,
  b: 556,
  c: 500,
  d: 556,
  e: 556,
  f: 278,
  g: 556,
  h: 556,
  i: 222,
  j: 222,
  k: 500,
  l: 222,
  m: 833,
  n: 556,
  o: 556,
  p: 556,
  q: 556,
  r: 333,
  s: 500,
  t: 278,
  u: 556,
  v: 500,
  w: 722,
  x: 500,
  y: 500,
  z: 500,
  0: 556,
  1: 556,
  2: 556,
  3: 556,
  4: 556,
  5: 556,
  6: 556,
  7: 556,
  8: 556,
  9: 556
};

function estimatedTextWidth(text, fontSize) {
  const units = String(text || "")
    .split("")
    .reduce((total, character) => total + (helveticaWidths[character] || 556), 0);

  return (units * fontSize) / 1000;
}

function centeredText(text, x, y, width, fontSize = 10, font = "F1", color = "black") {
  return textLine(text, x + Math.max((width - estimatedTextWidth(text, fontSize)) / 2, 0), y, fontSize, font, color);
}

function underlinedCenteredText(text, x, y, width, fontSize = 10, font = "F1", color = "black") {
  const safeText = String(text || "");
  const textWidth = estimatedTextWidth(safeText, fontSize);
  const textX = x + Math.max((width - textWidth) / 2, 0);
  const underlineY = y - 3.25;

  return [
    textLine(safeText, textX, y, fontSize, font, color),
    strokeLine(textX, underlineY, textX + textWidth, underlineY)
  ];
}

function rightText(text, x, y, width, fontSize = 10, font = "F1", color = "black") {
  return textLine(text, x + Math.max(width - estimatedTextWidth(text, fontSize), 0), y, fontSize, font, color);
}

function rightTextFit(text, x, y, width, fontSize = 10, font = "F1", color = "black") {
  const safeText = String(text || "");
  const fittedSize =
    estimatedTextWidth(safeText, fontSize) > width
      ? Math.max((width / estimatedTextWidth(safeText, fontSize)) * fontSize, 6)
      : fontSize;

  return rightText(safeText, x, y, width, fittedSize, font, color);
}

function totalLabelText(text, x, y, width, fontSize = 8) {
  return centeredText(String(text || ""), x + 3, y, width - 6, fontSize, "F2");
}

function line(x1, y1, x2, y2) {
  return `${pdfNumber(x1)} ${pdfNumber(y1)} m ${pdfNumber(x2)} ${pdfNumber(y2)} l S`;
}

function pdfNumber(value) {
  return Number(value).toFixed(3).replace(/\.?0+$/, "");
}

function strokeLine(x1, y1, x2, y2, width = 0.42) {
  return `q 0 J ${pdfNumber(width)} w ${line(x1, y1, x2, y2)} Q`;
}

function rect(x, y, width, height) {
  return `${x} ${y} ${width} ${height} re S`;
}

function money(value) {
  return Number(value || 0).toFixed(2);
}

function wrapText(text, maxLength) {
  const words = String(text || "-").split(/\s+/);
  const lines = [];
  let current = "";

  for (const word of words) {
    const next = `${current} ${word}`.trim();

    if (next.length > maxLength && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines;
}

function wrapTextByWidth(text, maxWidth, fontSize) {
  const words = String(text || "-").split(/\s+/);
  const lines = [];
  let current = "";

  for (const word of words) {
    const next = `${current} ${word}`.trim();

    if (estimatedTextWidth(next, fontSize) <= maxWidth || !current) {
      current = next;
    } else {
      lines.push(current);
      current = word;
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines;
}

function centeredBaseline(rowTop, rowHeight, fontSize) {
  return rowTop - (rowHeight - fontSize) / 2 - fontSize;
}

function multilineBaseline(rowTop, rowHeight, lineCount, fontSize, lineGap) {
  const textHeight = fontSize + Math.max(lineCount - 1, 0) * lineGap;
  return rowTop - (rowHeight - textHeight) / 2 - fontSize;
}

function paethPredictor(left, above, upperLeft) {
  const estimate = left + above - upperLeft;
  const leftDistance = Math.abs(estimate - left);
  const aboveDistance = Math.abs(estimate - above);
  const upperLeftDistance = Math.abs(estimate - upperLeft);

  if (leftDistance <= aboveDistance && leftDistance <= upperLeftDistance) {
    return left;
  }

  return aboveDistance <= upperLeftDistance ? above : upperLeft;
}

function parsePngSignature(dataUrl) {
  const match = String(dataUrl || "").match(/^data:image\/png;base64,(.+)$/i);

  if (!match) {
    return null;
  }

  const png = Buffer.from(match[1], "base64");

  if (png.toString("ascii", 1, 4) !== "PNG") {
    return null;
  }

  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idatChunks = [];

  while (offset < png.length) {
    const length = png.readUInt32BE(offset);
    const type = png.toString("ascii", offset + 4, offset + 8);
    const chunk = png.subarray(offset + 8, offset + 8 + length);

    if (type === "IHDR") {
      width = chunk.readUInt32BE(0);
      height = chunk.readUInt32BE(4);
      bitDepth = chunk[8];
      colorType = chunk[9];
    } else if (type === "IDAT") {
      idatChunks.push(chunk);
    } else if (type === "IEND") {
      break;
    }

    offset += length + 12;
  }

  if (!width || !height || bitDepth !== 8 || colorType !== 6) {
    return null;
  }

  const channels = 4;
  const rowBytes = width * channels;
  const inflated = inflateSync(Buffer.concat(idatChunks));
  const rgba = Buffer.alloc(width * height * channels);
  let sourceOffset = 0;
  let targetOffset = 0;
  let previousRow = Buffer.alloc(rowBytes);

  for (let row = 0; row < height; row += 1) {
    const filter = inflated[sourceOffset];
    sourceOffset += 1;
    const scanline = inflated.subarray(sourceOffset, sourceOffset + rowBytes);
    sourceOffset += rowBytes;
    const output = Buffer.alloc(rowBytes);

    for (let index = 0; index < rowBytes; index += 1) {
      const left = index >= channels ? output[index - channels] : 0;
      const above = previousRow[index] || 0;
      const upperLeft = index >= channels ? previousRow[index - channels] || 0 : 0;
      let predictor = 0;

      if (filter === 1) {
        predictor = left;
      } else if (filter === 2) {
        predictor = above;
      } else if (filter === 3) {
        predictor = Math.floor((left + above) / 2);
      } else if (filter === 4) {
        predictor = paethPredictor(left, above, upperLeft);
      }

      output[index] = (scanline[index] + predictor) & 255;
    }

    output.copy(rgba, targetOffset);
    targetOffset += rowBytes;
    previousRow = output;
  }

  const rgb = Buffer.alloc(width * height * 3);
  const alpha = Buffer.alloc(width * height);

  for (let pixel = 0; pixel < width * height; pixel += 1) {
    rgb[pixel * 3] = rgba[pixel * 4];
    rgb[pixel * 3 + 1] = rgba[pixel * 4 + 1];
    rgb[pixel * 3 + 2] = rgba[pixel * 4 + 2];
    alpha[pixel] = rgba[pixel * 4 + 3];
  }

  return {
    alpha: deflateSync(alpha),
    height,
    rgb: deflateSync(rgb),
    width
  };
}

function parseJpegSignature(dataUrl) {
  const match = String(dataUrl || "").match(/^data:image\/jpe?g;base64,(.+)$/i);

  if (!match) {
    return null;
  }

  return {
    data: Buffer.from(match[1], "base64"),
    height: 220,
    width: 600
  };
}

function signatureObjects(signatureDataUrl, startObjectNumber = 7) {
  const pngSignature = parsePngSignature(signatureDataUrl);

  if (pngSignature) {
    return [
      Buffer.concat([
        Buffer.from(
          `${startObjectNumber} 0 obj << /Type /XObject /Subtype /Image /Width ${pngSignature.width} /Height ${pngSignature.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode /SMask ${startObjectNumber + 1} 0 R /Length ${pngSignature.rgb.length} >> stream\n`,
          "utf8"
        ),
        pngSignature.rgb,
        Buffer.from("\nendstream endobj\n", "utf8")
      ]),
      Buffer.concat([
        Buffer.from(
          `${startObjectNumber + 1} 0 obj << /Type /XObject /Subtype /Image /Width ${pngSignature.width} /Height ${pngSignature.height} /ColorSpace /DeviceGray /BitsPerComponent 8 /Filter /FlateDecode /Length ${pngSignature.alpha.length} >> stream\n`,
          "utf8"
        ),
        pngSignature.alpha,
        Buffer.from("\nendstream endobj\n", "utf8")
      ])
    ];
  }

  const jpegSignature = parseJpegSignature(signatureDataUrl);

  if (!jpegSignature) {
    return [];
  }

  return [
    Buffer.concat([
      Buffer.from(
        `${startObjectNumber} 0 obj << /Type /XObject /Subtype /Image /Width ${jpegSignature.width} /Height ${jpegSignature.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegSignature.data.length} >> stream\n`,
        "utf8"
      ),
      jpegSignature.data,
      Buffer.from("\nendstream endobj\n", "utf8")
    ])
  ];
}

export function generateInvoicePdf(invoice, options = {}) {
  const billSubject = invoice.billSubject || invoice.projectName || "Work";
  const documentNumberLabel = options.documentNumberLabel || "Tax Invoice No";
  const documentNumber = options.documentNumber || invoice.invoiceNumber;
  const subjectPrefix = options.subjectPrefix || "Bill for";
  const includeBankDetails = options.includeBankDetails ?? true;
  const amountInWordsYGap = includeBankDetails ? 42 : 28;
  const isWithoutGst = invoice.taxMode === "none";
  const advancePayment = Number(invoice.advancePayment || 0);
  const balanceDue =
    invoice.balanceDue ?? Math.round(Math.max(invoice.totals.grandTotal - advancePayment, 0) * 100) / 100;
  const payableAmount = advancePayment > 0 ? balanceDue : invoice.totals.grandTotal;
  const parsedSignature = signatureObjects(invoice.companyDetails.signatureImage, 1);
  const hasSignature = parsedSignature.length > 0;
  const border = { x: 20, y: 20, width: 555, height: 802 };
  const contentLeft = 32;
  const contentRight = 563;
  const contentWidth = contentRight - contentLeft;
  const pageBottom = 54;
  const linesByPage = [];

  function createPageLines() {
    return ["0 0 0 RG", "0.9 w", rect(border.x, border.y, border.width, border.height)];
  }

  function drawDocumentHeader(lines) {
    lines.push(textLine(`GSTIN : ${invoice.companyDetails.gstin || "-"}`, contentLeft, 786, 10, "F1"));
    lines.push(rightText(`Mob : ${invoice.companyDetails.phone || "-"}`, 410, 786, 145, 10, "F1"));
    lines.push(
      centeredText(invoice.companyDetails.companyName.toUpperCase(), contentLeft, 752, contentWidth, 25, "F2", "red")
    );
    lines.push(centeredText(invoice.companyDetails.address || "-", contentLeft, 736, contentWidth, 9, "F2"));
    lines.push(line(contentLeft, 720, contentRight, 720));
  }

  function drawIntro(lines) {
    lines.push(textLine("To,", contentLeft, 694, 9, "F2"));
    let introY = 665;
    const customerDetails = invoice.customerDetails || {};
    if (customerDetails.clientName) {
      lines.push(textLine(customerDetails.clientName, contentLeft, introY, 9, "F2"));
      introY -= 13;
    }
    wrapText(customerDetails.address, 38)
      .filter((addressLine) => addressLine !== "-")
      .slice(0, 2)
      .forEach((addressLine) => {
        lines.push(textLine(addressLine, contentLeft, introY, 9, "F2"));
        introY -= 13;
      });
    if (customerDetails.gstNumber) {
      introY -= 12;
      lines.push(textLine(`GSTN : ${customerDetails.gstNumber}`, contentLeft, introY, 9, "F2"));
    }

    lines.push(
      ...underlinedCenteredText(`${documentNumberLabel}: ${documentNumber}`, contentLeft, 694, contentWidth, 9, "F2")
    );
    lines.push(rightText(`Date : ${invoice.invoiceDate}`, 430, 694, 125, 9, "F2"));
    if (invoice.validityDate) {
      lines.push(rightText(`Valid Until : ${invoice.validityDate}`, 390, 679, 165, 8, "F2"));
    }

    const siteY = introY - 28;
    const subjectY = siteY - 38;
    lines.push(textLine(`Site : ${invoice.projectName || "-"}`, contentLeft, siteY, 13, "F2"));
    lines.push(
      ...underlinedCenteredText(`Sub : ${subjectPrefix} ${billSubject}`, contentLeft, subjectY, contentWidth, 12, "F2")
    );

    return subjectY - 31;
  }

  const tableLeft = contentLeft;
  const isQuotationLayout = Boolean(options.preserveRateText);
  const defaultRowHeight = isQuotationLayout ? 24 : 21;
  const headerRowHeight = defaultRowHeight;
  const bodyFontSize = isQuotationLayout ? 8 : 8;
  const descriptionFont = isQuotationLayout ? "F1" : "F2";
  const descriptionFontSize = isQuotationLayout ? 8 : 7;
  const descriptionLineGap = isQuotationLayout ? 12 : 9;
  const horizontalPadding = isQuotationLayout ? 7 : 5;
  const verticalPadding = isQuotationLayout ? 12 : 10;
  const columnWidths = [28, 275, 45, 45, 65, 73];
  const tableWidth = columnWidths.reduce((total, width) => total + width, 0);
  const amountColumnX = tableLeft + columnWidths.slice(0, 5).reduce((total, width) => total + width, 0);
  const labelX = tableLeft + columnWidths.slice(0, 4).reduce((total, width) => total + width, 0);
  const labelWidth = columnWidths[4];
  const amountWidth = columnWidths[5] - 6;

  function drawTableSection(lines, tableTop, rows) {
    const tableHeight = rows.reduce((total, row) => total + row.height, headerRowHeight);
    const tableBottom = tableTop - tableHeight;
    lines.push("0.7 w", rect(tableLeft, tableBottom, tableWidth, tableHeight));

    let currentX = tableLeft;
    for (const width of columnWidths.slice(0, -1)) {
      currentX += width;
      lines.push(line(currentX, tableTop, currentX, tableBottom));
    }

    let rowTop = tableTop - headerRowHeight;
    lines.push(line(tableLeft, rowTop, tableLeft + tableWidth, rowTop));
    rows.forEach((row) => {
      rowTop -= row.height;
      lines.push(line(tableLeft, rowTop, tableLeft + tableWidth, rowTop));
    });

    currentX = tableLeft;
    ["Sl", "Description", "Unit", "Qty", "Rate", "Amount"].forEach((header, index) => {
      const width = columnWidths[index];
      const headerY = centeredBaseline(tableTop, headerRowHeight, 8);
      if (index >= 4) {
        lines.push(rightText(header, currentX + 3, headerY, width - 6, 8, "F2"));
      } else if (index >= 2) {
        lines.push(centeredText(header, currentX, headerY, width, 8, "F2"));
      } else {
        lines.push(textLine(header, currentX + 4, headerY, 8, "F2"));
      }
      currentX += width;
    });

    rowTop = tableTop - headerRowHeight;
    rows.forEach((row) => {
      const rowY = centeredBaseline(rowTop, row.height, bodyFontSize);
      if (row.type === "item") {
        const descriptionY = multilineBaseline(
          rowTop,
          row.height,
          row.descriptionLines.length,
          descriptionFontSize,
          descriptionLineGap
        );
        let x = tableLeft;
        lines.push(textLine(`${String(row.index + 1).padStart(2, "0")}.`, x + 4, rowY, bodyFontSize, "F1"));
        x += columnWidths[0];
        row.descriptionLines.forEach((descriptionLine, lineIndex) => {
          lines.push(
            textLine(
              descriptionLine,
              x + horizontalPadding,
              descriptionY - lineIndex * descriptionLineGap,
              descriptionFontSize,
              descriptionFont
            )
          );
        });
        x += columnWidths[1];
        lines.push(centeredText(row.item.unit, x, rowY, columnWidths[2], bodyFontSize, "F1"));
        x += columnWidths[2];
        lines.push(centeredText(String(row.item.quantity), x, rowY, columnWidths[3], bodyFontSize, "F1"));
        x += columnWidths[3];
        lines.push(
          rightTextFit(
            options.preserveRateText ? row.item.rate : money(row.item.rate),
            x + 3,
            rowY,
            columnWidths[4] - 6,
            bodyFontSize,
            "F1"
          )
        );
        x += columnWidths[4];
        lines.push(rightText(money(row.item.amount), x + 3, rowY, columnWidths[5] - 6, bodyFontSize, "F1"));
      } else {
        lines.push(totalLabelText(row.label, labelX, rowY, labelWidth, row.fontSize || 8));
        lines.push(rightText(row.value, amountColumnX + 3, rowY, amountWidth, 8, "F2"));
      }
      rowTop -= row.height;
    });

    return tableBottom;
  }

  const tableRows = (invoice.items || []).map((item, index) => {
    const descriptionLines = wrapTextByWidth(
      item.description,
      columnWidths[1] - horizontalPadding * 2,
      descriptionFontSize
    );
    return {
      descriptionLines,
      height: Math.max(
        defaultRowHeight,
        descriptionFontSize + Math.max(descriptionLines.length - 1, 0) * descriptionLineGap + verticalPadding
      ),
      index,
      item,
      type: "item"
    };
  });
  const totalRows = [{ height: defaultRowHeight, label: "Total", type: "total", value: money(invoice.totals.subtotal) }];

  if (!isWithoutGst && invoice.totals.igstTotal > 0) {
    totalRows.push({ height: defaultRowHeight, label: "IGST", type: "total", value: money(invoice.totals.igstTotal) });
  } else if (!isWithoutGst) {
    totalRows.push({ height: defaultRowHeight, label: "CGST", type: "total", value: money(invoice.totals.cgstTotal) });
    totalRows.push({ height: defaultRowHeight, label: "SGST", type: "total", value: money(invoice.totals.sgstTotal) });
  }
  totalRows.push({ height: defaultRowHeight, label: "Grand Total", type: "total", value: money(invoice.totals.grandTotal) });
  if (advancePayment > 0) {
    totalRows.push({
      fontSize: 6.3,
      height: defaultRowHeight,
      label: "Advance Payment",
      type: "total",
      value: money(advancePayment)
    });
    totalRows.push({ fontSize: 7, height: defaultRowHeight, label: "Balance Due", type: "total", value: money(balanceDue) });
  }

  let currentPage = createPageLines();
  drawDocumentHeader(currentPage);
  let tableTop = drawIntro(currentPage);
  let pageRows = [];
  let usedTableHeight = headerRowHeight;

  function flushTablePage() {
    const tableBottom = drawTableSection(currentPage, tableTop, pageRows);
    linesByPage.push(currentPage);
    currentPage = createPageLines();
    tableTop = 776;
    pageRows = [];
    usedTableHeight = headerRowHeight;
    return tableBottom;
  }

  [...tableRows, ...totalRows].forEach((row) => {
    const rowHeight = row.height;
    const nextHeight = usedTableHeight + rowHeight;
    if (pageRows.length > 0 && tableTop - nextHeight < pageBottom) {
      flushTablePage();
    }
    pageRows.push({ ...row, height: rowHeight });
    usedTableHeight += rowHeight;
  });

  let tableBottom = drawTableSection(currentPage, tableTop, pageRows);
  let y = tableBottom - 30;
  const finalBlockHeight = includeBankDetails ? 214 : 150;
  if (y - finalBlockHeight < border.y + 20) {
    linesByPage.push(currentPage);
    currentPage = createPageLines();
    y = 766;
  }

  currentPage.push(textLine(`(${formatRupeesInWords(payableAmount)})`, contentLeft, y, 12, "F2"));
  y -= amountInWordsYGap;
  if (includeBankDetails) {
    currentPage.push(textLine("Bank Details:", contentLeft, y, 9, "F2"));
    currentPage.push(line(contentLeft, y - 2, contentLeft + 62, y - 2));
    y -= 14;
    currentPage.push(textLine(`Bank Holder Name : ${invoice.companyDetails.companyName}`, contentLeft, y, 9, "F2"));
    y -= 13;
    currentPage.push(textLine(`A/c Number : ${invoice.companyDetails.accountNumber || "-"}`, contentLeft, y, 9, "F2"));
    y -= 13;
    currentPage.push(textLine(`IFSC Code : ${invoice.companyDetails.ifscCode || "-"}`, contentLeft, y, 9, "F2"));
    y -= 13;
    currentPage.push(textLine(`Bank Name : ${invoice.companyDetails.bankName || "-"}`, contentLeft, y, 9, "F2"));
    y -= 13;
    currentPage.push(textLine(`Branch : ${invoice.companyDetails.branch || "-"}`, contentLeft, y, 9, "F2"));
  } else {
    if (invoice.notes) {
      currentPage.push(textLine(`Notes : ${invoice.notes}`, contentLeft, y, 9, "F2"));
      y -= 13;
    }
    if (invoice.terms) {
      currentPage.push(textLine(`Terms : ${invoice.terms}`, contentLeft, y, 9, "F2"));
      y -= 13;
    }
    if (invoice.validityPeriod) {
      currentPage.push(textLine(`Validity : ${invoice.validityPeriod}`, contentLeft, y, 9, "F2"));
    }
  }

  // Position the closing block immediately after Bank Details (flowing layout)
  // gap in points between Bank Details and Thanking You/signature (approx 18–22pt)
  const gapAfterBank = 20;
  const thankY = y - gapAfterBank;
  currentPage.push(textLine("Thanking You", contentLeft, thankY, 9, "F2"));

  // Right-side signature block area
  const signAreaX = contentLeft + Math.max(contentWidth - 175, 0);
  const signAreaWidth = 150;
  currentPage.push(rightText(`For ${invoice.companyDetails.companyName}`, signAreaX, thankY, signAreaWidth, 9, "F2"));

  // Place signature above the proprietor label, centered within the sign area
  const proprietorY = thankY - 36; // leave room for signature
  if (hasSignature) {
    const sigW = 92;
    const sigH = 34;
    const sigX = signAreaX + Math.max((signAreaWidth - sigW) / 2, 0);
    const sigY = proprietorY + 6; // bottom of signature image
    currentPage.push(`q ${pdfNumber(sigW)} 0 0 ${pdfNumber(sigH)} ${pdfNumber(sigX)} ${pdfNumber(sigY)} cm /Sig Do Q`);
  }

  currentPage.push(rightText("Proprietor", signAreaX + 25, proprietorY, 100, 9, "F2"));
  linesByPage.push(currentPage);

  const pageCount = linesByPage.length;
  const firstPageObject = 3;
  const firstContentObject = firstPageObject + pageCount;
  const fontRegularObject = firstContentObject + pageCount;
  const fontBoldObject = fontRegularObject + 1;
  const signatureObject = hasSignature ? fontBoldObject + 1 : null;
  const sigObjects = hasSignature ? signatureObjects(invoice.companyDetails.signatureImage, signatureObject) : [];
  const resources = hasSignature
    ? `/Resources << /Font << /F1 ${fontRegularObject} 0 R /F2 ${fontBoldObject} 0 R >> /XObject << /Sig ${signatureObject} 0 R >> >>`
    : `/Resources << /Font << /F1 ${fontRegularObject} 0 R /F2 ${fontBoldObject} 0 R >> >>`;
  const pageObjects = linesByPage.map((_, index) =>
    Buffer.from(
      `${firstPageObject + index} 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] ${resources} /Contents ${firstContentObject + index} 0 R >> endobj\n`,
      "utf8"
    )
  );
  const contentObjects = linesByPage.map((pageLines, index) => {
    const contentStream = pageLines.join("\n");
    return Buffer.from(
      `${firstContentObject + index} 0 obj << /Length ${Buffer.byteLength(contentStream, "utf8")} >> stream\n${contentStream}\nendstream endobj\n`,
      "utf8"
    );
  });
  const pageKids = pageObjects.map((_, index) => `${firstPageObject + index} 0 R`).join(" ");
  const objects = [
    Buffer.from("1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n", "utf8"),
    Buffer.from(`2 0 obj << /Type /Pages /Kids [${pageKids}] /Count ${pageCount} >> endobj\n`, "utf8"),
    ...pageObjects,
    ...contentObjects,
    Buffer.from(`${fontRegularObject} 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n`, "utf8"),
    Buffer.from(`${fontBoldObject} 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> endobj\n`, "utf8")
  ];

  objects.push(...sigObjects);

  const chunks = [Buffer.from("%PDF-1.4\n", "utf8")];
  const offsets = [0];
  let currentOffset = chunks[0].length;

  objects.forEach((object) => {
    offsets.push(currentOffset);
    chunks.push(object);
    currentOffset += object.length;
  });

  const xrefOffset = currentOffset;
  let trailer = `xref\n0 ${objects.length + 1}\n`;
  trailer += "0000000000 65535 f \n";

  for (const offset of offsets.slice(1)) {
    trailer += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }

  trailer += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  chunks.push(Buffer.from(trailer, "utf8"));

  return Buffer.concat(chunks);
}
