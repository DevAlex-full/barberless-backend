import closeWithGrace from 'close-with-grace';
import { buildApp } from './app';
import { loadEnv } from './config/env';

async function start(): Promise<void> {
  const env = loadEnv();
  const app = await buildApp({ env });

  try {
    await app.listen({ port: env.PORT, host: env.HOST });
  } catch (error) {
    app.log.error(error, 'Falha ao iniciar o servidor HTTP');
    process.exit(1);
  }

  // Encerramento gracioso em SIGINT/SIGTERM: para de aceitar novas
  // conexões, aguarda requisições em andamento e fecha recursos
  // registrados via onClose (ex.: conexão Prisma) antes de sair.
  closeWithGrace({ delay: 10_000 }, async ({ err, signal }: { err?: Error; signal?: string }) => {
    if (err) {
      app.log.error(err, 'Encerrando por erro não tratado');
    } else {
      app.log.info({ signal }, 'Encerrando graciosamente');
    }
    await app.close();
  });
}

start().catch((error: unknown) => {
  console.error('Falha fatal ao iniciar a aplicação:', error);
  process.exit(1);
});
