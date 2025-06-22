import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { sequelize } from "../connectionDB";
import { sendResetEmail, isValidEmail } from "../services";
import { User } from "../associations/associations";
import { Auth } from "../models/auth";

//  auth controller
import {
  authController,
  authTokenController,
  middlewareUser,
  getMe,
  updatePassword,
  verifyEmailWithHunter,
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
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

///

app.listen(port, () => {
  console.log("Escuchando en el puerto:", port);
});

app.get("/prueba/:email", async (req, res) => {
  const { email } = req.params;
  const result = await verifyEmailWithHunter(email);
  return res.json(result);
});

async function hashearPass(text: string) {
  const saltRounds = 8;
  return await bcrypt.hash(text, saltRounds);
}

app.post("/auth", async (req, res) => {
  try {
    const user = await authController(req.body);

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
    const token = await authTokenController(req.body);
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

app.get("/verify-email/:email", async (req, res) => {
  try {
    const userEmail = await verifyEmail(req);
    if (!userEmail.success) {
      return res.status(401).json(userEmail);
    }
    res.status(201).json(userEmail);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put("/user", middlewareUser, async (req, res) => {
  try {
    const user = await updateUser(req);
    if (!user.success) {
      return res.status(400).json(user);
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put("/user-password", middlewareUser, async (req, res) => {
  try {
    const user = await updatePassword(req);
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

app.put("/pet", middlewareUser, async (req, res) => {
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

app.delete("/pet/:id", middlewareUser, async (req, res) => {
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

// Recovery password
app.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  // Validar el email manualmente
  if (!email || !isValidEmail(email)) {
    return res.status(400).json({
      success: false,
      message: "Debe proporcionar un email válido",
    });
  }

  try {
    const user = await User.findOne({ where: { email } });

    if (user) {
      const token = crypto.randomBytes(20).toString("hex");
      // crear una fecha de expiración (1 hora desde ahora)
      const expires = new Date(Date.now() + 3600000);

      await Auth.update(
        { token, expires },
        { where: { userId: user.get("id") } }
      );

      const resetLink = `https://pet-finder-21a3b.web.app/change-password/token/${token}`;

      await sendResetEmail(email, resetLink);

      return res.status(200).json({
        success: true,
        message:
          "Si el email está registrado, recibirás un enlace de restablecimiento",
      });
    } else {
      return res.status(404).json({
        success: false,
        message: "Email no registrado",
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error al procesar la solicitud",
      error: error.message,
    });
  }
});

app.post("/reset-password", async (req, res) => {
  const { token, password } = req.body;

  try {
    const auth = await Auth.findOne({ where: { token } });

    if (!auth) {
      return res.json({
        success: false,
        message: "Token invalido",
      });
    }
    const expires = auth.get("expires");
    if (new Date() > expires) {
      return res.status(401).json({
        success: false,
        message: "URL expirada",
      });
    } else {
      const passwordHash = await hashearPass(password);
      await auth.update(
        { password: passwordHash },
        {
          where: {
            token,
          },
        }
      );
      return res.status(200).json({
        success: true,
        message: "La contraseña ha sido cambiada con exito",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default app;
