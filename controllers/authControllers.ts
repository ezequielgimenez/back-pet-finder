import { User } from "../associations/associations";
import { Auth } from "../models/auth";
import { algolia } from "../connectionDB";
import { Request, Response, NextFunction } from "express";

import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import bcrypt from "bcrypt";

dotenv.config();

type HunterEmail = {
  data: {
    result: string;
  };
};

type UserData = {
  email: string;
  fullName: string;
  password: string;
  localidad: string;
  lat: number;
  long: number;
  passwordNueva?: string;
  userId?: number;
};
type ResponseSuccess = {
  success: boolean;
  message: string;
  data?: InstanceType<typeof User>;
  token?: string;
};
//
let secret = process.env.SECRET_JWT;
//
export async function hashearPass(text: string): Promise<string> {
  const saltRounds = 8;
  return await bcrypt.hash(text, saltRounds);
}

export async function comparePass(
  passwordActual: string,
  passwordCompare: any
): Promise<boolean> {
  return await bcrypt.compare(passwordActual, passwordCompare);
}

export async function verifyEmailWithHunter(
  email: string
): Promise<HunterEmail> {
  const apiKey = process.env.HUNTER_API_KEY;
  const url = `https://api.hunter.io/v2/email-verifier?email=${email}&api_key=${apiKey}`;

  const response = await fetch(url);
  const data = await response.json();

  return data;
}

export async function authController(data: UserData): Promise<ResponseSuccess> {
  const { fullName, email, password, localidad, lat, long } = data;

  const info = await verifyEmailWithHunter(email);
  if (info.data.result !== "deliverable") {
    throw new Error("Email inexistente, usa un correo electrónico válido");
  }

  // Crear el usuario y la autenticación
  const [user, userCreated] = await User.findOrCreate({
    where: { email },
    defaults: { fullName, email, localidad, lat, long },
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

export async function authTokenController(
  data: Pick<UserData, "email" | "password">
): Promise<ResponseSuccess> {
  const { email, password } = data;

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
  } else {
    return {
      success: false,
      message: "Verifica que el email sea correcto",
    };
  }
}

export function middlewareUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
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
    return next();
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Token invalido o expirado" });
  }
}

export async function getMe(req: Request): Promise<ResponseSuccess> {
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

export async function updatePassword(req: Request): Promise<ResponseSuccess> {
  const { passwordNueva, password } = req.body;
  const data = req.usuario;

  const auth = await Auth.findOne({
    where: {
      userId: data.id,
    },
  });
  if (!auth) {
    return {
      success: false,
      message: "User Auth no encontrado",
    };
  }
  const isMatch = await comparePass(password, auth.get("password"));
  if (isMatch) {
    const passwordHash = await hashearPass(passwordNueva);
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
