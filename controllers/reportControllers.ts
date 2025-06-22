import { Mascota, Report, User } from "../associations/associations";
import nodemailer from "nodemailer";

type ReportData = {
  id: number;
  name: string;
  phone: string;
  about: string;
};

type ResponseSuccess = {
  success: boolean;
  message: string;
};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "app.petfinder.2025@gmail.com",
    pass: process.env.PASSWORD_NODEMAILER,
  },
});

const sendResetEmail = async (email, name, phone, about) => {
  return await transporter.sendMail({
    to: email,
    subject: "Hola usuari@ de PetFinder!",
    text: ` Informacion sobre su mascota:`,
    html: `
       <head>
        <style>
           @import url("https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap");
            body {
              font-family: "Poppins", sans-serif;
              background-color: #f0f0f0;
              margin: 0;
              padding: 20px;
            }

            .container {
              background-color: #f2f2f2;
              padding: 20px;
              border-radius: 10px;
              box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
              text-align: center;
            }

            h1 {
              color: #333333;
            }

            .code {
              font-size: 30px;
              font-weight: 600;
              color: #ffa600;
            }
            .info {
              font-size: 23px;
              font-weight: 600;
              color:rgb(23, 23, 23);
            }

            .logo {
              margin-bottom: 20px;
            }
          </style>
        </head>
      <body>
          <div class="container">
           
            <img src="https://res.cloudinary.com/dkzmrfgus/image/upload/v1748406462/PetFinder-2025/ydcqjkigbzyvpkkkda6h.png" alt="PetFinder Logo" class="logo" width="150" />

            
            <h1>Información sobre tu mascota:</h1>
            <h3 class="code">Información del usuario que reporto:</h3>
            <h4 class="info">${name}</h4>
            <h4 class="info">Telefono: ${phone}</h4>
            <h3 class="code">Información sobre tu mascota</h3>
            <h4>${about}</h4>
          </div>
      </body>
    `,
  });
};

export async function createReport(data: ReportData): Promise<ResponseSuccess> {
  const { id, name, phone, about } = data;
  const pet = await Mascota.findByPk(id);

  if (pet) {
    const user = await User.findByPk(pet.get("userId").toString());

    if (user) {
      await Report.create({
        name,
        phone,
        about,
        mascotaId: pet.get("id"),
      });

      await sendResetEmail(user.get("email"), name, phone, about);
      return {
        success: true,
        message: "Reporte creado y enviado al usuario",
      };
    }
  } else {
    return {
      success: false,
      message: "Mascota no encontrada",
    };
  }
}
