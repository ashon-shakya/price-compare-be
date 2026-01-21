import express from "express";
import cors from "cors"; // 1. Import cors
import dotenv from "dotenv"; // 2. Import dotenv to read .env files
import router from "./src/routes/routes.js";

// Initialize environment variables
dotenv.config();

const app = express();

// 3. Define the Allowed Origins
// We split the string from the .env file into an array
const allowedOrigins = process.env.ALLOWED_DOMAINS
  ? process.env.ALLOWED_DOMAINS.split(",")
  : [];

// 4. Create the CORS options
const corsOptions = {
  origin: function (origin, callback) {
    // !origin allows server-to-server requests (like Postman or curl)
    // Remove '!origin' if you want to strictly block non-browser requests
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true, // Enable this if you need to send cookies/headers
};

// 5. Apply the middleware BEFORE your routes
app.use(cors(corsOptions));

app.get("/", (req, res) => {
  res.send("Price Compare API");
});

app.use("/api/v1", router);

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
