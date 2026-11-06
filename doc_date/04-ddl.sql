-- Passo 7 — Modelo físico
-- Equipe: Sara dos Santos de Oliveira, Rodrygo Schadeck Gomes, Yasmin Santos de Lima, Isabella de Almeida Santos
-- PostgreSQL. Por que este SGBD: A escolha do PostgreSQL justifica-se pelo domínio técnico que a equipe já possui sobre a tecnologia e pela sua utilização prática nas disciplinas da faculdade durante o semestre atual dos integrantes do projeto.
-- Contrato com Aplicativos para Web: os nomes abaixo são os acordados.
-- Tabelas e colunas oficiais:
-- - cadastro_usuario (id_usuario, nome)
-- - tabela_ranking (id_jogador, nome_jogador, pontuacao_jogador, data_jogado)
-- - opcao_questoes (id_opcao, opcao_a, opcao_b, opcao_c, opcao_d, opcao_e)
-- - fontes (id, referencia)
-- - questoes (id, enunciado, opcao_id, resposta_correta, dificuldade_nivel, fonte_id)
-- - questoes_respondidas (id_resposta, usuario_id, questao_id, resposta_usuario, acerto, data_resposta)
-- Banco vazio:
--   createdb projeto_quiz_irsy
--   psql -d projeto_quiz_IMRSY -v ON_ERROR_STOP=1 -f 04-ddl.sql
-- Só esquema e domínio fixo (idiomas, alternativas).
-- Categorias, publicadores, fontes e perguntas ficam no passo 8.

BEGIN;

-- TODO: CREATE TABLE, na ordem em que as FK permitem.
-- PK id_<tabela>. Nomes em português, minúsculos, sem acento, singular.
-- PK, FK, NOT NULL, UNIQUE e CHECK declarados aqui, como no dicionário.

-- TODO: INSERT do domínio fixo.

CREATE DATABASE projeto_quiz_irsy;

CREATE TABLE IF NOT EXISTS cadastro_usuario (
	id_usuario SERIAL PRIMARY KEY,
	nome VARCHAR(50) NOT NULL UNIQUE
);
CREATE TABLE IF NOT EXISTS tabela_ranking (
  	id_ranking SERIAL PRIMARY KEY,
  	usuario_id INTEGER REFERENCES cadastro_usuario(id_usuario) ON DELETE CASCADE,
	nome_jogador VARCHAR(50) NOT NULL,
	pontuacao_jogador INTEGER NOT NULL CHECK (pontuacao_jogador >= 0),
	total_acertos INTEGER NOT NULL DEFAULT 0 CHECK (total_acertos >= 0),
	data_jogado TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS opcao_questoes (
	id_opcao SERIAL PRIMARY KEY,
	opcao_a TEXT NOT NULL, opcao_b TEXT NOT NULL, opcao_c TEXT NOT NULL,
	opcao_d TEXT NOT NULL, opcao_e TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS fonte (
	id SERIAL PRIMARY KEY,
	referencia TEXT UNIQUE NOT NULL,
	url VARCHAR(255) UNIQUE NOT NULL
);
CREATE TABLE IF NOT EXISTS questoes (
	id VARCHAR(100) PRIMARY KEY,
	enunciado TEXT NOT NULL,
	opcao_id INTEGER NOT NULL REFERENCES opcao_questoes(id_opcao),
	resposta_correta CHAR(1) NOT NULL CHECK (resposta_correta IN ('A','B','C','D','E')),
	dificuldade_nivel VARCHAR(50) NOT NULL,
	fonte_id INTEGER REFERENCES fonte(id)
);
CREATE TABLE IF NOT EXISTS questoes_respondidas (
	id_resposta SERIAL PRIMARY KEY,
	usuario_id INTEGER NOT NULL REFERENCES cadastro_usuario(id_usuario) ON DELETE CASCADE,
	questao_id VARCHAR(100) NOT NULL REFERENCES questoes(id) ON DELETE CASCADE,
	resposta_usuario VARCHAR(1) NOT NULL CHECK (resposta_usuario IN ('A','B','C','D','E')),
	acerto BOOLEAN NOT NULL,
	data_resposta TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS solucionar (
	id_solucionar SERIAL PRIMARY KEY,
	usuario_id INTEGER NOT NULL REFERENCES cadastro_usuario(id_usuario) ON DELETE CASCADE,
	resposta_id INTEGER NOT NULL REFERENCES cadastro_usuario(id_usuario) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS possui (
	solucionar_id INT,
	ranking_id	INT,
	CONSTRAINT pk_possui PRIMARY KEY (solucionar_id,ranking_id),
	CONSTRAINT fk_solucionar foreign key (solucionar_id) references solucionar(id_solucionar),
	CONSTRAINT fk_ranking foreign key (ranking_id) references tabela_ranking(id_ranking)
);

COMMIT;
