const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, Timestamp, doc } = require('firebase/firestore');

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

const suppliers = [
  { name: 'Massa Prime Pizzaria', products: [
    { name: 'Farinha de Trigo Especial 5kg', price: 29.90 }, { name: 'Molho de Tomate Pelado 2kg', price: 18.50 }, { name: 'Mussarela de Búfala 1kg', price: 45.00 },
    { name: 'Presunto Fatiado 1kg', price: 32.00 }, { name: 'Calabresa Artesanal 1kg', price: 38.00 }, { name: 'Peperoni Importado 500g', price: 28.00 },
    { name: 'Manjericão Fresco Maço', price: 4.50 }, { name: 'Azeitona Preta sem Caroço 500g', price: 15.00 }, { name: 'Queijo Gorgonzola 200g', price: 22.00 },
    { name: 'Queijo Parmesão Ralado 1kg', price: 85.00 }, { name: 'Fermento Biológico Seco 500g', price: 12.00 }, { name: 'Azeite de Oliva Extra Virgem 500ml', price: 35.00 },
    { name: 'Orégano Desidratado 100g', price: 8.00 }, { name: 'Cebola Roxa 1kg', price: 9.50 }, { name: 'Pimentão Amarelo 1kg', price: 14.00 },
    { name: 'Lombo Canadense 500g', price: 25.00 }, { name: 'Bacon Cubos 1kg', price: 42.00 }, { name: 'Ovos Brancos 30un', price: 19.00 },
    { name: 'Requeijão Cremoso 1.4kg', price: 48.00 }, { name: 'Atum Ralado 400g', price: 16.50 }, { name: 'Milho em Conserva 2kg', price: 22.00 },
    { name: 'Ervilha em Conserva 2kg', price: 18.00 }, { name: 'Palmito Picado 1.8kg', price: 65.00 }, { name: 'Champignon Fatiado 1kg', price: 35.00 },
    { name: 'Rúcula Hidropônica Unidade', price: 5.00 }, { name: 'Tomate Cereja 200g', price: 7.50 }, { name: 'Mel Silvestre 250g', price: 18.00 },
    { name: 'Nozes Descascadas 100g', price: 14.00 }, { name: 'Creme de Leite 1kg', price: 24.00 }, { name: 'Chocolate Meio Amargo 1kg', price: 45.00 }
  ]},
  { name: 'Hortifruti Verde Vida', products: [
    { name: 'Alface Crespa Hidropônica', price: 3.50 }, { name: 'Tomate Italiano 1kg', price: 8.90 }, { name: 'Batata Inglesa 5kg', price: 19.00 },
    { name: 'Cenoura Especial 1kg', price: 5.50 }, { name: 'Cebola Branca 1kg', price: 4.80 }, { name: 'Alho Roxo 500g', price: 16.00 },
    { name: 'Banana Nanica Climatizada (Dúzia)', price: 7.50 }, { name: 'Maçã Fuji 1kg', price: 11.00 }, { name: 'Laranja Pera 5kg', price: 14.50 },
    { name: 'Abacaxi Pérola Unidade', price: 8.00 }, { name: 'Melancia Inteira 8kg', price: 22.00 }, { name: 'Mamão Papaia Unidade', price: 6.50 },
    { name: 'Manga Palmer 1kg', price: 9.00 }, { name: 'Limão Taiti 1kg', price: 4.00 }, { name: 'Uva Vitória sem semente 500g', price: 12.00 },
    { name: 'Abobrinha Italiana 1kg', price: 5.20 }, { name: 'Berinjela 1kg', price: 6.00 }, { name: 'Chuchu 1kg', price: 3.50 },
    { name: 'Pepino Japonês 1kg', price: 7.20 }, { name: 'Repolho Verde Cabeça', price: 4.50 }, { name: 'Couve-Flor Unidade', price: 8.50 },
    { name: 'Brócolis Ninja Unidade', price: 7.00 }, { name: 'Abóbora Cabotiá 1kg', price: 4.20 }, { name: 'Inhame 1kg', price: 9.50 },
    { name: 'Gengibe 500g', price: 10.00 }, { name: 'Salsa e Cebolinha Maço', price: 2.50 }, { name: 'Coentro Fresco Maço', price: 2.50 },
    { name: 'Vagem Macarrão 500g', price: 6.00 }, { name: 'Mandioquinha Salsa 1kg', price: 15.00 }, { name: 'Pimentão Verde 1kg', price: 7.50 }
  ]},
  { name: 'Bebidaria Global', products: [
    { name: 'Coca-Cola 2L', price: 9.80 }, { name: 'Guaraná Antarctica 2L', price: 7.50 }, { name: 'Cerveja Lager 350ml (Lata)', price: 4.50 },
    { name: 'Água Mineral 500ml', price: 2.00 }, { name: 'Água Mineral 1.5L', price: 4.50 }, { name: 'Suco de Laranja Integral 1L', price: 12.00 },
    { name: 'Suco de Uva Integral 1.5L', price: 18.00 }, { name: 'H2OH! Limão 500ml', price: 4.20 }, { name: 'Energético Monster 473ml', price: 9.50 },
    { name: 'Vinho Tinto Chileno 750ml', price: 45.00 }, { name: 'Vinho Branco Sauvignon 750ml', price: 38.00 }, { name: 'Espumante Brut 750ml', price: 55.00 },
    { name: 'Vodka Importada 1L', price: 85.00 }, { name: 'Whisky 12 Anos 750ml', price: 165.00 }, { name: 'Gin London Dry 750ml', price: 95.00 },
    { name: 'Cachaça Artesanal 700ml', price: 42.00 }, { name: 'Tônica Schweppes 350ml', price: 4.00 }, { name: 'Club Soda 350ml', price: 3.80 },
    { name: 'Red Bull 250ml', price: 8.50 }, { name: 'Chá Gelado Pêssego 1.5L', price: 6.80 }, { name: 'Água de Coco 1L', price: 11.50 },
    { name: 'Suco em Pó Diversos sabores', price: 0.95 }, { name: 'Xarope de Groselha 1L', price: 14.00 }, { name: 'Cerveja IPA 500ml', price: 18.00 },
    { name: 'Vinho do Porto 750ml', price: 120.00 }, { name: 'Campari 900ml', price: 58.00 }, { name: 'Licor de Amarula 750ml', price: 92.00 },
    { name: 'Sake Nacional 750ml', price: 48.00 }, { name: 'Isotônico Gatorade 500ml', price: 5.50 }, { name: 'Xarope de Grenadine 700ml', price: 45.00 }
  ]},
  { name: 'Queijo & Cia Laticínios', products: [
    { name: 'Queijo Mussarela Peça 4kg', price: 135.00 }, { name: 'Queijo Prato Peça 3kg', price: 110.00 }, { name: 'Queijo Cheddar Bisnaga 1.5kg', price: 52.00 },
    { name: 'Queijo Minas Frescal Unidade', price: 23.00 }, { name: 'Queijo Coalho Espeto 500g', price: 28.00 }, { name: 'Queijo Brie 125g', price: 24.00 },
    { name: 'Queijo Camembert 125g', price: 26.00 }, { name: 'Manteiga com Sal 200g', price: 12.50 }, { name: 'Manteiga de Garrafa 500ml', price: 32.00 },
    { name: 'Leite Integral UHT 1L', price: 4.80 }, { name: 'Leite Desnatado UHT 1L', price: 4.90 }, { name: 'Leite Condensado 395g', price: 6.50 },
    { name: 'Creme de Leite 200g', price: 3.80 }, { name: 'Doce de Leite Pastoso 400g', price: 15.00 }, { name: 'Iogurte Natural 170g', price: 2.80 },
    { name: 'Iogurte Grego 500g', price: 11.00 }, { name: 'Cream Cheese 150g', price: 8.50 }, { name: 'Catupiry Original 410g', price: 24.00 },
    { name: 'Salame Italiano Fatiado 100g', price: 12.00 }, { name: 'Copa Lombo Fatiada 100g', price: 14.00 }, { name: 'Mortadela Defumada 1kg', price: 35.00 },
    { name: 'Peito de Peru Defumado 1kg', price: 65.00 }, { name: 'Linguiça de Pernil 1kg', price: 22.00 }, { name: 'Linguiça Calabresa Reta 1kg', price: 28.00 },
    { name: 'Queijo Provolone Defumado 1kg', price: 75.00 }, { name: 'Ricota Fresca Unidade', price: 12.00 }, { name: 'Leite de Coco 200ml', price: 4.50 },
    { name: 'Requeijão Copo 200g', price: 7.80 }, { name: 'Queijo Cottage 200g', price: 11.50 }, { name: 'Nata Fresca 300g', price: 14.00 }
  ]},
  { name: 'Limpa Fácil Atacadista', products: [
    { name: 'Sabão em Pó Omo 5kg', price: 55.00 }, { name: 'Detergente Líquido 500ml', price: 2.20 }, { name: 'Desinfetante Pinho 2L', price: 12.00 },
    { name: 'Água Sanitária 5L', price: 14.00 }, { name: 'Amaciante Concentrado 1.5L', price: 22.00 }, { name: 'Limpador de Vidros 500ml', price: 8.50 },
    { name: 'Multiuso Tradicional 500ml', price: 4.80 }, { name: 'Sabão em Barra (Pacote 5un)', price: 14.00 }, { name: 'Sapólio Cremoso 250ml', price: 9.00 },
    { name: 'Lã de Aço (Pacote)', price: 3.20 }, { name: 'Esponja Multicor (Leve 4 Pague 3)', price: 6.00 }, { name: 'Pano de Prato Algodão', price: 5.50 },
    { name: 'Papel Higiênico 12 Rolos Folha Dupla', price: 18.00 }, { name: 'Papel Toalha (2 Rolos)', price: 6.50 }, { name: 'Guardanape de Papel 50un', price: 3.50 },
    { name: 'Saco de Lixo 50L (Rolo 20un)', price: 12.00 }, { name: 'Saco de Lixo 100L (Rolo 15un)', price: 16.00 }, { name: 'Luva de Látex Par', price: 4.50 },
    { name: 'Rodo de Borracha Médio', price: 15.00 }, { name: 'Vassoura de Piaçava', price: 18.00 }, { name: 'Balde Plástico 10L', price: 12.00 },
    { name: 'Escova para Tanque', price: 6.50 }, { name: 'Limpa Pedras 5L', price: 28.00 }, { name: 'Cloro Gel 500ml', price: 9.50 },
    { name: 'Lustra Móveis 200ml', price: 8.00 }, { name: 'Odorizador de Ambientes Spray', price: 12.50 }, { name: 'Inseticida Multi 450ml', price: 15.00 },
    { name: 'Antimofo Potinho 100g', price: 6.00 }, { name: 'Limpa Pisos Porcelanato 1L', price: 16.00 }, { name: 'Álcool 70% Líquido 1L', price: 7.50 }
  ]}
];

async function seed() {
  const empresasRef = collection(db, 'empresas');
  for (const s of suppliers) {
    try {
      console.log(`Cadastrando ${s.name} no Firebase...`);
      // 1. Cria a empresa
      const companyDoc = await addDoc(empresasRef, {
        name: s.name,
        createdAt: Timestamp.now(),
        status: 'Ativo'
      });

      // 2. Cria a subcoleção de produtos
      const prodsRef = collection(db, `empresas/${companyDoc.id}/produtos`);
      for (const p of s.products) {
        await addDoc(prodsRef, {
          ...p,
          updatedAt: Timestamp.now()
        });
      }
      
      console.log(`✅ ${s.name} finalizado com ${s.products.length} produtos.`);
    } catch (err) {
      console.error(`❌ Erro em ${s.name}:`, err.message);
    }
  }
  console.log('Seed Firebase concluído com sucesso.');
  process.exit(0);
}

seed();
