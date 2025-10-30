import express,{Request} from "express";
import dotenv from "dotenv";
import "express-async-errors";
import morgan from "morgan";
import { logger } from "./logger";
import productRoutes from "./routes/productRoutes";
import orderRoutes from "./routes/orderRoutes";
import { errorHandler } from "./middlewares/errorHandler";

dotenv.config();

const app = express();
app.use(express.json());

morgan.token("body", (req:Request) => JSON.stringify(req.body));
app.use(
  morgan(":method :url :status :response-time ms :body", {
    stream: {
      write: (msg) => logger.info("http_request", { message: msg.trim() }),
    },
  })
);

app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);

app.get("/health", (_, res) => res.json({ status: "ok" }));

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => logger.info("server_started", { port: PORT }));
