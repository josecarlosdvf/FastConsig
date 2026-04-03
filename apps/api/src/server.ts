import "dotenv/config";
import { createApp } from "./app";

const PORT = process.env.API_PORT ?? 3001;

createApp()
  .then((app) => {
    app.listen(PORT, () => {
      console.log(`🚀 API rodando em http://localhost:${PORT}`);
    });
  })
  .catch((err: unknown) => {
    console.error("Falha ao iniciar a aplicação:", err);
    process.exit(1);
  });
