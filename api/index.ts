import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import crypto from "crypto";
import { sequelize } from "../connectionDB";

//
//asociaciones
import { User, Mascota, Report } from "../associations/associations";
import { Auth } from "../models/auth";
//  auth controller
import {
  authUser,
  authToken,
  middlewareUser,
  getMe,
  updatePassword,
} from "../controllers/authControllers";

//user controller
import { updateUser, verifyEmail } from "../controllers/userControllers";

//mascota controller
import {
  createPet,
  petsAround,
  getMyPets,
  updatePet,
  deletedPet,
} from "../controllers/mascotaControllers";

//report controller
import { createReport } from "../controllers/reportControllers";

sequelize.sync({ alter: true }).then((data) => {
  console.log(data);
});

//const
dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

//
//use
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use(express.json());

app.use(
  cors({
    origin: ["https://pet-finder-21a3b.web.app", "http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

///

app.listen(port, () => {
  console.log("Escuchando en el puerto:", port);
});

async function hashearPass(text: string) {
  const saltRounds = 8;
  return await bcrypt.hash(text, saltRounds);
}

app.post("/auth", async (req, res) => {
  try {
    const user = await authUser(req.body);

    if (!user.success) {
      return res.status(409).json(user);
    }
    res.status(201).json(user);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/auth/token", async (req, res) => {
  try {
    const token = await authToken(req.body);
    if (!token.success) {
      return res.status(401).json(token);
    }
    res.status(200).json(token);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get("/me", middlewareUser, async (req, res) => {
  try {
    const userFind = await getMe(req);
    if (!userFind.success) {
      return res.status(401).json(userFind);
    }
    res.status(200).json(userFind);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/verify-email", async (req, res) => {
  try {
    const userEmail = await verifyEmail(req.body);
    if (!userEmail.success) {
      return res.status(401).json(userEmail);
    }
    res.status(201).json(userEmail);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put("/user", async (req, res) => {
  try {
    const user = await updateUser(req.body);
    if (!user.success) {
      return res.status(400).json(user);
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.patch("/user-password", async (req, res) => {
  const { userId, password, passwordActual } = req.body;
  try {
    const user = await updatePassword(userId, password, passwordActual);
    if (!user.success) {
      return res.status(400).json(user);
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/pet", async (req, res) => {
  try {
    const pet = await createPet(req.body);
    if (!pet.success) {
      return res.status(404).json(pet);
    }
    res.status(201).json(pet);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get("/pet-around", async (req, res) => {
  try {
    const pets = await petsAround(req);
    if (!pets.success) {
      return res.status(404).json(pets);
    }
    res.status(201).json(pets);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get("/pet", async (req, res) => {
  try {
    const allPets = await getMyPets(req);
    if (!allPets.success) {
      return res.status(404).json(allPets);
    }
    res.status(201).json(allPets);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put("/pet", async (req, res) => {
  try {
    const petUpdate = await updatePet(req.body);
    if (!petUpdate.success) {
      return res.status(400).json(petUpdate);
    }
    res.status(201).json(petUpdate);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete("/pet/:id", async (req, res) => {
  try {
    const pet = await deletedPet(req);
    if (!pet.success) {
      return res.status(404).json(pet);
    }
    res.status(200).json(pet);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/report", async (req, res) => {
  try {
    const report = await createReport(req.body);
    if (!report.success) {
      return res.status(404).json(report);
    }
    res.status(201).json(report);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

////////////////////////////////////
//////////////////////////////////////Enviar mail recuperacion password
//////////////////

// const transporter = nodemailer.createTransport({
//   service: "gmail", // o el servicio que estés usando
//   auth: {
//     user: "ezequielezequiel9@gmail.com",
//     pass: "yrax mnig bkxz hjwm",
//   },
// });

// // Función para validar email
// const isValidEmail = (email) => {
//   const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//   return re.test(String(email).toLowerCase());
// };

// // Función para enviar correo electrónico
// const sendResetEmail = async (email, resetLink) => {
//   return await transporter.sendMail({
//     to: email,
//     subject: "Solicitud de restablecimiento de contraseña",
//     text: `Has solicitado restablecer tu contraseña. Haz clic en el enlace para restablecer tu contraseña: ${resetLink}`,
//   });
// };

// app.post("/forgot-password", async (req, res) => {
//   const { email } = req.body;

//   // Validar el email manualmente
//   if (!email || !isValidEmail(email)) {
//     return res.status(400).json({
//       success: false,
//       message: "Debe proporcionar un email válido",
//     });
//   }

//   try {
//     // Verificar si el email existe en la base de datos
//     const myUser = await User.findOne({ where: { email } });

//     if (myUser) {
//       // Generar un token de restablecimiento
//       const token = crypto.randomBytes(20).toString("hex");
//       // Establecer una fecha de expiración (1 hora desde ahora)
//       const expires = new Date(Date.now() + 3600000);

//       // Guardar el token en la base de datos
//       await Auth.update(
//         { token, expires },
//         { where: { userId: myUser.get("id") } }
//       );

//       // Crear el enlace de restablecimiento
//       const resetLink = `https://pet-finder-21a3b.web.app/change-password/token/${token}`;

//       // Enviar el correo electrónico
//       await sendResetEmail(email, resetLink);

//       return res.status(200).json({
//         success: true,
//         message: "Enlace de restablecimiento enviado",
//       });
//     }

//     // Respuesta genérica para no revelar información sobre la existencia del email
//     return res.status(200).json({
//       success: true,
//       message:
//         "Si el email está registrado, recibirás un enlace de restablecimiento",
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: "Error al procesar la solicitud",
//       error: error.message,
//     });
//   }
// });

// app.post("/reset-password", async (req, res) => {
//   const { token } = req.query; // Token desde la query string
//   const { password } = req.body; // Nueva contraseña desde el cuerpo de la solicitud

//   try {
//     // Buscar el token en la base de datos
//     const passwordResetToken = await Auth.findOne({ where: { token } });

//     if (!passwordResetToken) {
//       return res.json({
//         success: false,
//         message: "Token invalido o caducado",
//       });
//     }

//     // actualizar la contraseña del usuario
//     await passwordResetToken.update(
//       { password: hashearPass(password) },
//       {
//         where: {
//           token,
//         },
//       }
//     );
//     // Eliminar el token de la base de datos
//     await passwordResetToken.update({ token: null }, { where: { token } });

//     return res.status(200).json({
//       success: true,
//       message: "La contraseña ha sido cambiada con exito",
//     });
//   } catch (error) {
//     console.error("Error resetting password:", error);
//     res.status(500).json({
//       success: false,
//       message: "Internal server error",
//     });
//   }
// });

export default app;
