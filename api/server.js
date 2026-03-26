const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const stringSimilarity = require('string-similarity');
const { sequelize, User, Company, InventoryItem, AccessRequest, ProductMapping, SavedQuote } = require('./db');
const { authenticate, authorize, SECRET } = require('./auth');

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

// Sync DB
sequelize.sync().then(async () => {
  console.log('Database synced (SQLite - CotaFácil)');
  
  // Create default admin if not exists
  const admin = await User.findOne({ where: { role: 'ADMIN' } });
  if (!admin) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await User.create({ 
      name: 'Admin Sistema', 
      email: 'admin@cotafacil.com', 
      password: hashedPassword, 
      role: 'ADMIN' 
    });
    console.log('Default Admin created: admin@cotafacil.com / admin123');
  }
}).catch(err => {
  console.error('Error syncing DB:', err);
});

// -- AUTH ROUTES --
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword, role });
    
    // If it's a supplier, create the basic company profile
    if (role === 'SUPPLIER') {
      await Company.create({ name: `${name} Store`, userId: user.id });
    }

    res.status(201).json({ success: true, user: { id: user.id, name, email, role } });
  } catch (err) {
    res.status(400).json({ error: 'Erro ao registrar usuário' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Senha incorreta' });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, SECRET, { expiresIn: '1d' });
    res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: 'Erro no login' });
  }
});

// -- SUPPLIER ROUTES --
app.get('/api/supplier/my-company', authenticate, authorize('SUPPLIER'), async (req, res) => {
  const company = await Company.findOne({ 
    where: { userId: req.user.id },
    include: [{ model: InventoryItem, as: 'inventory' }]
  });
  res.json(company);
});

app.post('/api/supplier/upload-inventory', authenticate, authorize('SUPPLIER'), async (req, res) => {
  try {
    const { inventory } = req.body;
    const company = await Company.findOne({ where: { userId: req.user.id } });
    if (!company) return res.status(404).json({ error: 'Empresa não vinculada ao usuário' });

    // Clear old inventory and bulk insert new
    await InventoryItem.destroy({ where: { companyId: company.id } });
    const items = inventory.map(item => ({ ...item, companyId: company.id }));
    await InventoryItem.bulkCreate(items);

    res.json({ success: true, count: items.length });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao salvar inventário' });
  }
});

app.patch('/api/supplier/inventory/:itemId', authenticate, authorize('SUPPLIER'), async (req, res) => {
  try {
    const { price } = req.body;
    const company = await Company.findOne({ where: { userId: req.user.id } });
    if (!company) return res.status(404).json({ error: 'Empresa não vinculada' });

    const item = await InventoryItem.findOne({ 
      where: { id: req.params.itemId, companyId: company.id } 
    });
    
    if (!item) return res.status(404).json({ error: 'Item não encontrado ou acesso negado' });
    
    item.price = parseFloat(price);
    await item.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar preço' });
  }
});

// -- CLIENT ROUTES --
app.get('/api/client/companies', authenticate, authorize('CLIENT'), async (req, res) => {
  const companies = await Company.findAll({ where: { isPublic: true } });
  // Add permitted companies as well
  const permitted = await AccessRequest.findAll({ 
    where: { clientId: req.user.id, status: 'APPROVED' },
    include: [Company]
  });
  const allPermitted = [...companies, ...permitted.map(p => p.Company)];
  res.json(allPermitted);
});

app.get('/api/client/companies/:id', authenticate, authorize(['CLIENT', 'ADMIN']), async (req, res) => {
  const company = await Company.findOne({ 
    where: { id: req.params.id },
    include: [{ model: InventoryItem, as: 'inventory' }]
  });
  if (!company) return res.status(404).json({ error: 'Company not found' });
  res.json(company);
});

app.post('/api/client/confirm-match', authenticate, authorize('CLIENT'), async (req, res) => {
  const { originalName, matchedName } = req.body;
  if (!originalName || !matchedName) return res.status(400).json({ error: 'Nomes originais e correspondentes obrigatorios' });
  
  // Verifica se ja existe
  const exists = await ProductMapping.findOne({ where: { originalName, matchedName } });
  if (exists) return res.json({ message: 'Aguardando aprovacao' });

  await ProductMapping.create({ originalName, matchedName, status: 'PENDING' });
  res.json({ success: true, message: 'Solicitacao de vinculo enviada ao administrador' });
});

app.post('/api/client/compare', authenticate, authorize('CLIENT'), async (req, res) => {
  const { itemList, companyId } = req.body;
  if (!itemList || !Array.isArray(itemList)) return res.status(400).json({ error: 'itemList required' });

  // Get accessible companies
  const publicCompanies = await Company.findAll({ where: { isPublic: true } });
  const approvedRequests = await AccessRequest.findAll({ where: { clientId: req.user.id, status: 'APPROVED' } });
  const permittedIds = [...publicCompanies.map(c => c.id), ...approvedRequests.map(r => r.companyId)];

  let targetIds = permittedIds;
  if (companyId) {
    if (!permittedIds.includes(parseInt(companyId))) return res.status(403).json({ error: 'Acesso negado a esta loja privada' });
    targetIds = [parseInt(companyId)];
  }

  const searchPool = await Company.findAll({ 
    where: { id: targetIds },
    include: [{ model: InventoryItem, as: 'inventory' }]
  });

  const approvedMappings = await ProductMapping.findAll({ where: { status: 'APPROVED' } });

  const results = itemList.map(item => {
    const rawTerm = item.trim();
    const searchTerm = rawTerm.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const candidateMatches = [];

    // Prioridade 0: Mapeamento Manual Aprovado
    const mapping = approvedMappings.find(m => m.originalName.trim().toLowerCase() === rawTerm.toLowerCase());
    if (mapping) {
      for (const company of searchPool) {
        const found = (company.inventory || []).find(p => p.name === mapping.matchedName);
        if (found) {
          candidateMatches.push({ p: found, company, score: 1.1, status: 'CERTO' }); // Score alto para priorizar
        }
      }
    }

    searchPool.forEach(company => {
      (company.inventory || []).forEach(p => {
        const prodName = p.name.toLowerCase();
        const normalProd = prodName.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

        if (p.barcode && p.barcode === item.trim()) {
          candidateMatches.push({ p, company, score: 1.0, status: 'CERTO' });
          return;
        }

        if (normalProd === searchTerm) {
          candidateMatches.push({ p, company, score: 0.95, status: 'CERTO' });
          return;
        }

        const nameScore = stringSimilarity.compareTwoStrings(searchTerm, normalProd);
        if (nameScore > 0.3) {
          candidateMatches.push({ 
            p, 
            company, 
            score: nameScore, 
            status: nameScore > 0.7 ? 'CERTO' : 'DUVIDA' 
          });
        }
      });
    });

    const bestMatch = candidateMatches.length > 0 ? candidateMatches.sort((a,b)=> b.score - a.score)[0] : null;

    return {
      requested: item,
      matchedProduct: bestMatch ? bestMatch.p.name : null,
      companyName: bestMatch ? bestMatch.company.name : null,
      price: bestMatch ? bestMatch.p.price : null,
      score: bestMatch ? (bestMatch.score * 10).toFixed(1) : 0,
      status: bestMatch ? bestMatch.status : 'NAO_ENCONTRADO'
    };
  });

  res.json(results);
});

// -- SAVED QUOTES ROUTES --
app.get('/api/client/saved-quotes', authenticate, authorize('CLIENT'), async (req, res) => {
  const quotes = await SavedQuote.findAll({ where: { clientId: req.user.id } });
  res.json(quotes);
});

app.post('/api/client/save-quote', authenticate, authorize('CLIENT'), async (req, res) => {
  try {
    const { name, items, total } = req.body;
    if (!name || !items || !total) return res.status(400).json({ error: 'Name, items and total required' });
    
    const quote = await SavedQuote.create({ 
      name, 
      items, 
      total, 
      clientId: req.user.id 
    });
    res.status(201).json(quote);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao salvar cotacao: ' + err.message });
  }
});

app.delete('/api/client/saved-quotes/:id', authenticate, authorize('CLIENT'), async (req, res) => {
  try {
    const quote = await SavedQuote.findOne({ where: { id: req.params.id, clientId: req.user.id } });
    if (!quote) return res.status(404).json({ error: 'Cotacao nao encontrada' });
    await quote.destroy();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao deletar cotacao' });
  }
});

// -- ADMIN ROUTES --
app.get('/api/admin/users', authenticate, authorize('ADMIN'), async (req, res) => {
  const users = await User.findAll({ attributes: { exclude: ['password'] } });
  res.json(users);
});

app.get('/api/admin/pending-mappings', authenticate, authorize('ADMIN'), async (req, res) => {
  const mappings = await ProductMapping.findAll({ where: { status: 'PENDING' } });
  res.json(mappings);
});

app.post('/api/admin/approve-mapping/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  const mapping = await ProductMapping.findByPk(req.params.id);
  if (!mapping) return res.status(404).json({ error: 'Nao encontrado' });
  mapping.status = 'APPROVED';
  await mapping.save();
  res.json({ success: true });
});

app.listen(port, () => {
  console.log(`CotaFácil API (SQLite) running at http://localhost:${port}`);
});
