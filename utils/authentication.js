const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const hashPassword = (password) => bcrypt.hash(password, 10);

const comparePassword = (password, hash) => bcrypt.compare(password, hash);

const generateToken = (user) =>
  jwt.sign({ id: user.id }, "test", { expiresIn: "1h" });

module.exports = { hashPassword, comparePassword, generateToken };
