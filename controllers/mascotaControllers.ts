import { User, Mascota } from "../associations/associations";
import { algolia } from "../connectionDB";
import { cloudinary } from "../connectionDB";

import { Request } from "express";

type DataPet = {
  userId?: number;
  id?: number;
  name: string;
  imageUrl: string;
  state: string;
  lat: number;
  long: number;
  ubication: string;
};

type ResponseSuccess = {
  success: boolean;
  message: string;
  data?: any;
};

export async function createPet(data: DataPet): Promise<ResponseSuccess> {
  const { userId, name, imageUrl, state, lat, long, ubication } = data;

  //
  const image = await cloudinary.uploader.upload(imageUrl, {
    folder: "PetFinder-2025",
  });
  const petImage = image.secure_url;
  //
  const user = await User.findOne({
    where: {
      id: userId,
    },
  });
  if (user) {
    const mascota = await Mascota.create({
      userId: user.get("id"),
      name,
      imageUrl: petImage,
      state,
      lat,
      long,
      ubication,
    });

    await algolia.saveObject({
      indexName: "pets",
      body: {
        objectID: mascota.get("id"),
        userId: user.get("id"),
        name,
        imageUrl: petImage,
        _geoloc: {
          lat,
          lng: long,
        },
        state,
        ubication,
      },
    });
    return {
      success: true,
      message: "Mascota reportada",
    };
  } else {
    return {
      success: false,
      message: "User no encontrado, userId no existe",
    };
  }
}

export async function petsAround(req: Request): Promise<ResponseSuccess> {
  const { userId, lng, lat } = req.query;

  const pets = await algolia.searchSingleIndex({
    indexName: "pets",
    searchParams: {
      aroundLatLng: `${lat},${lng}`,
      aroundRadius: 10000,
      filters: `NOT userId:${userId}`,
    },
  });
  if (pets.hits.length === 0) {
    return {
      success: false,
      message: "No hay mascotas cerca",
    };
  } else {
    return { success: true, message: "Mascotas encontradas", data: pets.hits };
  }
}

export async function getMyPets(req: Request): Promise<ResponseSuccess> {
  const { userId } = req.query;
  const user = await User.findByPk(userId);

  if (!user) {
    return { success: false, message: "UserId incorrecto" };
  }
  const myPets = await Mascota.findAll({
    where: {
      userId: user.get("id"),
    },
  });

  if (myPets.length === 0) {
    return {
      success: false,
      message: "No tenes mascotas reportadas",
    };
  } else {
    return {
      success: true,
      message: "Tus mascotas",
      data: myPets,
    };
  }
}

export async function updatePet(data: DataPet): Promise<ResponseSuccess> {
  const { id, name, imageUrl, state, lat, long, ubication } = data;

  const image = await cloudinary.uploader.upload(imageUrl, {
    folder: "PetFinder-2025",
  });

  const petImage = image.secure_url;

  const [pet] = await Mascota.update(
    { name, imageUrl: petImage, state, lat, long, ubication },
    {
      where: {
        id,
      },
    }
  );
  if (pet === 1) {
    await algolia.partialUpdateObject({
      indexName: "pets",
      objectID: id.toString(),
      attributesToUpdate: {
        name,
        state,
        imageUrl: petImage,
        _geoloc: {
          lat,
          lng: long,
        },
        ubication,
      },
    });
    return {
      success: true,
      message: "Mascota actualizada",
    };
  } else {
    return {
      success: false,
      message: "No se pudo actualizar mascota",
    };
  }
}

export async function deletedPet(req: Request): Promise<ResponseSuccess> {
  const { id } = req.params;
  const userAuth = req.usuario;
  if (!userAuth.id) {
    return {
      success: false,
      message: "No estas autenticado para eliminar un pet",
    };
  }
  const pet = await Mascota.destroy({
    where: {
      id,
    },
  });
  if (pet === 1) {
    await algolia.deleteObject({ indexName: "pets", objectID: id });
    return {
      success: true,
      message: "Mascota eliminada",
    };
  } else {
    return {
      success: false,
      message: "Mascota no encontrada",
    };
  }
}
