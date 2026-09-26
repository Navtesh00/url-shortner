import express from "express";
import urlRoutes from "./routes/url_routes.js";
import {errorHandler} from "./middleware/error_handler.js";

const app = express();
app.use(express.json());

app.use("/",urlRoutes);

app.use(errorHandler);

export default app;