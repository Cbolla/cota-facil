import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CotaService } from '../../services/cota.service';
import { ExcelService } from '../../services/excel.service';

interface Company {
  id: string;
  name: string;
  email: string;
  phone: string;
  productsCount: number;
  status: 'Ativo' | 'Inativo';
  lastUpload: string;
}

@Component({
  selector: 'app-empresas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './empresas.component.html',
  styleUrl: './empresas.component.css'
})
export class EmpresasComponent implements OnInit {
  private cotaService = inject(CotaService);
  private excelService = inject(ExcelService);
  companies: Company[] = [];
  selectedCompanyForView: any = null;
  companyProducts: any[] = [];

  ngOnInit() {
    this.loadCompanies();
  }

  loadCompanies() {
    this.cotaService.getEmpresas().subscribe({
      next: (data: any[]) => {
        this.companies = data.map((c: any) => ({
          ...c,
          productsCount: 0, // Inicia zerado e atualiza abaixo
          email: 'contato@' + c.name.toLowerCase().replace(/\s/g, '') + '.com',
          phone: '(11) 9' + Math.floor(1000 + Math.random() * 9000) + '-' + Math.floor(1000 + Math.random() * 9000),
          status: 'Ativo',
          lastUpload: new Date().toLocaleDateString('pt-BR')
        }));

        // Busca as contagens individualmente
        this.companies.forEach(company => {
          this.cotaService.getProdutosByEmpresa(company.id).subscribe(prods => {
            company.productsCount = prods.length;
          });
        });
      },
      error: (err: any) => console.error('Error fetching companies:', err)
    });
  }

  get activeCompaniesCount(): number {
    return this.companies.filter(c => c.status === 'Ativo').length;
  }

  addCompany() {
    const name = prompt('Nome da nova empresa:');
    if (!name) return;

    this.cotaService.addEmpresa(name).subscribe({
      next: () => this.loadCompanies(),
      error: (err: any) => alert('Erro ao cadastrar: ' + err.message)
    });
  }

  viewProducts(company: any) {
    this.selectedCompanyForView = company;
    this.companyProducts = []; 
    this.cotaService.getProdutosByEmpresa(company.id).subscribe({
      next: (prods) => this.companyProducts = prods,
      error: (err) => console.error('Error loading products:', err)
    });
  }

  onFileUpload(event: any, companyId: string) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const text = e.target.result;
      const lines = text.split('\n').filter((l: string) => l.trim() !== '');
      
      // Basic CSV parsing: name;barcode;price
      const inventory = lines.map((line: string) => {
        const parts = line.split(';');
        return {
          name: parts[0]?.trim(),
          barcode: parts[1]?.trim(),
          price: parseFloat(parts[2]?.replace(',', '.') || '0')
        };
      }).filter((item: any) => item.name && item.price > 0);

      this.cotaService.uploadInventory(companyId, inventory).subscribe({
        next: (res: any) => {
          alert(`${res.count} produtos atualizados com sucesso!`);
          this.loadCompanies();
        },
        error: (err: any) => alert('Erro no upload: ' + err.message)
      });
    };
    reader.readAsText(file);
  }

  downloadCatalog(companyId: string, companyName: string) {
    this.cotaService.getEmpresaById(companyId).subscribe({
      next: (data: any) => {
        if (data.inventory && data.inventory.length > 0) {
          this.excelService.exportInventory(data.inventory, companyName);
        } else {
          alert('Este fornecedor ainda não possui produtos cadastrados.');
        }
      },
      error: (err: any) => alert('Erro ao buscar catálogo: ' + err.message)
    });
  }
}
