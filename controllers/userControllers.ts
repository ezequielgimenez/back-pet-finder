import { User } from "../associations/associations";
import { algolia } from "../connectionDB";
import { Request } from "express";

type ResponseSuccess = {
  success: boolean;
  message: string;
  data?: InstanceType<typeof User>;
  email?: string;
};

export async function verifyEmail(req: Request): Promise<ResponseSuccess> {
  const email: string = req.params.email;
  const user = await User.findOne({
    where: {
      email,
    },
  });
  if (user) {
    return {
      success: true,

      email: user.get("email").toString(),

      message: "Autorizado, el email esta registrado",
    };
  } else {
    return {
      success: false,
      message: "El email ingresado no esta registrado o no es un email valido",
    };
  }
}

export async function updateUser(req: Request): Promise<ResponseSuccess> {
  const { localidad, fullName, long, lat } = req.body;
  const nuevoValores = { fullName, localidad, lat, long };
  const data = req.usuario;
  // Actualiza el usuario en la base de datos
  const [updated] = await User.update(nuevoValores, {
    where: { id: data.id },
  });

  if (updated === 1) {
    const user = await User.findByPk(data.id);

    await algolia.partialUpdateObject({
      indexName: "user",
      objectID: data.id.toString(),
      attributesToUpdate: {
        fullName,
        localidad,
        _geoloc: {
          lat: lat,
          lng: long,
        },
      },
    });

    return {
      data: user,
      success: true,
      message: "Usuario actualizado correctamente",
    };
  } else {
    return {
      success: false,
      message: "No se pudo actualizar, userId inválido",
    };
  }
}
