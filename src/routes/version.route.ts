import type { FastifyInstance } from 'fastify';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

interface PackageJsonShape {
  name: string;
  version: string;
}

function readPackageJson(): PackageJsonShape {
  // Em desenvolvimento (tsx) __dirname aponta para src/routes; em
  // produção (build) aponta para dist/routes — em ambos os casos o
  // package.json está dois níveis acima.
  const packageJsonPath = join(__dirname, '..', '..', 'package.json');
  const raw = readFileSync(packageJsonPath, 'utf-8');
  return JSON.parse(raw) as PackageJsonShape;
}

export default async function versionRoute(fastify: FastifyInstance): Promise<void> {
  fastify.get(
    '/version',
    {
      schema: {
        tags: ['health'],
        summary: 'Retorna a versão e o ambiente atual da API.',
        response: {
          200: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              version: { type: 'string' },
              nodeEnv: { type: 'string' },
              commit: { type: ['string', 'null'] },
            },
          },
        },
      },
    },
    async () => {
      const packageJson = readPackageJson();
      return {
        name: packageJson.name,
        version: packageJson.version,
        nodeEnv: process.env.NODE_ENV ?? 'development',
        commit: process.env.GIT_COMMIT_SHA ?? null,
      };
    },
  );
}
