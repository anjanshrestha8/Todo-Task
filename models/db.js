const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize("TodoApi", "root", "anjanshrestha8", {
  dialect: "mysql",
  host: "localhost",
});
module.exports = sequelize;
