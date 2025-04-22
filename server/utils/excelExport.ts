import ExcelJS from 'exceljs';

export async function exportToExcel(data: any[], filename: string): Promise<Buffer> {
  // Create a new workbook and worksheet
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Data');
  
  if (data.length === 0) {
    worksheet.addRow(['No data available']);
    return await workbook.xlsx.writeBuffer() as Buffer;
  }
  
  // Extract headers from the first object
  const headers = Object.keys(data[0]);
  
  // Format headers for better readability (convert camelCase to Title Case)
  const formattedHeaders = headers.map(header => {
    // Replace camelCase with spaces
    const formatted = header.replace(/([A-Z])/g, ' $1')
                           .replace(/^./, str => str.toUpperCase());
    return formatted;
  });
  
  // Add headers to worksheet
  worksheet.addRow(formattedHeaders);
  
  // Style header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E40AF' } // primary-600 color
  };
  worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };
  
  // Add data rows
  data.forEach(item => {
    const rowData = headers.map(header => {
      const value = item[header];
      
      // Format dates nicely if they appear to be date objects or strings
      if (value instanceof Date) {
        return value.toLocaleString();
      } else if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
        return new Date(value).toLocaleString();
      } else if (typeof value === 'object' && value !== null) {
        return JSON.stringify(value);
      }
      
      return value;
    });
    
    worksheet.addRow(rowData);
  });
  
  // Auto-fit columns
  worksheet.columns.forEach(column => {
    let maxLength = 0;
    column.eachCell({ includeEmpty: true }, cell => {
      const columnLength = cell.value ? cell.value.toString().length : 10;
      if (columnLength > maxLength) {
        maxLength = columnLength;
      }
    });
    column.width = Math.min(maxLength + 2, 50); // Set width with a maximum of 50
  });
  
  // Set borders
  worksheet.eachRow({ includeEmpty: true }, row => {
    row.eachCell({ includeEmpty: true }, cell => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  });
  
  // Alternate row colors for better readability
  worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
    if (rowNumber > 1 && rowNumber % 2 === 0) {
      row.eachCell({ includeEmpty: true }, cell => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF9FAFB' } // light gray
        };
      });
    }
  });
  
  // Generate buffer
  return await workbook.xlsx.writeBuffer() as Buffer;
}
