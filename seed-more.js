const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, Timestamp } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyBd3HX3w4kwTO_xpQX3Z9rmRVn_TvD2VkY",
  authDomain: "cota-facil-d42d4.firebaseapp.com",
  projectId: "cota-facil-d42d4",
  storageBucket: "cota-facil-d42d4.firebasestorage.app",
  messagingSenderId: "53047543880",
  appId: "1:53047543880:web:30d3df8b5f0a212cecf07d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const moreSuppliers = [
  { name: 'Frigorífico Boi de Ouro', products: [
    { name: 'Filé Mignon Peça 2kg', price: 145.00 }, { name: 'Picanha Argentina 1kg', price: 98.00 }, { name: 'Contra Filé Fatiado 1kg', price: 52.00 },
    { name: 'Alcatra em Bifes 1kg', price: 48.00 }, { name: 'Patinho Moído 1kg', price: 38.00 }, { name: 'Carne Seca Desfiada 500g', price: 29.00 },
    { name: 'Costela Bovina Ripada 1kg', price: 24.00 }, { name: 'Cupim Maturado 1kg', price: 42.00 }, { name: 'Maminha Grill 1kg', price: 45.00 },
    { name: 'Lombo Suíno Resfriado 1kg', price: 22.00 }, { name: 'Panceta Temperada 1kg', price: 26.00 }, { name: 'Costelinha BBQ 1kg', price: 35.00 },
    { name: 'Linguiça de Bragança 1kg', price: 28.00 }, { name: 'Frango Inteiro Resfriado', price: 18.00 }, { name: 'Peito de Frango (Sassami) 1kg', price: 21.00 },
    { name: 'Sobrecoxa Desossada 1kg', price: 19.50 }, { name: 'Asinha de Frango 1kg', price: 16.00 }, { name: 'Coração de Frango 500g', price: 14.00 },
    { name: 'Hambúrguer de Wagyu 200g', price: 18.50 }, { name: 'Kibe de Carne 1kg (60un)', price: 45.00 }, { name: 'Espetinho de Carne (Pacote 10un)', price: 32.00 },
    { name: 'Bacon em Fatias 500g', price: 22.00 }, { name: 'Charque de Ponta 1kg', price: 38.00 }, { name: 'Língua Bovina 1kg', price: 15.00 },
    { name: 'Rabada Fresca 1kg', price: 19.00 }, { name: 'Dobradinha Limpa 1kg', price: 14.50 }, { name: 'Fígado Bovino Fatiado 1kg', price: 12.00 },
    { name: 'Joelho de Porco (Eisbein) 1kg', price: 25.00 }, { name: 'Suã de Porco 1kg', price: 11.00 }, { name: 'Toucinho para Torresmo 1kg', price: 9.00 }
  ]},
  { name: 'Panificadora Sonho de Trigo', products: [
    { name: 'Pão de Forma Tradicional', price: 6.50 }, { name: 'Pão de Hambúrguer Gergelim (4un)', price: 8.90 }, { name: 'Pão de Hot Dog (4un)', price: 7.50 },
    { name: 'Bisnaguinha Tradicional 300g', price: 5.80 }, { name: 'Pão de Queijo Congelado 1kg', price: 24.00 }, { name: 'Bolo de Milho Caseiro 400g', price: 12.00 },
    { name: 'Bolo de Laranja 400g', price: 11.00 }, { name: 'Pudim de Leite Individual', price: 8.50 }, { name: 'Rosquinha de Côco 500g', price: 14.00 },
    { name: 'Torrada Multigrãos 160g', price: 6.20 }, { name: 'Cookie Triple Chocolate 100g', price: 5.50 }, { name: 'Brownie Recheado Unidade', price: 7.00 },
    { name: 'Muffins Diverso sabores', price: 4.50 }, { name: 'Sonho de Creme Unidade', price: 4.00 }, { name: 'Carolina de Chocolate 200g', price: 12.50 },
    { name: 'Pão Italiano 500g', price: 15.00 }, { name: 'Baguete Recheada Unidade', price: 18.00 }, { name: 'Pão de Mel com Doce de Leite', price: 6.00 },
    { name: 'Palha Italiana Unidade', price: 5.00 }, { name: 'Broa de Milho Caxambu', price: 3.50 }, { name: 'Pão Árabe (Pacote 5un)', price: 11.00 },
    { name: 'Pão de Milho Fatiado', price: 9.00 }, { name: 'Croissant Manteiga Grande', price: 9.50 }, { name: 'Donut Glaceado Tradicional', price: 6.50 },
    { name: 'Bolo Inglês de Frutas', price: 14.00 }, { name: 'Pão Integral 12 Grãos', price: 11.50 }, { name: 'Brioche de Milho', price: 8.00 },
    { name: 'Focaccia de Alecrim', price: 14.00 }, { name: 'Pão de Batata Recheado', price: 7.50 }, { name: 'Petiscos de Pão Árabe 100g', price: 9.00 }
  ]},
  { name: 'EcoEmbalagens Pizzaria', products: [
    { name: 'Caixa Pizza Oitavada 35cm (Pacote 50un)', price: 85.00 }, { name: 'Caixa Pizza Oitavada 40cm (Pacote 50un)', price: 95.00 }, { name: 'Caixa Pizza Oitavada 45cm (Pacote 50un)', price: 110.00 },
    { name: 'Saco Papel Kraft para Delivery (100un)', price: 65.00 }, { name: 'Guardanape de Papel Interfolhado (2000un)', price: 42.00 }, { name: 'Lacres de Segurança Adesivo (1000un)', price: 28.00 },
    { name: 'Papel Acoplado para Fritura (500un)', price: 35.00 }, { name: 'Pote Molho Plástico 30ml (100un)', price: 15.00 }, { name: 'Copo Descartável 200ml (Pacote 100un)', price: 6.50 },
    { name: 'Copo Descartável Café 50ml (Pacote 100un)', price: 4.20 }, { name: 'Mexedor de Café Plástico (500un)', price: 9.00 }, { name: 'Canudo Papel Biodegradável (100un)', price: 12.00 },
    { name: 'Porta Copos de Papelão (100un)', price: 38.00 }, { name: 'Papel Alumínio Rolo 45cmx100m', price: 45.00 }, { name: 'Filme PVC Rolo 40cmx300m', price: 32.00 },
    { name: 'Saco Plástico Transparente 5kg (100un)', price: 14.00 }, { name: 'Luva Processamento Alimentos (100un)', price: 22.00 }, { name: 'Touca Descartável Branca (100un)', price: 15.00 },
    { name: 'Máscara Descartável TNT (50un)', price: 12.00 }, { name: 'Avental Descartável Plástico (50un)', price: 25.00 }, { name: 'Esponja de Aço Industrial (10un)', price: 18.00 },
    { name: 'Detergente Concentrado 5L', price: 28.00 }, { name: 'Água Sanitária Premium 5L', price: 12.00 }, { name: 'Desinfetante Hospitalar 5L', price: 45.00 },
    { name: 'Sabonete Líquido Refil 5L', price: 32.00 }, { name: 'Álcool em Gel 70% 5L', price: 65.00 }, { name: 'Dispenser para Toalha Interfolhada', price: 55.00 },
    { name: 'Porta Sabonete Líquido Parede', price: 42.00 }, { name: 'Vassoura Multiuso Cabo Longo', price: 24.00 }, { name: 'Rodo de Alumínio Reforçado', price: 35.00 }
  ]},
  { name: 'Mestre das Especiarias', products: [
    { name: 'Orégano Peruano Premium 500g', price: 45.00 }, { name: 'Paprica Defumada 100g', price: 12.00 }, { name: 'Pimenta do Reino Grão 100g', price: 14.00 },
    { name: 'Açafrão da Terra (Curcuma) 100g', price: 8.50 }, { name: 'Cominho Moído 100g', price: 9.00 }, { name: 'Canela em Pó 100g', price: 11.00 },
    { name: 'Noz Moscada Inteira 50g', price: 18.00 }, { name: 'Cravo da Índia 100g', price: 15.00 }, { name: 'Louro em Folhas 50g', price: 7.00 },
    { name: 'Chimichurri Tradicional 100g', price: 13.00 }, { name: 'Lemon Pepper 100g', price: 12.50 }, { name: 'Sal de Parrilla 1kg', price: 18.00 },
    { name: 'Sal Rosa do Himalaia Fino 1kg', price: 22.00 }, { name: 'Vinagre de Maçã Orgânico 500ml', price: 16.00 }, { name: 'Molho de Soja (Shoyu) 1L', price: 14.00 },
    { name: 'Molho Inglês 150ml', price: 7.50 }, { name: 'Ketchup Premium 1kg', price: 24.00 }, { name: 'Mostarda Amarela 1kg', price: 18.00 },
    { name: 'Maionese Caseira 1kg', price: 22.00 }, { name: 'Molho de Pimenta Tabasco 60ml', price: 19.50 }, { name: 'Azeite Trufado 250ml', price: 120.00 },
    { name: 'Extrato de Tomate Lata 340g', price: 4.80 }, { name: 'Lata Sardinha em Óleo', price: 5.50 }, { name: 'Atum Sólido em Lata', price: 9.80 },
    { name: 'Azeitona Recheada com Pimentão 500g', price: 18.00 }, { name: 'Alcaparras em Conserva 100g', price: 14.00 }, { name: 'Cebolinha Cristal em Conserva', price: 12.00 },
    { name: 'Pepino Cornichon 300g', price: 16.00 }, { name: 'Cereja em Calda 500g', price: 42.00 }, { name: 'Pêssego em Calda Lata 450g', price: 12.50 }
  ]},
  { name: 'Mar de Sabores', products: [
    { name: 'Camarão Limpo Rosa 1kg', price: 85.00 }, { name: 'Filé de Tilápia 1kg', price: 42.00 }, { name: 'Salmão Inteiro limpo 1kg', price: 88.00 },
    { name: 'Lombo de Bacalhau Gadus Morhua 1kg', price: 165.00 }, { name: 'Anéis de Lula 500g', price: 38.00 }, { name: 'Mexilhão sem Casca 500g', price: 29.00 },
    { name: 'Filé de Merluza 1kg', price: 24.00 }, { name: 'Postas de Cação 1kg', price: 28.00 }, { name: 'Tentáculos de Polvo 1kg', price: 145.00 },
    { name: 'Siri Desfiado 500g', price: 32.00 }, { name: 'Paella Frutos do Mar 1kg', price: 75.00 }, { name: 'Kani Kama Pacote 250g', price: 14.50 },
    { name: 'Ovas de Peixe 100g', price: 45.00 }, { name: 'Algas Nori (10 folhas)', price: 12.00 }, { name: 'Vinagre de Arroz 500ml', price: 9.00 },
    { name: 'Arroz Japonês 1kg', price: 15.00 }, { name: 'Wasabi em Pasta Bisnaga', price: 11.50 }, { name: 'Gergelim Preto e Branco 100g', price: 8.00 },
    { name: 'Tofu Fresco 500g', price: 16.00 }, { name: 'Molho Teriyaki 250ml', price: 14.00 }, { name: 'Ceviche de Peixe Branco 500g', price: 45.00 },
    { name: 'Bolinho de Bacalhau Congelado (20un)', price: 38.00 }, { name: 'Isca de Peixe Empanada 1kg', price: 32.00 }, { name: 'Lula Recheada Unidade', price: 22.00 },
    { name: 'Anchova em Conserva 100g', price: 18.00 }, { name: 'Caviar Nacional 50g', price: 95.00 }, { name: 'Lagosta Inteira 1kg', price: 180.00 },
    { name: 'Caranguejo Inteiro Unidade', price: 12.00 }, { name: 'Vieiras Médias sem concha 200g', price: 55.00 }, { name: 'Filé de Saint Peter 1kg', price: 35.00 }
  ]}
];

async function seedMore() {
  const empresasRef = collection(db, 'empresas');
  for (const s of moreSuppliers) {
    try {
      console.log(`Iniciando cadastro de ${s.name}...`);
      const companyDoc = await addDoc(empresasRef, {
        name: s.name,
        createdAt: Timestamp.now(),
        status: 'Ativo'
      });
      
      console.log(`Empresa ${s.name} criada. Cadastrando produtos...`);
      const prodsRef = collection(db, `empresas/${companyDoc.id}/produtos`);
      
      let count = 0;
      for (const p of s.products) {
        try {
          await addDoc(prodsRef, { ...p, updatedAt: Timestamp.now() });
          count++;
        } catch (pErr) {
          console.error(`Erro no produto ${p.name}:`, pErr.message);
        }
      }
      console.log(`✅ ${s.name} finalizado com ${count} produtos.`);
    } catch (err) {
      console.error(`❌ Erro em ${s.name}:`, err.message);
    }
  }
  console.log('--- Seed Extra concluído ---');
  process.exit(0);
}

seedMore();
