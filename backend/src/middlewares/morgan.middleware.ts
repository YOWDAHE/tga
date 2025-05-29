
import morgan, { StreamOptions } from "morgan";
import logger from "../configs/logger.config.ts";

const stream: StreamOptions = {
  write: (message: string) => logger.info(message.trim()),
};

const morganMiddleware = morgan("combined", { stream });

export default morganMiddleware;
  
