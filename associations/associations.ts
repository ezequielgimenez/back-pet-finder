import { User } from "../models/users";
import { Mascota } from "../models/mascotas";
import { Report } from "../models/reports";

User.hasMany(Mascota, { foreignKey: "userId" });
Mascota.belongsTo(User, { foreignKey: "userId" });

Mascota.hasMany(Report, { foreignKey: "mascotaId" });
Report.belongsTo(Mascota, { foreignKey: "mascotaId" });

export { User, Mascota, Report };
