import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import QRCode from 'qrcode';
import { NAME_BOX_X, NAME_BOX_WIDTH, NAME_Y, QR_X, QR_Y, QR_SIZE, A4_WIDTH, A4_HEIGHT } from './constants';

/**
 * Generate and download/print a badge PDF
 */
export async function generateBadge({ name, id, template, useBlankBackground, useA4 }) {
  let pdfDoc;

  if (useBlankBackground) {
    const templateUrl = `/template_${template}.pdf`;
    const templateResponse = await fetch(templateUrl);
    const templatePdfBytes = await templateResponse.arrayBuffer();
    const tempDoc = await PDFDocument.load(templatePdfBytes);
    const tempPage = tempDoc.getPages()[0];
    const { width, height } = tempPage.getSize();
    
    pdfDoc = await PDFDocument.create();
    pdfDoc.addPage([width, height]);
  } else {
    const templateUrl = `/template_${template}.pdf`;
    const templateResponse = await fetch(templateUrl);
    const templatePdfBytes = await templateResponse.arrayBuffer();
    pdfDoc = await PDFDocument.load(templatePdfBytes);
  }

  // Load and embed font
  let font;
  try {
    const fontResponse = await fetch('/BebasNeue-Regular.ttf');
    if (!fontResponse.ok) throw new Error('Font not found');
    
    const fontBytes = await fontResponse.arrayBuffer();
    
    pdfDoc.registerFontkit(fontkit);
    
    font = await pdfDoc.embedFont(fontBytes, { subset: true });
  } catch (err) {
    font = await pdfDoc.embedFont('Helvetica-Bold');
  }

  const pages = pdfDoc.getPages();
  const firstPage = pages[0];

  // Draw name
  const nameCenterX = NAME_BOX_X + (NAME_BOX_WIDTH / 2);
  const fontSize = 24;

  const textWidth = font.widthOfTextAtSize(name, fontSize);
  const textX = nameCenterX - (textWidth / 2);

  firstPage.drawText(name, {
    x: textX,
    y: NAME_Y,
    size: fontSize,
    font: font,
    color: rgb(0, 0, 0),
  });

  // Generate and embed QR code
  const qrCodeDataUrl = await QRCode.toDataURL(id.toString(), {
    width: QR_SIZE * 2,
    margin: 1,
  });

  const qrCodeBase64 = qrCodeDataUrl.split(',')[1];
  const qrCodeBytes = Uint8Array.from(atob(qrCodeBase64), c => c.charCodeAt(0));

  const qrImage = await pdfDoc.embedPng(qrCodeBytes);

  firstPage.drawImage(qrImage, {
    x: QR_X,
    y: QR_Y,
    width: QR_SIZE,
    height: QR_SIZE,
  });

  // Handle A4 printing if enabled
  if (useA4) {
    const templatePage = firstPage;
    const templateSize = templatePage.getSize();
    
    // Create a new PDF document with A4 size
    const a4PdfDoc = await PDFDocument.create();
    const a4Page = a4PdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
    
    // Embed the current page as a form object
    const [embeddedPage] = await a4PdfDoc.embedPdf(await pdfDoc.save(), [0]);
    
    // Calculate position: center horizontally, align to top
    const xOffset = (A4_WIDTH - templateSize.width) / 2;
    const yOffset = A4_HEIGHT - templateSize.height;
    
    // Draw the embedded page on the A4 page
    a4Page.drawPage(embeddedPage, {
      x: xOffset,
      y: yOffset,
      width: templateSize.width,
      height: templateSize.height,
    });
    
    // Replace the original PDF doc with the A4 one
    pdfDoc = a4PdfDoc;
  }

  const pdfBytes = await pdfDoc.save();

  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  
  const printWindow = window.open(url, '_blank');
  
  if (printWindow) {
    printWindow.onload = () => {
      printWindow.print();
    };
    
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
    }, 1000);
  } else {
    const a = document.createElement('a');
    a.href = url;
    a.download = `badge_${name.replace(/\s+/g, '_')}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
}
