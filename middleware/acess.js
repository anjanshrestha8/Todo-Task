require("dotenv").config();

const jwt = require("jsonwebtoken");

const acess = (req, res, next) => {
  const token = req.headers["authorization"];

  if (!token) return res.status(403).json({ message: "Token missing" });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Token is invalid" });
    req.user = user;
    next();
  });
};

module.exports = acess;
