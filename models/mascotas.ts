import { sequelize } from "../connectionDB";
import { DataTypes } from "sequelize";

export const Mascota = sequelize.define("mascota", {
  name: DataTypes.STRING,
  imageUrl: DataTypes.TEXT,
  state: DataTypes.STRING,
  lat: DataTypes.DECIMAL,
  long: DataTypes.DECIMAL,
  ubication: DataTypes.STRING,
});
