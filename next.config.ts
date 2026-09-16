import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Todas as páginas dependem de dados sempre atuais (tarefas, saldo
    // financeiro). Sem isso, o Router Cache do Next pode mostrar uma
    // versão desatualizada de uma rota já visitada até o usuário forçar um
    // reload manual.
    staleTimes: {
      dynamic: 0,
      static: 30,
    },
  },
};

export default nextConfig;
