import express from "express";
import cors from "cors";
import config from "./config";
import { connectToDatabase } from "./config/database";
import apiRoutes from "./api";

const startServer = async () => {
  // Kết nối tới database trước khi khởi động server
  await connectToDatabase();

  const app = express();

  // Middlewares
  app.use(cors()); // Cho phép cross-origin requests
  app.use(express.json()); // Parse JSON bodies
  app.use(express.urlencoded({ extended: true }));

  // Routes
  app.get("/", (req, res) => {
    res.send("QR Scanner API is running!");
  });

  app.use("/api", apiRoutes);

  // Bắt đầu lắng nghe
  const port = config.port;
  app.listen(port, () => {
    console.log(`🚀 Server is running on http://localhost:${port}`);
  });
};

startServer();
