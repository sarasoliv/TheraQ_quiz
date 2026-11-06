-- Passo 8 — Carga de teste e consultas
-- Rode depois de 04-ddl.sql.
--   psql -d projeto_quiz_irsy -v ON_ERROR_STOP=1 -f 05-dml-consultas.sql
-- Troquem os nomes pelos do dicionário.

BEGIN;

-- Massa mínima, nesta ordem: categoria, publicador, fonte, pergunta.
-- No mínimo:
--   6 perguntas com id fact-001, fact-002, ...
--   2 categorias, uma com pelo menos 2 perguntas
--   2 publicadores, um com pelo menos 2 fontes
--   1 URL citada por 2 perguntas
--   uma pergunta cuja correta é Certo e outra cuja correta é Errado
-- Não insiram de novo categoria, publicador ou URL já gravados.

-- TODO: INSERT

--Inserção das Fontes
INSERT INTO fonte (id, referencia, url) VALUES 
(1, 'Leveson, Nancy G., & Turner, Clark S. (1993). An Investigation of the Therac-25 Accidents. IEEE Computer', 'https://sitem.herts.ac.uk/aer/papers/therac25.pdf'),
(2, 'Leveson, Nancy G. (1995). Safeware: System Safety and Computers', 'https://mitpress.mit.edu/9780201631210/safeware/'),
(3, 'U.S. Food and Drug Administration (FDA) / CDRH (1986–1987) - Documentos de Recall e CAP', 'https://www.fda.gov/medical-devices/medical-device-recalls'),

--Inserção das Opções
INSERT INTO opcao_questoes (Opcao_a, Opcao_b, Opcao_c, Opcao_d, Opcao_e) VALUES
('Um sistema de diagnóstico por imagem para detecção de tumores.', 'Um acelerador linear de elétrons utilizado em radioterapia para destruição de tecidos cancerígenos.', 'Um equipamento de ressonância magnética de alta precisão.', 'Um tomógrafo computadorizado com emissão de pósitrons (PET-Scan).', 'Um robô cirúrgico para procedimentos minimamente invasivos.'),
('General Electric Medical Systems Canada.', 'Siemens Healthineers Canada.', 'Bombardier Medical Robotics.', 'Atomic Energy of Canada Limited (AECL).', 'Philips Medical Systems Canada.'),
('1985 e 1987.', '1995 e 1998.', '1999 e 2000.', '1998 e 2002.', '1980 e 1985.'),
('8 acidentes.', '5 acidentes.', '6 acidentes.', '7 acidentes.', '4 acidentes.'),
('Certo', 'Errado', 'N/A', 'N/A', 'N/A'),
('Certo', 'Errado', 'N/A', 'N/A', 'N/A'),
    
--Inserção das Questões (IDs fact-001 a fact-006, incluindo Certo/Errado)
INSERT INTO questoes (id, Enunciado, opcao_id, Resposta_correta, dificuldade_nivel, fonte_id) VALUES
('fact-001', 'O que era exatamente o Therac-25 e qual era a sua finalidade primária na medicina?', 1, 'B', 'facil', 1),
('fact-002', 'Qual foi a empresa canadense responsável pelo projeto e fabricação do Therac-25?', 2, 'D', 'facil', 1),
('fact-003', 'Entre quais anos ocorreram os acidentes graves de sobredosagem de radiação documentados?', 3, 'A', 'medio', 1),
('fact-004', 'Quantos acidentes de sobredosagem massiva de radiação foram oficialmente confirmados pelo estudo de Leveson?', 4, 'C', 'medio', 1),
('fact-005', 'O projeto original do software do Therac-25 priorizou adequadamente a sincronização multithreading desde o início?', 5, 'B', 'medio', 2),
('fact-006', 'A ausência de intertravas mecânicas de segurança foi um fator determinante para a gravidade dos acidentes do Therac-25?', 6, 'A', 'facil', 3);

COMMIT;

-- RA01. Dificuldades (categorias) em ordem alfabética, com a quantidade de perguntas.
SELECT dificuldade_nivel AS categoria, COUNT(id) AS total_perguntas
FROM questoes
GROUP BY dificuldade_nivel
ORDER BY dificuldade_nivel ASC;


-- RA02a. Uma pergunta aleatória, de qualquer dificuldade.
SELECT id, Enunciado, dificuldade_nivel
FROM questoes
ORDER BY RANDOM()
LIMIT 1;


-- RA02b. Uma pergunta aleatória de uma dificuldade recebida por parâmetro.
-- Substitua 'facil' pelo nível desejado ('facil', 'medio', 'dificil').
SELECT id, Enunciado, dificuldade_nivel
FROM questoes
WHERE dificuldade_nivel = 'facil'
ORDER BY RANDOM()
LIMIT 1;


-- RA03. Título (ID), enunciado e alternativas de uma pergunta.
-- Substitua 'fact-001' pela questão desejada.
SELECT 
    q.id AS id_pergunta, 
    q.Enunciado, 
    o.Opcao_a, 
    o.Opcao_b, 
    o.Opcao_c, 
    o.Opcao_d, 
    o.Opcao_e
FROM questoes q
JOIN opcao_questoes o ON q.opcao_id = o.id_opcao
WHERE q.id = 'fact-001';


-- RA04. Dada a pergunta e a alternativa escolhida, se acertou.
-- Prova com a alternativa correta e com a errada para a questão 'fact-001':

-- Teste com a alternativa CORRETA (para 'fact-001', a resposta correta é 'B'):
SELECT 
    'fact-001' AS questao,
    'B' AS alternativa_escolhida,
    CASE WHEN 'B' = Resposta_correta THEN 'Acertou' ELSE 'Errou' END AS resultado
FROM questoes WHERE id = 'fact-001';

-- Teste com a alternativa ERRADA:
SELECT 
    'fact-001' AS questao,
    'A' AS alternativa_escolhida,
    CASE WHEN 'A' = Resposta_correta THEN 'Acertou' ELSE 'Errou' END AS resultado
FROM questoes WHERE id = 'fact-001';


-- RA05. Explicação e fonte: referência da fonte da questão.
SELECT 
    q.id AS questao,
    f.referencia AS fonte_referencia
FROM questoes q
JOIN fontes f ON q.fonte_id = f.id
WHERE q.id = 'fact-001';


-- RA06. Como não há publicadores, listamos as fontes mais citadas com o número de perguntas.
SELECT 
    f.id AS fonte_id,
    f.referencia, 
    COUNT(q.id) AS total_perguntas
FROM fonte f
JOIN questoes q ON f.id = q.fonte_id
GROUP BY f.id, f.referencia
ORDER BY total_perguntas DESC;


-- RA07. Fontes citadas por mais de uma pergunta.
SELECT 
    f.id AS fonte_id,
    f.referencia, 
    COUNT(q.id) AS quantidade_perguntas
FROM fonte f
JOIN questoes q ON f.id = q.fonte_id
GROUP BY f.id, f.referencia
HAVING COUNT(q.id) > 1
ORDER BY quantidade_perguntas DESC;
