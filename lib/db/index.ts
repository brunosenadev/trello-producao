import { neonConfig, Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";

import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL não configurada.");
}

// O WebSocket nativo do Node.js pode travar silenciosamente (sem erro, sem
// timeout próprio) ao conectar em ambientes serverless como a Vercel,
// segurando a invocação até o limite de execução da plataforma. Forçar o
// driver `ws` evita esse travamento — é a configuração recomendada pela
// própria Neon para runtimes Node.js.
neonConfig.webSocketConstructor = ws;

// Usamos o driver via WebSocket (Pool), e não o `neon-http`, porque a
// conclusão de tarefa precisa de uma transação interativa de verdade
// (SELECT ... FOR UPDATE + UPDATE + INSERT atômicos) para impedir pagamento
// duplicado sob concorrência — o driver HTTP só executa lotes de queries
// independentes, sem leitura condicional no meio da transação. Isso ainda
// roda perfeitamente em funções serverless da Vercel (runtime Node.js): a
// conexão vive apenas durante a invocação, sem processo persistente.
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const db = drizzle(pool, { schema });
