import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],

    // Pool em thread única: cada arquivo de teste sobe uma instância
    // Fastify completa (buildApp) — para uma suíte pequena como esta (8
    // arquivos), o custo de o Vitest abrir múltiplas threads/workers do
    // SO costuma superar o ganho de paralelismo, e é sensivelmente mais
    // caro no Windows (criação de thread/processo é mais lenta lá
    // que em Linux/macOS). Rodar tudo em uma única thread evita esse
    // overhead sem sacrificar isolamento entre arquivos (o Vitest ainda
    // reinicia o módulo por arquivo).
    pool: 'threads',
    singleThread: true,

    // Rede de segurança, não a correção em si — as correções reais
    // (lazy-load do swagger/swagger-ui e do driver Prisma quando
    // DATABASE_URL está ausente, thread única acima) já deixam a
    // suíte rápida (< 2s nesta máquina). 15s é generoso o bastante
    // para cobrir variação de I/O em ambientes mais lentos (ex.:
    // Windows com antivírus interceptando acesso a disco) sem mascarar
    // uma regressão real de performance.
    testTimeout: 15_000,

    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['src/generated/**', '**/*.d.ts'],
    },
  },
});
