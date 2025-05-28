import { User } from "../associations/associations";
import { Auth } from "../models/auth";
import { algolia } from "../connectionDB";

import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import bcrypt from "bcrypt";

dotenv.config();

//
let secret = process.env.SECRET_JWT;
//
export async function hashearPass(text: string) {
  const saltRounds = 8;
  return await bcrypt.hash(text, saltRounds);
}

export async function comparePass(
  passwordActual: string,
  passwordCompare: any
) {
  return await bcrypt.compare(passwordActual, passwordCompare);
}

async function verifyEmailWithHunter(email) {
  const apiKey = process.env.HUNTER_API_KEY;
  const url = `https://api.hunter.io/v2/email-verifier?email=${email}&api_key=${apiKey}`;

  const response = await fetch(url);
  const data = await response.json();

  return data;
}

export async function authUser(userData) {
  const { fullName, email, password, localidad } = userData;

  const info = await verifyEmailWithHunter(email);
  if (info.data.result !== "deliverable") {
    throw new Error("Email inexistente, usa un correo electrónico válido");
  }

  // Crear el usuario y la autenticación
  const [user, userCreated] = await User.findOrCreate({
    where: { email },
    defaults: { fullName, email, localidad },
  });

  if (userCreated) {
    const passwordHash = await hashearPass(password);
    await Auth.create({
      email,
      password: passwordHash,
      userId: user.get("id"),
    });
    await algolia.saveObject({
      indexName: "user",
      body: {
        objectID: user.get("id"),
        fullName,
        email,
        localidad,
      },
    });
    return {
      success: true,
      message: "Usuario creado",
      data: user,
    };
  } else {
    return {
      success: false,
      message: "Ya existe el usuario",
    };
  }
}

export async function authToken(dataAuth) {
  const { email, password } = dataAuth;

  const auth = await Auth.findOne({
    where: {
      email,
    },
  });

  if (auth) {
    const passwordHash = await comparePass(password, auth.get("password"));
    if (passwordHash) {
      const user = await User.findOne({
        where: {
          id: auth.get("userId"),
        },
      });
      const token = jwt.sign({ id: user.get("id") }, secret);
      return {
        success: true,
        token,
        message: "Inicio de sesion exitosamente ",
      };
    } else {
      return {
        success: false,
        message: "Password incorrecto",
      };
    }
  }
  return {
    success: false,
    message: "Verifica que el email o password sean correctos",
  };
}

export function middlewareUser(req, res, next) {
  const authHeader = req.get("Authorization");

  if (!authHeader) {
    return res
      .status(401)
      .json({ success: false, message: "Falta el token en el request" });
  }

  const token = req.get("Authorization").split(" ")[1];
  try {
    const data = jwt.verify(token, secret);
    req.usuario = data;
    next();
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Token invalido o expirado" });
  }
}

export async function getMe(req) {
  if (!req.usuario) {
    return { success: false, message: "No hay data en el request" };
  }
  const data = req.usuario;
  const user = await User.findByPk(data.id);

  if (user) {
    return {
      success: true,
      message: "User autenticado",
      data: user,
    };
  } else {
    return {
      success: false,
      message: "User no encontrado",
    };
  }
}

export async function updatePassword(
  userId: number,
  password: string,
  passwordActual: string
) {
  const auth = await Auth.findOne({
    where: {
      userId,
    },
  });
  if (!auth) {
    return {
      success: false,
      message: "User Auth no encontrado",
    };
  }
  const isMatch = await comparePass(passwordActual, auth.get("password"));
  if (isMatch) {
    const passwordHash = await hashearPass(password);
    const [update] = await Auth.update(
      { password: passwordHash },
      {
        where: {
          userId: auth.get("userId"),
        },
      }
    );
    if (update === 1) {
      return { success: true, message: "Contraseña Actualizado" };
    }
  } else {
    return {
      success: false,
      message: "Password incorrecto",
    };
  }
}
