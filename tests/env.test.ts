import { describe, expect, it } from 'vitest';
import { loadEnv } from '../src/config/env';

describe('loadEnv', () => {
  it('aplica valores padrão quando variáveis opcionais não são definidas', () => {
    const env = loadEnv({ NODE_ENV: 'test' });
    expect(env.PORT).toBe(3333);
    expect(env.CORS_ORIGIN).toBe('http://localhost:3000');
    expect(env.SWAGGER_ENABLED).toBe(true);
  });

  it('lança erro descritivo quando NODE_ENV é inválido', () => {
    expect(() => loadEnv({ NODE_ENV: 'invalido' })).toThrow(/Variáveis de ambiente inválidas/);
  });

  it('converte SWAGGER_ENABLED=false corretamente', () => {
    const env = loadEnv({ NODE_ENV: 'test', SWAGGER_ENABLED: 'false' });
    expect(env.SWAGGER_ENABLED).toBe(false);
  });
});
