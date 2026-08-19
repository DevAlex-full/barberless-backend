-- Fase 4 — Fundação Técnica
-- Migration inicial: habilita a extensão pgcrypto, base para geração
-- de UUIDs pelos models de domínio que serão criados nas fases
-- seguintes (usuários, clientes, agenda, etc.). Nenhuma tabela de
-- negócio é criada nesta fase.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
