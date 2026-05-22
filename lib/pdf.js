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

function signatureObjects(signatureDataUrl) {
  const pngSignature = parsePngSignature(signatureDataUrl);

  if (pngSignature) {
    return [
      Buffer.concat([
        Buffer.from(
          `7 0 obj << /Type /XObject /Subtype /Image /Width ${pngSignature.width} /Height ${pngSignature.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode /SMask 8 0 R /Length ${pngSignature.rgb.length} >> stream\n`,
          "utf8"
        ),
        pngSignature.rgb,
        Buffer.from("\nendstream endobj\n", "utf8")
      ]),
      Buffer.concat([
        Buffer.from(
          `8 0 obj << /Type /XObject /Subtype /Image /Width ${pngSignature.width} /Height ${pngSignature.height} /ColorSpace /DeviceGray /BitsPerComponent 8 /Filter /FlateDecode /Length ${pngSignature.alpha.length} >> stream\n`,
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
        `7 0 obj << /Type /XObject /Subtype /Image /Width ${jpegSignature.width} /Height ${jpegSignature.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegSignature.data.length} >> stream\n`,
        "utf8"
      ),
      jpegSignature.data,
      Buffer.from("\nendstream endobj\n", "utf8")
    ])
  ];
}

export function generateInvoicePdf(invoice) {
  const billSubject = invoice.billSubject || invoice.projectName || "Work";
  const isWithoutGst = invoice.taxMode === "none";
  const advancePayment = Number(invoice.advancePayment || 0);
  const balanceDue =
    invoice.balanceDue ?? Math.round(Math.max(invoice.totals.grandTotal - advancePayment, 0) * 100) / 100;
  const payableAmount = advancePayment > 0 ? balanceDue : invoice.totals.grandTotal;
  const sigObjects = signatureObjects(invoice.companyDetails.signatureImage);
  const hasSignature = sigObjects.length > 0;
  const pageWidth = 595;
  const border = { x: 20, y: 20, width: 555, height: 802 };
  const contentLeft = 32;
  const contentRight = 563;
  const contentWidth = contentRight - contentLeft;
  const lines = ["0 0 0 RG", "0.9 w", rect(border.x, border.y, border.width, border.height)];

  lines.push(textLine(`GSTIN : ${invoice.companyDetails.gstin || "-"}`, contentLeft, 786, 10, "F1"));
  lines.push(rightText(`Mob : ${invoice.companyDetails.phone || "-"}`, 410, 786, 145, 10, "F1"));
  lines.push(centeredText(invoice.companyDetails.companyName.toUpperCase(), contentLeft, 752, contentWidth, 25, "F2", "red"));
  lines.push(centeredText(invoice.companyDetails.address || "-", contentLeft, 736, contentWidth, 9, "F2"));
  lines.push(line(contentLeft, 720, contentRight, 720));

  lines.push(textLine("To,", contentLeft, 694, 9, "F2"));
  let y = 665;
  lines.push(textLine(invoice.customerDetails.clientName, contentLeft, y, 9, "F2"));
  y -= 13;
  wrapText(invoice.customerDetails.address, 38).slice(0, 2).forEach((addressLine) => {
    lines.push(textLine(addressLine, contentLeft, y, 9, "F2"));
    y -= 13;
  });
  y -= 12;
  lines.push(textLine(`GSTN : ${invoice.customerDetails.gstNumber || "-"}`, contentLeft, y, 9, "F2"));

  lines.push(...underlinedCenteredText(`Tax Invoice No: ${invoice.invoiceNumber}`, contentLeft, 694, contentWidth, 9, "F2"));
  lines.push(rightText(`Date : ${invoice.invoiceDate}`, 430, 694, 125, 9, "F2"));

  const siteY = y - 28;
  const subjectY = siteY - 38;
  const tableTop = subjectY - 31;
  lines.push(textLine(`Site : ${invoice.projectName || "-"}`, contentLeft, siteY, 13, "F2"));
  lines.push(...underlinedCenteredText(`Sub : Bill for ${billSubject}`, contentLeft, subjectY, contentWidth, 12, "F2"));

  const tableLeft = contentLeft;
  const rowHeight = 21;
  const columnWidths = [28, 275, 45, 45, 65, 73];
  const tableWidth = columnWidths.reduce((total, width) => total + width, 0);
  const visibleItems = invoice.items.slice(0, 8);
  const taxRows = isWithoutGst ? 0 : invoice.totals.igstTotal > 0 ? 1 : 2;
  const advanceRows = advancePayment > 0 ? 2 : 0;
  const totalRows = 1 + visibleItems.length + 1 + taxRows + 1 + advanceRows;
  const tableHeight = totalRows * rowHeight;
  const tableBottom = tableTop - tableHeight;

  lines.push("0.7 w", rect(tableLeft, tableBottom, tableWidth, tableHeight));

  let currentX = tableLeft;
  for (const width of columnWidths.slice(0, -1)) {
    currentX += width;
    lines.push(line(currentX, tableTop, currentX, tableBottom));
  }

  for (let row = 1; row < totalRows; row += 1) {
    lines.push(line(tableLeft, tableTop - row * rowHeight, tableLeft + tableWidth, tableTop - row * rowHeight));
  }

  const headers = ["Sl", "Description", "Unit", "Qty", "Rate", "Amount"];
  currentX = tableLeft;
  headers.forEach((header, index) => {
    const width = columnWidths[index];
    if (index >= 4) {
      lines.push(rightText(header, currentX + 3, tableTop - 14, width - 6, 8, "F2"));
    } else if (index >= 2) {
      lines.push(centeredText(header, currentX, tableTop - 14, width, 8, "F2"));
    } else {
      lines.push(textLine(header, currentX + 4, tableTop - 14, 8, "F2"));
    }
    currentX += width;
  });

  visibleItems.forEach((item, index) => {
    const rowY = tableTop - rowHeight * (index + 1) - 14;
    let x = tableLeft;
    lines.push(textLine(`${String(index + 1).padStart(2, "0")}.`, x + 4, rowY, 8, "F1"));
    x += columnWidths[0];
    lines.push(textLine(wrapText(item.description, 50)[0], x + 5, rowY, 7, "F2"));
    x += columnWidths[1];
    lines.push(centeredText(item.unit, x, rowY, columnWidths[2], 8, "F1"));
    x += columnWidths[2];
    lines.push(centeredText(String(item.quantity), x, rowY, columnWidths[3], 8, "F1"));
    x += columnWidths[3];
    lines.push(rightText(money(item.rate), x + 3, rowY, columnWidths[4] - 6, 8, "F1"));
    x += columnWidths[4];
    lines.push(rightText(money(item.amount), x + 3, rowY, columnWidths[5] - 6, 8, "F1"));
  });

  const amountColumnX = tableLeft + columnWidths.slice(0, 5).reduce((total, width) => total + width, 0);
  const labelX = tableLeft + columnWidths.slice(0, 4).reduce((total, width) => total + width, 0);
  const labelWidth = columnWidths[4];
  const amountWidth = columnWidths[5] - 6;
  let totalY = tableTop - rowHeight * (visibleItems.length + 1) - 14;
  lines.push(totalLabelText("Total", labelX, totalY, labelWidth));
  lines.push(rightText(money(invoice.totals.subtotal), amountColumnX + 3, totalY, amountWidth, 8, "F2"));

  totalY -= rowHeight;
  if (!isWithoutGst && invoice.totals.igstTotal > 0) {
    lines.push(totalLabelText("IGST", labelX, totalY, labelWidth));
    lines.push(rightText(money(invoice.totals.igstTotal), amountColumnX + 3, totalY, amountWidth, 8, "F2"));
    totalY -= rowHeight;
  } else if (!isWithoutGst) {
    lines.push(totalLabelText("CGST", labelX, totalY, labelWidth));
    lines.push(rightText(money(invoice.totals.cgstTotal), amountColumnX + 3, totalY, amountWidth, 8, "F2"));
    totalY -= rowHeight;
    lines.push(totalLabelText("SGST", labelX, totalY, labelWidth));
    lines.push(rightText(money(invoice.totals.sgstTotal), amountColumnX + 3, totalY, amountWidth, 8, "F2"));
    totalY -= rowHeight;
  }
  lines.push(totalLabelText("Grand Total", labelX, totalY, labelWidth));
  lines.push(rightText(money(invoice.totals.grandTotal), amountColumnX + 3, totalY, amountWidth, 8, "F2"));
  totalY -= rowHeight;
  if (advancePayment > 0) {
    lines.push(totalLabelText("Advance Payment", labelX, totalY, labelWidth, 6.3));
    lines.push(rightText(money(advancePayment), amountColumnX + 3, totalY, amountWidth, 8, "F2"));
    totalY -= rowHeight;
    lines.push(totalLabelText("Balance Due", labelX, totalY, labelWidth, 7));
    lines.push(rightText(money(balanceDue), amountColumnX + 3, totalY, amountWidth, 8, "F2"));
  }

  y = tableBottom - 30;
  lines.push(textLine(`(${formatRupeesInWords(payableAmount)})`, contentLeft, y, 12, "F2"));
  y -= 42;
  lines.push(textLine("Bank Details:", contentLeft, y, 9, "F2"));
  lines.push(line(contentLeft, y - 2, contentLeft + 62, y - 2));
  y -= 14;
  lines.push(textLine(`Bank Holder Name : ${invoice.companyDetails.companyName}`, contentLeft, y, 9, "F2"));
  y -= 13;
  lines.push(textLine(`A/c Number : ${invoice.companyDetails.accountNumber || "-"}`, contentLeft, y, 9, "F2"));
  y -= 13;
  lines.push(textLine(`IFSC Code : ${invoice.companyDetails.ifscCode || "-"}`, contentLeft, y, 9, "F2"));
  y -= 13;
  lines.push(textLine(`Bank Name : ${invoice.companyDetails.bankName || "-"}`, contentLeft, y, 9, "F2"));
  y -= 13;
  lines.push(textLine(`Branch : ${invoice.companyDetails.branch || "-"}`, contentLeft, y, 9, "F2"));

  lines.push(textLine("Thanking You", contentLeft, 106, 9, "F2"));
  lines.push(rightText(`For ${invoice.companyDetails.companyName}`, 385, 164, 150, 9, "F2"));
  if (hasSignature) {
    lines.push("q 92 0 0 34 426 122 cm /Sig Do Q");
  }
  lines.push(rightText("Proprietor", 410, 108, 100, 9, "F2"));

  const contentStream = lines.join("\n");
  const resources = hasSignature
    ? "/Resources << /Font << /F1 4 0 R /F2 6 0 R >> /XObject << /Sig 7 0 R >> >>"
    : "/Resources << /Font << /F1 4 0 R /F2 6 0 R >> >>";
  const objects = [
    Buffer.from("1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n", "utf8"),
    Buffer.from("2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n", "utf8"),
    Buffer.from(
      `3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] ${resources} /Contents 5 0 R >> endobj\n`,
      "utf8"
    ),
    Buffer.from("4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n", "utf8"),
    Buffer.from(
      `5 0 obj << /Length ${Buffer.byteLength(contentStream, "utf8")} >> stream\n${contentStream}\nendstream endobj\n`,
      "utf8"
    ),
    Buffer.from("6 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> endobj\n", "utf8")
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
