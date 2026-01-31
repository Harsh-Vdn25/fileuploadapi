import express from "express";
require("dotenv").config();
import { userRouter } from "./routes/user.route";
import { fileRouter } from "./routes/file.route";

const app = express();
app.use(express.json());

app.use("/api/user", userRouter);
app.use("/api/file", fileRouter);

app.listen(5000, () => {
  console.log("App is running on port 5000");
});
