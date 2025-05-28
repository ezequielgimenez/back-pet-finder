import { sequelize } from "../connectionDB";
import { DataTypes } from "sequelize";

export const Report = sequelize.define("report", {
  name: DataTypes.STRING,
  phone: DataTypes.STRING,
  about: DataTypes.TEXT,
});
