const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, 'database.sqlite'),
  logging: false
});

const User = sequelize.define('User', {
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { 
    type: DataTypes.ENUM('ADMIN', 'SUPPLIER', 'CLIENT'), 
    defaultValue: 'CLIENT' 
  }
});

const Company = sequelize.define('Company', {
  name: { type: DataTypes.STRING, allowNull: false },
  cnpj: { type: DataTypes.STRING }, // Optional
  isPublic: { type: DataTypes.BOOLEAN, defaultValue: true } // Some companies can be private
});

const InventoryItem = sequelize.define('InventoryItem', {
  name: { type: DataTypes.STRING, allowNull: false },
  barcode: { type: DataTypes.STRING },
  price: { type: DataTypes.FLOAT, allowNull: false }
});

const AccessRequest = sequelize.define('AccessRequest', {
  status: { type: Sequelize.STRING, defaultValue: 'PENDING' } // PENDING, APPROVED, REJECTED
});

const ProductMapping = sequelize.define('ProductMapping', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  originalName: { type: Sequelize.STRING, allowNull: false },
  matchedName: { type: Sequelize.STRING, allowNull: false },
  status: { type: Sequelize.STRING, defaultValue: 'PENDING' } // PENDING, APPROVED
});

const SavedQuote = sequelize.define('SavedQuote', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  items: { type: DataTypes.JSON, allowNull: false }, // Store results as JSON
  total: { type: DataTypes.FLOAT, allowNull: false },
  date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
});

// Relationships
User.hasOne(Company, { foreignKey: 'userId', as: 'managedCompany' });
Company.belongsTo(User, { foreignKey: 'userId' });

Company.hasMany(InventoryItem, { foreignKey: 'companyId', as: 'inventory' });
InventoryItem.belongsTo(Company, { foreignKey: 'companyId' });

User.hasMany(AccessRequest, { foreignKey: 'clientId', as: 'requests' });
AccessRequest.belongsTo(User, { foreignKey: 'clientId', as: 'client' });

Company.hasMany(AccessRequest, { foreignKey: 'companyId', as: 'accessRequests' });
AccessRequest.belongsTo(Company, { foreignKey: 'companyId' });

User.hasMany(SavedQuote, { foreignKey: 'clientId', as: 'savedQuotes' });
SavedQuote.belongsTo(User, { foreignKey: 'clientId', as: 'client' });

module.exports = { sequelize, User, Company, InventoryItem, AccessRequest, ProductMapping, SavedQuote };
