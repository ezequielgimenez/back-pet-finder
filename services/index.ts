import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "app.petfinder.2025@gmail.com",
    pass: process.env.PASSWORD_NODEMAILER,
  },
});

// Función para validar email
export const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

// Función para enviar correo electrónico
export const sendResetEmail = async (email, resetLink) => {
  return await transporter.sendMail({
    to: email,
    subject: "Solicitud de restablecimiento de contraseña",

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
              
            .info {
              font-size: 20px;
              font-weight: 600;
              color: #ffa600;
            }

            .logo {
              margin-bottom: 20px;
            }
          </style>
        </head>
      <body>
          <div class="container">
            <img src="https://res.cloudinary.com/dkzmrfgus/image/upload/v1748406462/PetFinder-2025/ydcqjkigbzyvpkkkda6h.png" alt="PetFinder Logo" class="logo" width="150" />
            <h4 class="info">Has solicitado restablecer tu contraseña. Haz click en <a href="${resetLink}">este link</a> para restablecer tu contraseña
            <h4>
          </div>
      </body>
    `,
  });
};
