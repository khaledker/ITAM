const PDFDocument = require('pdfkit');

/**
 * Generates a PDF ticket for a given movement.
 * @param {Object} movement - The movement object retrieved from the database.
 * @param {stream.Writable} outStream - The output stream (e.g., HTTP response) to write the PDF to.
 */
const generateMovementTicket = (movement, outStream) => {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  // Pipe the PDF directly to the output stream
  doc.pipe(outStream);

  // Helper to format date
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR'); // Format DD/MM/YYYY
  };

  // Header
  doc
    .fontSize(20)
    .font('Helvetica-Bold')
    .text('Djezzy ITAM - Asset Movement Ticket', { align: 'center' })
    .moveDown(0.5);

  const ticketRef = `TKT-${movement.type.substring(0, 3).toUpperCase()}-${String(movement.id).padStart(4, '0')}`;

  doc
    .fontSize(10)
    .font('Helvetica')
    .text(`Reference: ${ticketRef}`, { align: 'right' })
    .text(`Date: ${formatDate(movement.date)}`, { align: 'right' })
    .text(`Status: ${movement.status}`, { align: 'right' })
    .moveDown(1);

  // Movement Details
  doc
    .fontSize(14)
    .font('Helvetica-Bold')
    .text('Movement Details')
    .moveTo(50, doc.y).lineTo(545, doc.y).stroke()
    .moveDown(0.5);

  doc
    .fontSize(10)
    .font('Helvetica')
    .text(`Type: ${movement.type}`)
    .text(`Performed By: ${movement.performed_by_name}`)
    .moveDown(0.5);

  // Type specific details
  if (movement.type === 'Reception') {
    doc.text(`Supplier: ${movement.supplier_name || movement.supplier_id || 'N/A'}`);
    doc.text(`Destination Location: ${movement.reception_dest_name || movement.destination_id || 'N/A'}`);
    doc.text(`Purchase Order: ${movement.purchase_order_number || 'N/A'}`);
    doc.text(`Receipt Number: ${movement.receipt_number || 'N/A'}`);
  } else if (movement.type === 'Assignment') {
    doc.text(`Assigned To: ${movement.assigned_to_name || movement.assigned_to || 'N/A'}`);
    if (movement.assignment_source_name) doc.text(`Source Location: ${movement.assignment_source_name}`);
    doc.text(`Expected Return: ${formatDate(movement.expected_return)}`);
  } else if (movement.type === 'Transfer') {
    doc.text(`Source Location: ${movement.transfer_source_name || movement.transfer_source_id || 'N/A'}`);
    doc.text(`Destination Location: ${movement.transfer_dest_name || movement.transfer_dest_id || 'N/A'}`);
    doc.text(`Reference: ${movement.reference || 'N/A'}`);
  } else if (movement.type === 'Return') {
    doc.text(`Returned To Location: ${movement.returned_to_name || movement.returned_to || 'N/A'}`);
    doc.text(`Reason: ${movement.reason || 'N/A'}`);
  }

  doc.moveDown(1.5);

  // Assets List
  doc
    .fontSize(14)
    .font('Helvetica-Bold')
    .text('Concerned Assets')
    .moveTo(50, doc.y).lineTo(545, doc.y).stroke()
    .moveDown(0.5);

  const assetIds = movement.asset_ids ? movement.asset_ids.split(',') : [];
  const serials = movement.serial_numbers ? movement.serial_numbers.split(',') : [];
  const tags = movement.tag ? movement.tag.split(',') : []; // tag column in findById is GROUP_CONCAT(a.tag) AS tag

  if (assetIds.length === 0) {
    doc.fontSize(10).font('Helvetica').text('No assets listed in this movement.');
  } else {
    // Simple table header
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Asset Tag', 50, doc.y, { continued: true, width: 150 });
    doc.text('Serial Number', 200, doc.y);
    doc.moveDown(0.2);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.5);

    doc.font('Helvetica');
    for (let i = 0; i < assetIds.length; i++) {
      const tag = tags[i] || 'N/A';
      const serial = serials[i] || 'N/A';
      const startY = doc.y;
      
      doc.text(tag, 50, startY, { continued: false, width: 140 });
      doc.text(serial, 200, startY);
      doc.moveDown(0.2);
    }
  }

  doc.moveDown(3);

  // Signatures
  doc
    .fontSize(14)
    .font('Helvetica-Bold')
    .text('Signatures', 50, doc.y)
    .moveTo(50, doc.y).lineTo(545, doc.y).stroke()
    .moveDown(1);

  doc.fontSize(10).font('Helvetica');
  doc.text('IT Department', 50, doc.y, { continued: true });
  
  if (movement.type === 'Assignment' || movement.type === 'Return') {
    doc.text('Employee', 300, doc.y);
  } else if (movement.type === 'Transfer') {
    doc.text('Destination Manager', 300, doc.y);
  } else if (movement.type === 'Reception') {
    doc.text('Supplier / Deliverer', 300, doc.y);
  }

  // Finalize PDF file
  doc.end();
};

module.exports = {
  generateMovementTicket
};
