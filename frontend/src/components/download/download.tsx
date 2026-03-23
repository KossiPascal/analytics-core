import { RefObject } from "react";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { ChartRenderDataProp, ExecuteChartResponse } from "@/models/dataset.models";

// ---------------- IMAGE ----------------
export const exportImage = async (element: HTMLElement, format = "png", filename?: string) => {
    const canvas = await html2canvas(element, { backgroundColor: "#ffffff", scale: 2 });
    const link = document.createElement("a");

    link.download = `${filename || "chart"}.${format}`;
    link.href = canvas.toDataURL(`image/${format}`);
    link.click();
};

// ---------------- PDF ----------------
export const exportPDF = async (element: HTMLElement, orientation: "portrait" | "landscape" = "landscape", filename?: string) => {

    const canvas = await html2canvas(element, { scale: 2 });
    const img = canvas.toDataURL("image/png");

    const pdf = new jsPDF({ orientation, unit: "mm" });

    // const width = orientation === "landscape" ? 297 : 210;
    // const height = orientation === "landscape" ? 210 : 297;
    // pdf.addImage(img, "PNG", 0, 0, width, height);

    const imgProps = pdf.getImageProperties(img);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(img, "PNG", 0, 0, pdfWidth, pdfHeight);

    pdf.save(`${filename || "chart"}.pdf`);
};

export const exportDashboardPDF = async (elements: HTMLElement[]) => {
    const pdf = new jsPDF("landscape");

    for (let i = 0; i < elements.length; i++) {
        const canvas = await html2canvas(elements[i]);
        const img = canvas.toDataURL("image/png");

        if (i > 0) pdf.addPage();
        pdf.addImage(img, "PNG", 10, 10, 280, 150);
    }

    pdf.save("dashboard.pdf");
};


export const exportCSVFromComplexTable = (table: HTMLTableElement, filename?: string) => {
    const rows = Array.from(table.querySelectorAll("tr"));

    const grid: string[][] = [];
    let rowIndex = 0;

    rows.forEach((row) => {
        const cells = Array.from(row.children) as HTMLTableCellElement[];

        if (!grid[rowIndex]) grid[rowIndex] = [];

        let colIndex = 0;

        cells.forEach((cell) => {
            // Skip occupied cells (rowspan venant des lignes précédentes)
            while (grid[rowIndex][colIndex] !== undefined) {
                colIndex++;
            }

            const rowspan = cell.rowSpan || 1;
            const colspan = cell.colSpan || 1;

            const value = (cell.textContent || "").trim();

            // Remplir la grille
            for (let r = 0; r < rowspan; r++) {
                for (let c = 0; c < colspan; c++) {
                    if (!grid[rowIndex + r]) grid[rowIndex + r] = [];
                    grid[rowIndex + r][colIndex + c] = value;
                }
            }

            colIndex += colspan;
        });

        rowIndex++;
    });

    // Convertir en CSV avec escape propre
    const escape = (val: string) => `"${val.replace(/"/g, '""')}"`;

    const csv = grid
        .map(row => row.map(cell => escape(cell || "")).join(","))
        .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `${filename || "table"}.csv`);
};

export const exportCSVFromTable = (table: HTMLTableElement, filename?: string) => {
    const rows = Array.from(table.querySelectorAll("tr"));

    const matrix: string[][] = [];

    rows.forEach((row) => {
        const cols = Array.from(row.querySelectorAll("th, td"));
        matrix.push(cols.map(col => col.textContent?.trim() || ""));
    });

    const csv = matrix
        .map(row =>
            row.map(val => `"${val.replace(/"/g, '""')}"`).join(",")
        )
        .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `${filename || "table"}.csv`);
};
// ---------------- CSV ----------------
export const exportCSV = (data: any[], filename?: string) => {
    const escape = (val: any) => `"${String(val).replace(/"/g, '""')}"`;

    const csv = [
        Object.keys(data[0]).join(","),
        ...data.map(row => Object.values(row).map(escape).join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    saveAs(blob, `${filename || "data"}.csv`);
};

// ---------------- JSON ----------------
export const exportJSON = (data: any, filename?: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
    });
    saveAs(blob, `${filename || "data"}.json`);
};

export const exportExcelFromComplexTable = (table: HTMLTableElement, filename?: string) => {
    const wb = XLSX.utils.book_new();

    const ws: any = {};
    const merges: any[] = [];

    const rows = Array.from(table.querySelectorAll("tr"));

    let rowIndex = 0;
    const grid: any[][] = [];

    rows.forEach((row) => {
        const cells = Array.from(row.children) as HTMLTableCellElement[];

        if (!grid[rowIndex]) grid[rowIndex] = [];

        let colIndex = 0;

        cells.forEach((cell) => {
            // skip occupied cells (à cause des rowspan)
            while (grid[rowIndex][colIndex] !== undefined) {
                colIndex++;
            }

            const rowspan = cell.rowSpan || 1;
            const colspan = cell.colSpan || 1;

            const value = cell.textContent?.trim() || "";

            // remplir la grille
            for (let r = 0; r < rowspan; r++) {
                for (let c = 0; c < colspan; c++) {
                    if (!grid[rowIndex + r]) grid[rowIndex + r] = [];
                    grid[rowIndex + r][colIndex + c] = value;
                }
            }

            // gérer merge Excel
            if (rowspan > 1 || colspan > 1) {
                merges.push({
                    s: { r: rowIndex, c: colIndex },
                    e: { r: rowIndex + rowspan - 1, c: colIndex + colspan - 1 },
                });
            }

            colIndex += colspan;
        });

        rowIndex++;
    });

    // convertir en worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(grid);
    worksheet["!merges"] = merges;

    XLSX.utils.book_append_sheet(wb, worksheet, "Sheet1");
    XLSX.writeFile(wb, `${filename || "table"}.xlsx`);
};

// ---------------- EXCEL ----------------
export const exportExcel = (data: any[], filename?: string) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });

    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });

    saveAs(blob, `${filename || "data"}.xlsx`);
};

export const exportMultiExcel = (charts: any[]) => {
    const wb = XLSX.utils.book_new();

    charts.forEach((chart, i) => {
        const ws = XLSX.utils.json_to_sheet(chart.data.rows);
        XLSX.utils.book_append_sheet(wb, ws, `Chart_${i}`);
    });

    XLSX.writeFile(wb, "dashboard.xlsx");
};
export type ExportTypes = "png" | "jpg" | "pdf-landscape" | "pdf-portrait" | "csv" | "excel" | "json";
type Props = {
    filename: string | undefined;
    resp: ExecuteChartResponse | undefined,
    type: ExportTypes;
    chartRef?: RefObject<any>
    element: HTMLElement | null
}

export const handleExport = async (props: Props) => {

    const { resp, type, chartRef, filename, element } = props;

    const htmlElement = element ?? chartRef?.current?.getElement?.();

    if (!htmlElement) return;

    switch (type) {
        case "png":
            await exportImage(htmlElement, "png", filename);
            break;

        case "jpg":
            await exportImage(htmlElement, "jpeg", filename);
            break;

        case "pdf-landscape":
            await exportPDF(htmlElement, "landscape", filename);
            break;

        case "pdf-portrait":
            await exportPDF(htmlElement, "portrait", filename);
            break;

        case "csv":
            exportCSVFromComplexTable(htmlElement, filename);
            // exportCSV(resp?.data?.rows || [], filename);
            break;

        case "excel":
            exportExcelFromComplexTable(htmlElement, filename);
            // exportExcel(resp?.data?.rows || [], filename);
            break;

        case "json":
            exportJSON(resp, filename);
            break;
    }
};