import { Component, Input, ChangeDetectionStrategy, OnChanges, OnDestroy } from '@angular/core';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ConnectivityService } from '@kossi-services/connectivity.service';
import { FormGroupService } from '@kossi-services/form-group.service';
import { SnackbarService } from '@kossi-services/snackbar.service';
import { UserContextService } from '@kossi-services/user-context.service';

@Component({
  standalone: false,
  selector: 'repports-header-selector',
  template: '',
  styles: [''],
  changeDetection: ChangeDetectionStrategy.OnPush,
})


export abstract class ExportDataComponent<T> {

  TABLE_ID!: string;

  title: string = "title";
  logoUrl: string = "logoUrl";

  constructor(
          protected fGroup: FormGroupService,
          protected conn: ConnectivityService,
          protected snackbar: SnackbarService,
          protected userCtx: UserContextService,) { 
  }


  exportToCSV() {
    let table = document.getElementById(this.TABLE_ID) as HTMLTableElement;
    if (!table) return;
    let rows = Array.from(table.rows);

    let csvContent = `"${this.title}"\n\n`;
    // csvContent += `"Logo: ${this.logoUrl}"\n\n`;

    csvContent += rows.map(row =>
      Array.from(row.cells).map(cell => cell.textContent).join(",")
    ).join("\n");

    let blob = new Blob([csvContent], { type: "text/csv" });
    let link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "data.csv";
    link.click();
  }

  exportToJSON() {
    let table = document.getElementById(this.TABLE_ID) as HTMLTableElement;
    if (!table) return;
    let rows = Array.from(table.rows).slice(1); // Exclure l'en-tête
    let headers = Array.from(table.rows[0].cells).map(cell => cell.textContent?.trim() || "");

    let data = rows.map(row => {
      let cells = Array.from(row.cells);
      let obj: { [key: string]: string } = {};
      headers.forEach((header, index) => {
        obj[header] = cells[index]?.textContent?.trim() || "";
      });
      return obj;
    });

    let jsonBlob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    let link = document.createElement("a");
    link.href = URL.createObjectURL(jsonBlob);
    link.download = "data.json";
    link.click();
  }

  exportToExcel() {
    let table = document.getElementById(this.TABLE_ID) as HTMLTableElement;
    if (!table) return;
    let wb = XLSX.utils.book_new();
    let ws = XLSX.utils.table_to_sheet(table);

    // Ajouter un titre et un lien vers le logo
    XLSX.utils.sheet_add_aoa(ws, [[this.title]], { origin: "A1" });
    // XLSX.utils.sheet_add_aoa(ws, [[`Logo: ${this.logoUrl}`]], { origin: "A2" });


    XLSX.utils.book_append_sheet(wb, ws, "Données");
    XLSX.writeFile(wb, "data.xlsx");
  }


  exportToPDF(
    orientation: 'p' | 'l' = 'p',
    pageFormat: [number, number] | string = 'a4',
    margins: { top: number; left: number; right: number } = { top: 50, left: 15, right: 15 }
  ) {
    const doc = new jsPDF({
      orientation,
      unit: 'mm',
      format: pageFormat
    });

    let table = document.getElementById(this.TABLE_ID) as HTMLTableElement;
    if (!table) return;

    // Ajout du logo
    const img = new Image();
    img.src = this.logoUrl;
    img.onload = () => {
      const imgWidth = 30;
      const imgHeight = 30;
      doc.addImage(img, 'PNG', margins.left, 10, imgWidth, imgHeight);

      // Ajout du titre
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(this.title, margins.left + imgWidth + 10, 20);

      // Récupération des données du tableau avec gestion des cellules fusionnées
      let headers: any[] = [];
      let data: any[] = [];

      let thead = table.querySelector("thead");
      let tbody = table.querySelector("tbody");

      if (thead && tbody) {
        if (thead) {
          let rows = Array.from(thead.rows).filter(row => !row.classList.contains('ignore-export'));
          headers = rows.map(row =>
            Array.from(row.cells).map(cell => {
              let cellElement = cell as HTMLTableCellElement;
              return {
                content: cell.textContent || '',
                colSpan: cellElement.colSpan || 1,
                rowSpan: cellElement.rowSpan || 1,
              };
            })
          );
        }
      
        if (tbody) {
          let rows = Array.from(tbody.rows).filter(row => !row.classList.contains('ignore-export'));
          data = rows.map(row =>
            Array.from(row.cells).map(cell => {
              let cellElement = cell as HTMLTableCellElement;
              return {
                content: cell.textContent || '',
                colSpan: cellElement.colSpan || 1,
                rowSpan: cellElement.rowSpan || 1,
              };
            })
          );
        }
      } else {

        let rows = Array.from(table.rows).filter(row => !row.classList.contains('ignore-export'));
        rows.forEach((row, rowIndex) => {
          let rowData: any[] = [];
          Array.from(row.cells).forEach((cell) => {
            rowData.push({
              content: cell.textContent || '',
              colSpan: cell.colSpan || 1,
              rowSpan: cell.rowSpan || 1,
              styles: {
                fontStyle: rowIndex === 0 ? 'bold' : 'normal',
                halign: 'center',
                valign: 'middle'
              }
            });
          });

          if (rowIndex === 0) headers.push(rowData);
          else data.push(rowData);
        });
      }

      // Application du tableau avec gestion des colonnes fusionnées
      autoTable(doc, {
        startY: margins.top,
        head: headers,
        body: data,
        theme: 'grid',
        margin: { left: margins.left, right: margins.right },
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [0, 51, 102], textColor: [255, 255, 255], fontStyle: 'bold' }, // Bleu foncé
        alternateRowStyles: { fillColor: [240, 240, 240] }, // Gris clair
        columnStyles: { 0: { cellWidth: 'auto' } },
        pageBreak: 'auto',
        didParseCell: function (data) {
          if (data.cell.raw && data.cell.raw instanceof HTMLTableCellElement) {
            if (data.cell.raw.rowSpan > 1 || data.cell.raw.colSpan > 1) {
              data.cell.styles.fillColor = [200, 200, 200]; // Appliquer un style pour les cellules fusionnées
            }
          }
        },
        didDrawPage: function (hookData) {
          // Repeat header on every new page
          // doc.setFontSize(12);
          // doc.text("Exported Data", 60, 20); // Re-add title

          // Re-add the table header manually
          // autoTable(doc, {
          //   startY: 30,
          //   head: headers,
          //   theme: 'grid',
          //   styles: { fontSize: 10, cellPadding: 3 },
          //   headStyles: { fillColor: [0, 51, 102], textColor: 255, fontStyle: 'bold' },
          //   margin: { top: 60 },
          // });

          // Add page number
          const pageNumber = doc.getCurrentPageInfo().pageNumber;
          doc.setFontSize(10);
          doc.text(`Page ${pageNumber}`, doc.internal.pageSize.width - 20, doc.internal.pageSize.height - 10);
        }
      });

      // Sauvegarde avec un nom dynamique
      const fileName = `export_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
    };
  }



  // exportToPDF() {
  //   let doc = new jsPDF();
  //   let table = document.getElementById(this.TABLE_ID) as HTMLTableElement;
  //   if (!table) return;

  //   // Ajouter une image
  //   const img = new Image();
  //   img.src = this.logoUrl;
  //   img.onload = () => {
  //     doc.addImage(img, 'PNG', 15, 10, 30, 30); // Position et taille de l'image
  //     doc.setFontSize(16);
  //     doc.text(this.title, 60, 20); // Ajouter le titre

  //     let rows = Array.from(table.rows);
  //     let data = rows.map(row => Array.from(row.cells).map(cell => cell.textContent));

  //     autoTable(doc, {
  //       startY: 50, // Commencer le tableau sous l'image
  //       head: [data[0]],
  //       body: data.slice(1)
  //     });

  //     doc.save("data.pdf");
  //   };
  // }
  // exportToPDF() {
  //   let doc = new jsPDF();
  //   let table = document.getElementById(this.TABLE_ID) as HTMLTableElement;
  //   if (!table) return;
  //   let rows = Array.from(table.rows);
  //   let data = rows.map(row => Array.from(row.cells).map(cell => cell.textContent));

  //   autoTable(doc, { head: [data[0]], body: data.slice(1) });
  //   doc.save("data.pdf");
  // }


}
