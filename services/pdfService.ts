import type { Employee, Applicant, EvaluationResult } from '../types';

// Declara las variables globales inyectadas por los scripts de CDN
declare const jspdf: any;
declare const html2canvas: any;

export const generateEvaluationPDF = async (
  person: Employee | Applicant,
  result: EvaluationResult
): Promise<void> => {
  const { jsPDF } = jspdf;
  const reportElement = document.getElementById('evaluation-report');

  if (!reportElement) {
    console.error('Elemento del reporte no encontrado para la generación del PDF.');
    alert('Error: No se pudo encontrar el contenido para generar el PDF.');
    return;
  }

  // Aplica estilos de impresión antes de renderizar
  reportElement.classList.add('pdf-generation-mode');

  try {
    const canvas = await html2canvas(reportElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        ignoreElements: (element) => element.classList.contains('pdf-hide'),
        backgroundColor: '#ffffff' // Fondo blanco explícito
    });

    const imgData = canvas.toDataURL('image/png');
    
    const imgWidth = 210; // Ancho A4 en mm
    const pageHeight = 297; // Alto A4 en mm
    const imgHeight = canvas.height * imgWidth / canvas.width;
    let heightLeft = imgHeight;

    const doc = new jsPDF('p', 'mm', 'a4');
    let position = 0;

    doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      doc.addPage();
      doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    const safeFileName = person.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    doc.save(`evaluacion_${safeFileName}.pdf`);

  } catch (error) {
    console.error("Error al generar el PDF:", error);
    alert('Ocurrió un error al intentar generar el PDF. Por favor, inténtelo de nuevo.');
  } finally {
    // Siempre elimina la clase de estilos de impresión
    reportElement.classList.remove('pdf-generation-mode');
  }
};

export const generateComparisonPDF = async (fileName: string): Promise<void> => {
  const { jsPDF } = jspdf;
  const reportElement = document.getElementById('comparison-report');

  if (!reportElement) {
    console.error('Elemento de comparación no encontrado para la generación del PDF.');
    alert('Error: No se pudo encontrar el contenido para generar el PDF.');
    return;
  }

  // Aplica estilos de impresión antes de renderizar
  reportElement.classList.add('pdf-generation-mode');

  try {
    const canvas = await html2canvas(reportElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        ignoreElements: (element) => element.classList.contains('pdf-hide'),
        backgroundColor: '#ffffff' // Fondo blanco explícito
    });

    const imgData = canvas.toDataURL('image/png');

    const pdfWidth = 420; // A2 width in mm (landscape A3)
    const pdfHeight = 297; // A2 height in mm (landscape A3)
    const imgHeight = canvas.height * pdfWidth / canvas.width;
    let heightLeft = imgHeight;

    const doc = new jsPDF('l', 'mm', 'a3'); // Usando A3 horizontal, que es más común y manejable que A2
    let position = 0;

    doc.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
    heightLeft -= pdfHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      doc.addPage();
      doc.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;
    }
    
    // Usar el nombre de archivo fijo solicitado
    doc.save('Comparacion de perfiles.pdf');

  } catch (error) {
    console.error("Error al generar el PDF de comparación:", error);
    alert('Ocurrió un error al intentar generar el PDF. Por favor, inténtelo de nuevo.');
  } finally {
    // Siempre elimina la clase de estilos de impresión
    reportElement.classList.remove('pdf-generation-mode');
  }
};