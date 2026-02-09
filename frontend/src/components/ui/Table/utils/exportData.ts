import type { Column } from '../Table';

export type ExportFormat = 'csv' | 'json' | 'excel';

export const exportToCSV = <T extends Record<string, unknown>>(
  data: T[],
  columns: Column<T>[],
  filename: string = 'export'
) => {
  // Créer les en-têtes
  const headers = columns.map((col) => {
    if (typeof col.header === 'string') return col.header;
    return col.key;
  });

  // Créer les lignes
  const rows = data.map((item) =>
    columns.map((col) => {
      const value = item[col.key];
      if (value === null || value === undefined) return '';
      // Échapper les guillemets et entourer de guillemets si nécessaire
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    })
  );

  // Combiner en-têtes et lignes
  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

  // Télécharger le fichier
  downloadFile(csvContent, `${filename}.csv`, 'text/csv;charset=utf-8;');
};

export const exportToJSON = <T extends Record<string, unknown>>(
  data: T[],
  filename: string = 'export'
) => {
  const jsonContent = JSON.stringify(data, null, 2);
  downloadFile(jsonContent, `${filename}.json`, 'application/json;charset=utf-8;');
};

export const exportToExcel = <T extends Record<string, unknown>>(
  data: T[],
  columns: Column<T>[],
  filename: string = 'export'
) => {
  // Créer un format Excel XML simplifié
  const headers = columns.map((col) => {
    if (typeof col.header === 'string') return col.header;
    return col.key;
  });

  let excelContent = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="Sheet1">
  <Table>
   <Row>`;

  // En-têtes
  headers.forEach((header) => {
    excelContent += `<Cell><Data ss:Type="String">${escapeXML(String(header))}</Data></Cell>`;
  });
  excelContent += '</Row>';

  // Données
  data.forEach((item) => {
    excelContent += '<Row>';
    columns.forEach((col) => {
      const value = item[col.key];
      const stringValue = value === null || value === undefined ? '' : String(value);
      const type = typeof value === 'number' ? 'Number' : 'String';
      excelContent += `<Cell><Data ss:Type="${type}">${escapeXML(stringValue)}</Data></Cell>`;
    });
    excelContent += '</Row>';
  });

  excelContent += `
  </Table>
 </Worksheet>
</Workbook>`;

  downloadFile(excelContent, `${filename}.xls`, 'application/vnd.ms-excel');
};

const escapeXML = (str: string): string => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
