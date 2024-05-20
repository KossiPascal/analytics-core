import { Injectable } from '@angular/core';
// import * as pdfMake from 'pdfmake/build/pdfmake';
// import * as pdfFonts from 'pdfmake/build/vfs_fonts';

@Injectable({
  providedIn: 'root'
})
export class PdfGeneratorService {
  pdfMake: any;

  constructor() {
    // this.pdfMake = pdfMake;
    // this.pdfMake.vfs = pdfFonts.pdfMake.vfs;
  }

  // generatePDF(content: any[]): any{
  //   try {
  //     var documentDefinition = {
  //       content: content,
  //       defaultStyle: {
  //         // font: 'Arial',
  //         font: 'Roboto',
  //         fontSize: 12
  //       },
  //       styles: {
  //         header: {
  //           fontSize: 18,
  //           bold: true,
  //           margin: [0, 0, 0, 10],
  //           // font: 'Roboto'
  //         },
  //         paragraph: {
  //           fontSize: 12,
  //           margin: [0, 0, 0, 5],
  //           // font: 'Roboto'
  //         },
  //         subheader: {
  //           fontSize: 14,
  //           bold: true,
  //           margin: [0, 10, 0, 5]
  //         },
  //         table: {
  //           margin: [0, 10, 0, 10]
  //         },
  //         tableHeader: {
  //           bold: true,
  //           fontSize: 13,
  //           color: 'white',
  //           fillColor: 'red',
  //         },
  //         tableCell: {
  //           fontSize: 12,
  //           color: 'black',
  //         }
  //       },
  //       pageMargins: [40, 60, 40, 60],
  //       background: [
  //         {
  //           text: 'Watermark',
  //           color: 'blue',
  //           opacity: 0.1,
  //           bold: true,
  //           italics: true,
  //           angle: 45,
  //           fontSize: 50,
  //           margin: [0, 100]
  //         }
  //       ],
  //       watermark: 'Confidential',
  //       images: {
  //         logo: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD//g...',
  //         signature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...'
  //       },
  //       defaultFilename: 'document.pdf',
  //       headerStyles: {
  //         fontSize: 16,
  //         bold: true
  //       },
  //       footerStyles: {
  //         fontSize: 14
  //       },
  //       pageSize: 'A4',
  //       pageOrientation: 'portrait',//'landscape',//
  //       header: function (currentPage: any, pageCount: any) {
  //         return { text: 'Header', alignment: 'center' };
  //       },
  //       footer: function (currentPage: any, pageCount: any) {
  //         return { text: 'Page ' + currentPage.toString() + ' of ' + pageCount.toString(), alignment: 'center' };
  //       },
  //       pageBreakBefore: function (currentNode: any, followingNodesOnPage: any, nodesOnNextPage: any, previousNodesOnPage: any) {
  //         return currentNode.headlineLevel === 1 && followingNodesOnPage.length === 0;
  //       },
  //       pageBreakAfter: function (currentNode: any, followingNodesOnPage: any, nodesOnNextPage: any, previousNodesOnPage: any) {
  //         return currentNode.headlineLevel === 1 && followingNodesOnPage.length === 0;
  //       }
  //     };
  //     const pdfDocGenerator = this.pdfMake.createPdf(documentDefinition);
  //     return pdfDocGenerator;
  //   } catch (error) {
  //     console.error('Error generating PDF:', error);
  //     return null;
  //   }
  // }
}
