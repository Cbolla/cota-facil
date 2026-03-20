const jwt = require('jsonwebtoken');
const SECRET = 'COTAFACIL_SECRET_2024';

const authenticate = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).json({ error: 'Acesso negado' });

  try {
    const verified = jwt.verify(token.replace('Bearer ', ''), SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ error: 'Token inválido' });
  }
};

const authorize = (roles = []) => {
  if (typeof roles === 'string') roles = [roles];
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Permissão insuficiente' });
    }
    next();
  };
};

module.exports = { authenticate, authorize, SECRET };
