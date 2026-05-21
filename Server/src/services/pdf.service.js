const PDFDocument = require('pdfkit');

// ── Constants ────────────────────────────────────────────────────────────
const ORANGE = '#E8971E';
const DARK   = '#222222';
const GRAY   = '#666666';
const LIGHT  = '#F5F5F5';
const WHITE  = '#FFFFFF';
const LEFT   = 40;
const RIGHT  = 555;
const WIDTH  = RIGHT - LEFT;

const TITLES = {
  Reception:  { fr: 'Bon de Réception Matériel Informatique', en: 'IT Reception Form' },
  Assignment: { fr: 'Bon de Livraison Matériel Informatique', en: 'IT Delivery Form' },
  Transfer:   { fr: 'Bon de Transfert Externe',               en: 'External Transfer Form' },
  Return:     { fr: 'Bon de Retour Matériel Informatique',     en: 'IT Return Form' },
};

// ── Helpers ──────────────────────────────────────────────────────────────
const fmt = (d) => {
  if (!d) return 'N/A';
  const dt = new Date(d);
  const dd = String(dt.getDate()).padStart(2, '0');
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const yy = dt.getFullYear();
  const hh = String(dt.getHours()).padStart(2, '0');
  const mi = String(dt.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yy} ${hh}:${mi}`;
};

const split = (v) => v ? v.split('||').map(s => s.trim()) : [];

/** Draw a fake Code-128-style barcode visual */
function drawBarcode(doc, x, y, w, h) {
  const bars = [];
  let pos = 0;
  // Generate pseudo-random bar pattern
  const seed = [3,1,2,1,3,2,1,1,2,3,1,2,1,1,3,1,2,1,2,1,3,1,1,2,1,3,2,1,1,2,3,1,2,1,3,1,2,2,1,1];
  for (const b of seed) { bars.push(b); pos += b; }
  const scale = w / pos;
  let cx = x;
  bars.forEach((b, i) => {
    if (i % 2 === 0) doc.rect(cx, y, b * scale, h).fill(DARK);
    cx += b * scale;
  });
}

/** Draw an orange section banner */
function sectionBanner(doc, text, x, y, w) {
  const h = 22;
  doc.lineWidth(1).roundedRect(x, y, w, h, 4).fillAndStroke(ORANGE, DARK);
  doc.fill(WHITE).fontSize(10).font('Helvetica-Bold').text(text, x, y + 5, { width: w, align: 'center' });
  doc.fill(DARK);
  return y + h + 8;
}

/** Draw a label: value pair */
function labelValue(doc, label, value, x, y, labelW, valueW) {
  doc.font('Helvetica').fontSize(8).fill(GRAY).text(label, x, y, { width: labelW });
  doc.font('Helvetica-Bold').fontSize(9).fill(DARK).text(value || 'N/A', x + labelW, y, { width: valueW });
}

/** Draw dual signature boxes at current Y */
function drawSignatureBoxes(doc, leftTitle, leftName, rightTitle, rightName) {
  let y = doc.y;
  // Check page space — need ~120pt for signatures
  if (y > 680) { doc.addPage(); y = 50; }

  const boxW = WIDTH / 2 - 8;
  const boxH = 110;

  // Left header
  doc.lineWidth(1).roundedRect(LEFT, y, boxW, 22, 4).fillAndStroke(ORANGE, DARK);
  doc.fill(WHITE).fontSize(10).font('Helvetica-Bold')
    .text(leftTitle, LEFT, y + 5, { width: boxW, align: 'center' });

  // Right header
  doc.lineWidth(1).roundedRect(LEFT + boxW + 16, y, boxW, 22, 4).fillAndStroke(ORANGE, DARK);
  doc.fill(WHITE).fontSize(10).font('Helvetica-Bold')
    .text(rightTitle, LEFT + boxW + 16, y + 5, { width: boxW, align: 'center' });

  doc.fill(DARK);
  y += 26;

  // Left box
  doc.lineWidth(1).rect(LEFT, y, boxW, boxH).stroke(DARK);
  doc.font('Helvetica').fontSize(8).fill(GRAY);
  doc.text('Nom Complet', LEFT + 8, y + 8);
  doc.font('Helvetica-Bold').fontSize(9).fill(DARK).text(leftName || '', LEFT + 80, y + 8, { width: boxW - 90 });
  doc.font('Helvetica').fontSize(8).fill(GRAY).text('Date', LEFT + 8, y + 30);
  doc.font('Helvetica').fontSize(8).fill(GRAY).text('Signature', LEFT + 8, y + 55);

  // Right box
  const rx = LEFT + boxW + 16;
  doc.lineWidth(1).rect(rx, y, boxW, boxH).stroke(DARK);
  doc.font('Helvetica').fontSize(8).fill(GRAY);
  doc.text('Nom Complet', rx + 8, y + 8);
  doc.font('Helvetica-Bold').fontSize(9).fill(DARK).text(rightName || '', rx + 80, y + 8, { width: boxW - 90 });
  doc.font('Helvetica').fontSize(8).fill(GRAY).text('Date', rx + 8, y + 30);
  doc.font('Helvetica').fontSize(8).fill(GRAY).text('Signature', rx + 8, y + 55);

  doc.y = y + boxH + 10;
}

// ── Asset Table (optimized for bulk) ──────────────────────────────
function drawAssetTable(doc, assets, startY) {
  const colX = [LEFT, LEFT + 120, LEFT + 380];
  const colW = [120, 260, 135];
  const headers = ['Marque', 'Modèle', 'Quantité'];
  const ROW_H = 14;
  const HDR_H = 18;
  const PAGE_BOTTOM = 700; // leave room for signatures

  let y = startY;

  const drawHeader = (yy) => {
    doc.lineWidth(1).rect(LEFT, yy, WIDTH, HDR_H).fillAndStroke('#E0E0E0', DARK);
    doc.fill(DARK).font('Helvetica-Bold').fontSize(8);
    headers.forEach((h, i) => doc.text(h, colX[i] + 4, yy + 5, { width: colW[i] }));
    return yy + HDR_H;
  };

  y = drawHeader(y);

  // Group by category, then by model
  const categories = {};
  assets.forEach(a => {
    const cat = a.category || 'Other';
    if (!categories[cat]) categories[cat] = {};
    const modelKey = `${a.brand}||${a.model}`;
    if (!categories[cat][modelKey]) {
      categories[cat][modelKey] = { brand: a.brand, model: a.model, qty: 0 };
    }
    categories[cat][modelKey].qty++;
  });

  doc.font('Helvetica').fontSize(8);

  let totalQty = 0;

  for (const [cat, models] of Object.entries(categories)) {
    if (y + ROW_H > PAGE_BOTTOM) { doc.addPage(); y = 50; y = drawHeader(y); }
    doc.rect(LEFT, y, WIDTH, ROW_H).fill(LIGHT);
    doc.fill(DARK).font('Helvetica-Bold').fontSize(8).text(cat.toUpperCase(), LEFT + 4, y + 3);
    y += ROW_H;
    doc.font('Helvetica').fontSize(8);

    for (const m of Object.values(models)) {
      if (y + ROW_H > PAGE_BOTTOM) { doc.addPage(); y = 50; y = drawHeader(y); }

      doc.lineWidth(1).rect(LEFT, y, WIDTH, ROW_H).fillAndStroke(WHITE, DARK);
      doc.fill(DARK);
      doc.text(m.brand || '—', colX[0] + 4, y + 3, { width: colW[0] - 8 });
      doc.text(m.model || '—', colX[1] + 4, y + 3, { width: colW[1] - 8 });
      doc.font('Helvetica-Bold').text(String(m.qty), colX[2] + 4, y + 3, { width: colW[2] - 8 });
      doc.font('Helvetica');
      y += ROW_H;
      totalQty += m.qty;
    }
  }

  // Quantity line
  y += 5;
  doc.font('Helvetica-Bold').fontSize(10).fill(DARK);
  doc.text(`Quantité Totale:  ${totalQty} équipements`, LEFT, y);
  doc.y = y + 25;
}

// ── Main Generator ──────────────────────────────────────────────────────
const generateMovementTicket = (movement, outStream) => {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  doc.pipe(outStream);

  const titleInfo = TITLES[movement.type] || TITLES.Reception;
  const ticketRef = `TKT-${movement.type.substring(0, 3).toUpperCase()}-${String(movement.id).padStart(4, '0')}`;

  // Parse assets
  const tags       = split(movement.tag);
  const serials    = split(movement.serial_numbers);
  const brands     = split(movement.brands);
  const modelNames = split(movement.model_names);
  const cats       = split(movement.categories);
  const assetCount = Math.max(tags.length, serials.length);

  const assets = [];
  for (let i = 0; i < assetCount; i++) {
    assets.push({
      brand:    brands[i]     || '',
      model:    modelNames[i] || '',
      serial:   serials[i]    || '',
      tag:      tags[i]       || '',
      category: cats[i]       || 'Other',
    });
  }

  // Calculate total pages (roughly: ~35 asset rows per page in asset section)
  const assetPages = Math.max(1, Math.ceil(assetCount / 35));
  const totalPages = assetPages;
  let currentPage = 1;

  // ── Page Header ────────────────────────────────────────
  const drawPageHeader = () => {
    // Title banner
    doc.lineWidth(1).roundedRect(LEFT, 30, 340, 50, 6).fillAndStroke(ORANGE, DARK);
    doc.fill(WHITE).font('Helvetica-Bold');
    doc.fontSize(13).text(titleInfo.fr, LEFT + 15, 38, { width: 310 });
    doc.fontSize(10).text(titleInfo.en, LEFT + 15, 56, { width: 310 });

    // Barcode
    drawBarcode(doc, 400, 30, 140, 50);

    // Meta line
    doc.fill(DARK).font('Helvetica').fontSize(8);
    const metaY = 88;
    drawBarcode(doc, LEFT, metaY, 50, 16);
    doc.font('Helvetica').fontSize(7).fill(GRAY).text('Imprimé par:', LEFT + 58, metaY + 3);
    doc.font('Helvetica-Bold').fontSize(8).fill(DARK).text(movement.performed_by_name || 'System', LEFT + 102, metaY + 3);
    doc.font('Helvetica').fontSize(7).fill(GRAY).text('Date/Heure:', 260, metaY + 3);
    doc.font('Helvetica-Bold').fontSize(8).fill(DARK).text(fmt(movement.date), 310, metaY + 3);
    doc.font('Helvetica').fontSize(7).fill(GRAY).text('Page', 460, metaY + 3);
    doc.font('Helvetica-Bold').fontSize(8).fill(DARK).text(`${currentPage}/${totalPages}`, 482, metaY + 3);
    doc.font('Helvetica').fontSize(7).fill(GRAY).text(`Réf: ${ticketRef}`, 510, metaY + 3);

    return metaY + 24;
  };

  let y = drawPageHeader();

  // ── Type-specific info sections ────────────────────────
  if (movement.type === 'Assignment') {
    // Employee info
    y = sectionBanner(doc, "Informations sur l'employé", LEFT + 30, y, WIDTH - 60);
    doc.lineWidth(1).rect(LEFT, y, WIDTH, 55).stroke(DARK);
    labelValue(doc, 'Nom:',   movement.assigned_to_name, LEFT + 8, y + 5, 70, 170);
    labelValue(doc, 'Source:', movement.assignment_source_name, LEFT + 8, y + 20, 70, 170);
    labelValue(doc, 'Retour:', movement.expected_return ? fmt(movement.expected_return).split(' ')[0] : 'N/A', LEFT + 8, y + 35, 70, 170);
    y += 63;

    // Manager info
    y = sectionBanner(doc, 'Informations sur le responsable', LEFT + 30, y, WIDTH - 60);
    doc.lineWidth(1).rect(LEFT, y, WIDTH, 25).stroke(DARK);
    labelValue(doc, 'Nom:', movement.performed_by_name, LEFT + 8, y + 7, 70, 200);
    y += 33;
  }

  if (movement.type === 'Reception') {
    // Supplier info
    y = sectionBanner(doc, 'Informations Fournisseur', LEFT + 30, y, WIDTH - 60);
    doc.lineWidth(1).rect(LEFT, y, WIDTH, 55).stroke(DARK);
    labelValue(doc, 'Fournisseur:', movement.supplier_name, LEFT + 8, y + 5, 80, 170);
    labelValue(doc, 'N° Commande:', movement.purchase_order_number, LEFT + 8, y + 20, 80, 170);
    labelValue(doc, 'N° Réception:', movement.receipt_number, LEFT + 8, y + 35, 80, 170);
    labelValue(doc, 'Destination:', movement.reception_dest_name, 300, y + 5, 70, 170);
    y += 63;
  }

  if (movement.type === 'Transfer') {
    // Side-by-side source/destination
    const boxW = WIDTH / 2 - 8;
    y = sectionBanner(doc, 'Expéditeur', LEFT, y, boxW);
    const rightBannerY = y - 30;
    sectionBanner(doc, 'Destinataire', LEFT + boxW + 16, rightBannerY, boxW);

    const boxH = 50;
    doc.lineWidth(1).rect(LEFT, y, boxW, boxH).stroke(DARK);
    labelValue(doc, 'Entrepôt:', movement.transfer_source_name, LEFT + 8, y + 8, 60, boxW - 78);
    labelValue(doc, 'Référence:', movement.reference, LEFT + 8, y + 26, 60, boxW - 78);

    const rx = LEFT + boxW + 16;
    doc.lineWidth(1).rect(rx, y, boxW, boxH).stroke(DARK);
    labelValue(doc, 'Entrepôt:', movement.transfer_dest_name, rx + 8, y + 8, 60, boxW - 78);
    y += boxH + 8;
  }

  if (movement.type === 'Return') {
    y = sectionBanner(doc, 'Informations Retour', LEFT + 30, y, WIDTH - 60);
    doc.lineWidth(1).rect(LEFT, y, WIDTH, 40).stroke(DARK);
    labelValue(doc, 'Destination:', movement.returned_to_name, LEFT + 8, y + 5, 80, 200);
    labelValue(doc, 'Motif:', movement.reason, LEFT + 8, y + 20, 80, 200);
    y += 48;
  }

  // ── Asset Table ────────────────────────────────────────
  drawAssetTable(doc, assets, y);

  // ── Signature Boxes ────────────────────────────────────
  if (movement.type === 'Assignment') {
    drawSignatureBoxes(doc,
      'Expéditeur', movement.performed_by_name,
      'Destinataire', movement.assigned_to_name
    );
  } else if (movement.type === 'Transfer') {
    drawSignatureBoxes(doc,
      'Expéditeur', movement.performed_by_name,
      'Destinataire', ''
    );
  } else if (movement.type === 'Reception') {
    drawSignatureBoxes(doc,
      'Expéditeur', movement.supplier_name,
      'Destinataire', movement.performed_by_name
    );
  } else {
    drawSignatureBoxes(doc,
      'Expéditeur', movement.performed_by_name,
      'Destinataire', ''
    );
  }

  // ── Footer barcode ─────────────────────────────────────
  const fy = Math.min(doc.y + 5, 780);
  drawBarcode(doc, LEFT, fy, 80, 20);

  doc.end();
};

module.exports = { generateMovementTicket };
