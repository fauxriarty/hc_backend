const jwt = require('jsonwebtoken');

//verifying JWT tokens
const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) return res.status(401).json({ error: 'Access denied, token missing!' });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    res.status(400).json({ error: 'Token is not valid!' });
  }
};

// ensuring the user is authenticated
const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.status(401).json({ error: 'You need to be logged in to access this resource!' });
  }
};

module.exports = {
  authenticateToken,
  ensureAuthenticated,
};
