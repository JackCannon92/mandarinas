// Dibuja el diseño del diploma sobre un documento PDFKit ya creado.
// Recibe el doc (en A4 horizontal) y los datos del diploma.
export function construirDiploma(doc, d) {
  const W = doc.page.width;
  const H = doc.page.height;

  // ── Bordes decorativos ──
  doc.lineWidth(3).strokeColor('#0d3b66')
     .rect(25, 25, W - 50, H - 50).stroke();
  doc.lineWidth(1).strokeColor('#c9a227')
     .rect(35, 35, W - 70, H - 70).stroke();

  // ── Encabezado de la institución ──
  doc.y = 70;
  doc.font('Helvetica-Bold').fontSize(14).fillColor('#333')
     .text('FACULTAD DE CIENCIAS DE LA ADMINISTRACIÓN — UNER', { align: 'center' });
  doc.font('Helvetica').fontSize(11).fillColor('#555')
     .text('Sistema de Inscripción a Cursos', { align: 'center' });

  // ── Título ──
  doc.moveDown(1.2);
  doc.font('Helvetica-Bold').fontSize(46).fillColor('#0d3b66')
     .text('DIPLOMA', { align: 'center' });

  // ── Cuerpo ──
  doc.moveDown(0.8);
  doc.font('Helvetica').fontSize(14).fillColor('#333')
     .text('Se certifica que', { align: 'center' });

  doc.moveDown(0.5);
  doc.font('Helvetica-Bold').fontSize(26).fillColor('#111')
     .text(d.estudiante || '', { align: 'center' });

  doc.moveDown(0.2);
  doc.font('Helvetica').fontSize(12).fillColor('#555')
     .text(`Documento: ${d.documento ?? '—'}`, { align: 'center' });

  doc.moveDown(0.7);
  doc.font('Helvetica').fontSize(14).fillColor('#333')
     .text('ha completado satisfactoriamente el curso', { align: 'center' });

  doc.moveDown(0.5);
  doc.font('Helvetica-Bold').fontSize(20).fillColor('#0d3b66')
     .text(d.curso || '', { align: 'center' });

  const detalle = [
    d.cantidad_horas ? `Carga horaria: ${d.cantidad_horas} horas` : null,
    d.fecha_inicio ? `Inicio: ${d.fecha_inicio}` : null,
  ].filter(Boolean).join('     ·     ');

  if (detalle) {
    doc.moveDown(0.4);
    doc.font('Helvetica').fontSize(12).fillColor('#555')
       .text(detalle, { align: 'center' });
  }

  // ── Pie: fecha de emisión y firma ──
  doc.y = H - 150;
  doc.font('Helvetica').fontSize(11).fillColor('#333')
     .text(`Emitido el ${d.fecha_emision}`, { align: 'center' });

  doc.moveDown(2.2);
  const lineW = 220;
  const x1 = (W - lineW) / 2;
  const yLine = doc.y;
  doc.moveTo(x1, yLine).lineTo(x1 + lineW, yLine)
     .lineWidth(1).strokeColor('#333').stroke();
  doc.font('Helvetica').fontSize(10).fillColor('#555')
     .text('Firma y sello', x1, yLine + 5, { width: lineW, align: 'center' });
}
