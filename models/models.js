const sequelize = require("./db");
const User = require("./user");
const TodoApi = require("./todoApi");

User.hasMany(TodoApi, { foreignKey: "userId" });
TodoApi.belongsTo(User, { foreignKey: "userId" });

module.exports = { User, TodoApi };
