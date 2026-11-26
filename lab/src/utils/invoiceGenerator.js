// Pure-JS PDF 1.4 Invoice Generator for StudentMart orders (no external dependencies)

function sanitizePdfText(value) {
    return String(value ?? "")
        .replace(/₹/g, "Rs. ")
        .replace(/[^\x20-\x7E]/g, " ")
        .replace(/\\/g, "\\\\")
        .replace(/\(/g, "\\(")
        .replace(/\)/g, "\\)")
        .replace(/\s+/g, " ")
        .trim();
}

function formatInvoiceDate(dateValue) {
    if (!dateValue) {
        return new Intl.DateTimeFormat("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }).format(new Date());
    }
    const d = new Date(dateValue);
    if (Number.isNaN(d.getTime())) return String(dateValue);
    return new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    }).format(d);
}

function wrapText(text, maxChars) {
    const clean = String(text || "").trim();
    if (!clean) return [""];
    const words = clean.split(/\s+/);
    const lines = [];
    let current = "";
    for (const word of words) {
        if (!current) {
            current = word;
        } else if ((current + " " + word).length <= maxChars) {
            current += " " + word;
        } else {
            lines.push(current);
            current = word;
        }
    }
    if (current) lines.push(current);
    return lines;
}

function buildPdfDocument(streamCommands) {
    const stream = streamCommands.join("\n");
    const objects = [
        "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
        "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
        "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj\n",
        "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
        "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n",
        `6 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj\n`
    ];

    let pdf = "%PDF-1.4\n";
    const offsets = [0];
    for (const obj of objects) {
        offsets.push(pdf.length);
        pdf += obj;
    }

    const xrefStart = pdf.length;
    pdf += `xref\n0 ${objects.length + 1}\n`;
    pdf += "0000000000 65535 f \n";
    for (let i = 1; i <= objects.length; i++) {
        pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
    }
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

    return new TextEncoder().encode(pdf);
}

export function downloadOrderInvoice(order) {
    if (!order) return;

    const orderId = order.orderId || order.invoiceNo || order._id || "INVOICE";
    const createdStr = formatInvoiceDate(order.createdAt || order.date);
    const custName = order.deliveryAddress?.fullName || order.customer?.name || order.username || "Student Customer";
    const custEmail = order.customer?.email || order.deliveryAddress?.email || order.email || "N/A";
    const custPhone = order.deliveryAddress?.mobile || order.customer?.phone || "N/A";
    const addr = order.deliveryAddress || {};

    const addressLines = [];
    if (addr.houseNo || addr.street) {
        addressLines.push(
            `${addr.houseNo || ""}${addr.houseNo && addr.street ? ", " : ""}${addr.street || ""}${addr.landmark ? `, Near ${addr.landmark}` : ""}`
        );
    }
    if (addr.city || addr.state || addr.pincode) {
        addressLines.push(
            `${addr.city || ""}${addr.city && addr.state ? ", " : ""}${addr.state || ""}${addr.pincode ? ` - ${addr.pincode}` : ""}`
        );
    }
    if (addr.location?.latitude !== null && addr.location?.latitude !== undefined) {
        addressLines.push(`GPS Pin: ${addr.location.latitude}, ${addr.location.longitude}`);
    }
    if (addressLines.length === 0) {
        addressLines.push("Campus Pickup / Standard Student Order");
    }

    const items = Array.isArray(order.items) ? order.items : [];
    const subtotalVal = Number(order.subtotal ?? order.total ?? 0);
    const deliveryVal = Number(order.deliveryCharges ?? 0);
    const discountVal = Number(order.discount ?? 0);
    const finalVal = Number(order.finalTotal ?? order.total ?? subtotalVal);

    const cmds = [];
    const addText = (font, size, x, y, text, colorRgb = "0.08 0.11 0.15") => {
        cmds.push(`BT /${font} ${size} Tf ${colorRgb} rg 1 0 0 1 ${x} ${y} Tm (${sanitizePdfText(text)}) Tj ET`);
    };
    const addRect = (x, y, w, h, fillRgb) => {
        cmds.push(`q ${fillRgb} rg ${x} ${y} ${w} ${h} re f Q`);
    };
    const addLine = (x1, y1, x2, y2, strokeRgb = "0.88 0.85 0.80") => {
        cmds.push(`q ${strokeRgb} RG 0.8 w ${x1} ${y1} m ${x2} ${y2} l S Q`);
    };

    // Dark Header Banner
    addRect(0, 742, 595, 100, "0.075 0.106 0.149");
    addText("F2", 22, 42, 800, "StudentMart", "1 1 1");
    addText("F1", 10, 42, 780, "Your campus, connected. Official Order Invoice", "0.82 0.87 0.92");

    addText("F2", 12, 390, 802, "INVOICE", "0.945 0.871 0.788");
    addText("F1", 10, 390, 784, `Order ID: ${orderId}`, "1 1 1");
    addText("F1", 9, 390, 768, `Date: ${createdStr}`, "0.82 0.87 0.92");

    // Bill To & Order Info Cards
    addRect(42, 598, 250, 124, "0.965 0.945 0.918");
    addText("F2", 9, 54, 704, "BILL TO / DELIVERY ADDRESS", "0.114 0.369 0.294");
    addText("F2", 11, 54, 686, custName, "0.08 0.11 0.15");
    addText("F1", 9, 54, 670, `Email: ${custEmail}`, "0.28 0.33 0.40");
    addText("F1", 9, 54, 656, `Phone: ${custPhone}`, "0.28 0.33 0.40");

    let addrY = 640;
    for (const rawLine of addressLines) {
        const wrapped = wrapText(rawLine, 42);
        for (const wLine of wrapped) {
            if (addrY >= 606) {
                addText("F1", 8.5, 54, addrY, wLine, "0.28 0.33 0.40");
                addrY -= 12;
            }
        }
    }

    addRect(306, 598, 247, 124, "0.965 0.945 0.918");
    addText("F2", 9, 318, 704, "PAYMENT & ORDER SUMMARY", "0.114 0.369 0.294");
    addText("F1", 9.5, 318, 684, `Order Status: ${order.orderStatus || "Placed"}`, "0.08 0.11 0.15");
    addText("F1", 9.5, 318, 666, `Payment Mode: ${order.paymentMethod || "Cash on Delivery"}`, "0.08 0.11 0.15");
    addText("F1", 9.5, 318, 648, `Payment Status: ${order.paymentStatus || "Pending"}`, "0.08 0.11 0.15");
    if (order.promoCode) {
        addText("F2", 9.5, 318, 630, `Promo Applied: ${order.promoCode}`, "0.114 0.369 0.294");
    }

    // Items Table Header
    let y = 562;
    addRect(42, y, 511, 24, "0.114 0.369 0.294");
    addText("F2", 9, 52, y + 8, "#", "1 1 1");
    addText("F2", 9, 78, y + 8, "PRODUCT DESCRIPTION", "1 1 1");
    addText("F2", 9, 345, y + 8, "QTY", "1 1 1");
    addText("F2", 9, 400, y + 8, "RATE", "1 1 1");
    addText("F2", 9, 480, y + 8, "AMOUNT", "1 1 1");

    y -= 20;
    const maxItemsToRender = Math.min(items.length, 16);
    for (let i = 0; i < maxItemsToRender; i++) {
        const item = items[i];
        const qty = Number(item.quantity || 1);
        const rate = Number(item.price || 0);
        const amount = Number(item.subtotal ?? rate * qty);
        const nameLines = wrapText(item.name || "Product", 42);

        if (i % 2 === 1) {
            addRect(42, y - 4, 511, 20, "0.98 0.97 0.95");
        }

        addText("F1", 9, 52, y + 2, String(i + 1));
        addText("F2", 9, 78, y + 2, nameLines[0] || "Product");
        addText("F1", 9, 350, y + 2, String(qty));
        addText("F1", 9, 400, y + 2, `Rs. ${rate.toLocaleString("en-IN")}`);
        addText("F2", 9, 480, y + 2, `Rs. ${amount.toLocaleString("en-IN")}`);

        addLine(42, y - 6, 553, y - 6);
        y -= 22;
    }

    if (items.length > maxItemsToRender) {
        addText("F1", 8.5, 52, y, `+ ${items.length - maxItemsToRender} additional item(s) included in order`, "0.45 0.48 0.52");
        y -= 18;
    }

    // Totals Box
    const totalsY = Math.max(120, y - 16);
    addRect(330, totalsY - 72, 223, 88, "0.965 0.945 0.918");
    addText("F1", 9.5, 344, totalsY, "Subtotal:");
    addText("F2", 9.5, 470, totalsY, `Rs. ${subtotalVal.toLocaleString("en-IN")}`);

    addText("F1", 9.5, 344, totalsY - 18, "Delivery Fee:");
    addText("F2", 9.5, 470, totalsY - 18, deliveryVal > 0 ? `Rs. ${deliveryVal.toLocaleString("en-IN")}` : "FREE");

    let offset = 36;
    if (discountVal > 0) {
        addText("F1", 9.5, 344, totalsY - 36, "Discount:", "0.114 0.369 0.294");
        addText("F2", 9.5, 470, totalsY - 36, `- Rs. ${discountVal.toLocaleString("en-IN")}`, "0.114 0.369 0.294");
        offset = 54;
    }

    addLine(342, totalsY - offset + 10, 540, totalsY - offset + 10, "0.75 0.72 0.68");
    addText("F2", 11, 344, totalsY - offset - 4, "Total Payable:", "0.08 0.11 0.15");
    addText("F2", 11, 470, totalsY - offset - 4, `Rs. ${finalVal.toLocaleString("en-IN")}`, "0.114 0.369 0.294");

    // Footer
    addLine(42, 68, 553, 68);
    addText("F2", 9, 42, 50, "Thank you for shopping with StudentMart!", "0.114 0.369 0.294");
    addText("F1", 8, 42, 36, "This is a computer-generated invoice and does not require a physical signature.", "0.45 0.48 0.52");

    const pdfBytes = buildPdfDocument(cmds);
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `StudentMart-Invoice-${String(orderId).replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
