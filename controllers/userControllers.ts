import { User } from "../associations/associations";
import { algolia } from "../connectionDB";

export async function verifyEmail(userData) {
  const email = userData.email;
  const user = await User.findOne({
    where: {
      email,
    },
  });
  if (user) {
    return {
      success: true,

      email: user.get("email"),

      message: "Autorizado, el email esta registrado",
    };
  } else {
    return {
      success: false,
      message: "El email ingresado no esta registrado",
    };
  }
}

export async function updateUser(userData) {
  const { userId, localidad, fullName, long, lat } = userData;
  const nuevoValores = { fullName, localidad, lat, long };

  // Actualiza el usuario en la base de datos
  const [updated] = await User.update(nuevoValores, {
    where: { id: userId },
  });

  if (updated === 1) {
    // Actualizo los datos en Algolia

    await algolia.partialUpdateObject({
      indexName: "user",
      objectID: userId,
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
