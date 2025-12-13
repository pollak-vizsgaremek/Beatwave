import express from "express";
import appRoutes from './routes/appRoutes';
import { errorHandler } from "./middlewares/errorHandler"; 

const app = express();

app.use(express.json());

app.use("/", appRoutes);

// Global error handler (should be after routes)
app.use(errorHandler);

export default app;