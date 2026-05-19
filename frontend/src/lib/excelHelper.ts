export const exportToExcel = (sheets: { name: string; data: any[] }[], filename: string) => {
  if (sheets.length === 0) return;

  let xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Header">
   <Font ss:Bold="1" ss:Color="#0F172A"/>
   <Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/>
  </Style>
 </Styles>`;

  for (const sheet of sheets) {
    if (sheet.data.length === 0) continue;
    const headers = Object.keys(sheet.data[0]);

    // Excel sheet name limits to 31 chars and cannot contain: \ / ? * [ ]
    let safeName = sheet.name.replace(/[\\/?*\[\]]/g, '').substring(0, 31) || 'Sheet';

    // Calculate optimal column widths based on maximum content length (headers + data cells)
    const colWidths = headers.map(header => {
      let maxLen = header.length;
      for (const row of sheet.data) {
        const val = row[header] === null || row[header] === undefined ? '' : String(row[header]);
        if (val.length > maxLen) {
          maxLen = val.length;
        }
      }
      // Estimate width in points: 1 char ~ 8.5 points, with safety limits (min 60pt, max 350pt)
      return Math.min(350, Math.max(60, maxLen * 8.5));
    });

    xml += `\n <Worksheet ss:Name="${safeName}">\n  <Table>`;
    for (const w of colWidths) {
      xml += `\n   <Column ss:Width="${w}"/>`;
    }
    
    // Header Row
    xml += `\n   <Row ss:StyleID="Header">`;
    for (const header of headers) {
      xml += `\n    <Cell><Data ss:Type="String">${escapeXml(header)}</Data></Cell>`;
    }
    xml += `\n   </Row>`;

    // Data Rows
    for (const row of sheet.data) {
      xml += `\n   <Row>`;
      for (const header of headers) {
        const val = row[header] === null || row[header] === undefined ? '' : row[header];
        xml += `\n    <Cell><Data ss:Type="String">${escapeXml(String(val))}</Data></Cell>`;
      }
      xml += `\n   </Row>`;
    }

    xml += `\n  </Table>\n </Worksheet>`;
  }

  xml += `\n</Workbook>`;

  const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.xls`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

const escapeXml = (unsafe: string): string => {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
};
