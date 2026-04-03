import "dotenv/config";
import { createApp } from "./app";

const PORT = process.env.API_PORT ?? 3001;

const app = createApp();

app.listen(PORT, () => {
  console.log(`🚀 API rodando em http://localhost:${PORT}`);
});
