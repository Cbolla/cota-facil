import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';

@Injectable({
  providedIn: 'root'
})
export class ExcelService {

  exportToExcel(data: any[], fileName: string, sheetName: string = 'Sheet1'): void {
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    const workbook: XLSX.WorkBook = { Sheets: { [sheetName]: worksheet }, SheetNames: [sheetName] };
    XLSX.writeFile(workbook, `${fileName}_${new Date().getTime()}.xlsx`);
  }

  exportComparison(results: any[], total: number): void {
    const formatted = results.map(r => ({
      'Status': r.status,
      'Item Solicitado': r.requested,
      'Produto Encontrado': r.matchedProduct || 'N/A',
      'Fornecedor': r.companyName || 'N/A',
      'Preço': r.price ? `R$ ${r.price.toFixed(2)}` : '---'
    }));

    // Add total row
    formatted.push({
      'Status': 'TOTAL',
      'Item Solicitado': '',
      'Produto Encontrado': '',
      'Fornecedor': '',
      'Preço': `R$ ${total.toFixed(2)}`
    });

    this.exportToExcel(formatted, 'CotaFacil_Comparativo', 'Resultados');
  }

  exportInventory(inventory: any[], companyName: string): void {
    const formatted = inventory.map(item => ({
      'Produto': item.name,
      'Preço': item.price
    }));

    this.exportToExcel(formatted, `Catalogo_${companyName.replace(/ /g, '_')}`, 'Produtos');
  }
}
