import { ARCHIVE_HEADERS, archiveValues, type ArchiveRow } from "./archive";

export async function archiveExcel(rows: ArchiveRow[], labels: Record<string,string>) {
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "SISTA AI";
  const sheet = workbook.addWorksheet("Arsip Surat", { views: [{ state: "frozen", ySplit: 1 }] });
  sheet.addRow(ARCHIVE_HEADERS);
  rows.forEach(r => sheet.addRow(archiveValues(r,labels)));
  sheet.columns.forEach((col,i) => { col.width = [48,32,22,20,28,32,42,32,35,18,22,22][i] ?? 22; });
  sheet.eachRow(row => {
    row.height = 32;
    row.eachCell(cell => { cell.font = { name: "Arial", size: 11 }; cell.alignment = { vertical: "middle", wrapText: true }; });
  });
  sheet.getRow(1).height = 36;
  sheet.getRow(1).eachCell(cell => { cell.font = { name: "Arial", size: 11, bold: true }; });
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: Math.max(1,rows.length + 1), column: ARCHIVE_HEADERS.length } };
  const bytes = await workbook.xlsx.writeBuffer();
  return new Blob([new Uint8Array(bytes)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}