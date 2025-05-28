import { Sequelize } from "sequelize";
import dotenv from "dotenv";
dotenv.config();

//sequelize
export const sequelize = new Sequelize(process.env.TOKEN_SUPABASE_SEQUELIZE);

// hello_algolia.js
import { algoliasearch } from "algoliasearch";

export const algolia = algoliasearch(
  process.env.ALGOLIA_ID,
  process.env.ALGOLIA_TOKEN
);

//Cloudinary
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary };
