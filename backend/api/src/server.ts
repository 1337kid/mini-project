import express from "express";
import appConfig from "@/config";
import cors from "cors";
import routes from "@/routes";

const app = express();
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.status(200).json({ message: "I'm alive!!" });
});

app.use("/api", routes);

app.listen(appConfig.PORT, () => {
  console.log(`Server is running on port ${appConfig.PORT}`);
});
