require("dotenv").config();
const jwt = require("jsonwebtoken");

const acess = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader) return res.status(403).json({ message: "Token missing" });

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, "test");
    req.user = decoded.user;
    next();
  } catch (error) {
    res.send(error);
  }
};

module.exports = acess;
