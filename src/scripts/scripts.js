import mongoose from "mongoose";
import { configDotenv } from "dotenv";
import { getWoolWorthCookie } from "../helper/fetchApi.js";

configDotenv();

const updateCookies = async () => {
  return await getWoolWorthCookie(true);
};

console.log("Connecting to DB: ", process.env.MONGODB_URL);
mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => {
    console.log("DB connected");
    updateCookies()
      .then((cookie) => {
        console.log("Generated Cookie");
        console.log(cookie);
      })
      .catch((err) => {
        console.log("Cookie Generation Error");
        console.log(err);
        process.exit(1);
      })
      .finally(async () => {
        await mongoose.disconnect();
        process.exit(0);
      });
  })
  .catch((err) => {
    console.log("DB Connection error");
    process.exit(1); // 0 means "success", 1 means "error"
  });
