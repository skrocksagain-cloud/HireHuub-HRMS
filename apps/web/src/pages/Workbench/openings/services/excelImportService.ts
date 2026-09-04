import type { RawOpeningImportData } from '../../../../types/Opening';
import ExcelJS from 'exceljs';

export interface IExcelImportService {
  parseExcelFile(file: File): Promise<RawOpeningImportData[]>;
}

export class ExcelImportService implements IExcelImportService {
  async parseExcelFile(file: File): Promise<RawOpeningImportData[]> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(await file.arrayBuffer());
    const worksheet = workbook.worksheets[0];
    if (!worksheet || worksheet.rowCount < 2) throw new Error('The workbook must contain a header row and at least one opening.');
    const headers: string[] = [];
    worksheet.getRow(1).eachCell({ includeEmpty: true }, (cell, columnNumber) => {
      headers[columnNumber - 1] = cell.text.trim();
    });
    if (headers.some((header) => !header)) throw new Error('Every import column must have a header.');
    const rows: RawOpeningImportData[] = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const values = headers.map((_, index) => row.getCell(index + 1).text.trim());
      if (values.every((value) => !value)) return;
      rows.push({ source: 'Excel', rawFields: Object.fromEntries(headers.map((header, index) => [header, values[index]])) });
    });
    if (!rows.length) throw new Error('The workbook contains no opening rows.');
    return rows;
  }
}

export const excelImportService = new ExcelImportService();
