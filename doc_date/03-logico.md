# Passos 5 e 6 — Modelo lógico, normalização e dicionário

Marco M2. A entrega do passo 5 é o modelo lógico: o desenho em `entregas/03-logico.pdf` (ou `.png`) e este texto em `entregas/03-logico.md`.

O desenho parte do modelo conceitual e mostra tabelas, colunas, chave primária e chaves estrangeiras. Não é outro DER. Pode ser feito no brModelo (modelo lógico) ou no Visual Paradigm Online. Se a normalização achar violação, corrijam o desenho e o texto.

## 5. Modelo lógico

| Relacionamento no DER         | Cardinalidade | Vira         | Onde fica a FK ou a tabela associativa            |
| ----------------------------- | ------------- | ------------ | ------------------------------------------------- |
| Usuário – Quiz                | 1:N           | FK no lado N | FK em Quiz (id_usuario)                           |
| Quiz – Pergunta               | 1:N           | FK no lado N | FK em Pergunta (id_quiz)                          |
| Pergunta – Resposta           | 1:N           | FK no lado N | FK em Resposta (id_pergunta)                      |
| Usuário – Quiz (participação) | N:N           | Associativa  | Tabela Usuário_Quiz com FKs (id_usuario, id_quiz) |

N:N vira tabela associativa. 1:N vira chave estrangeira no lado N.

### Normalização

Dependências no formato `determinante → dependente`, com o requisito que sustenta.

| ID  | Dependência                               | Requisito                                                                 |
| --- | ----------------------------------------- | ------------------------------------------------------------------------- |
| DF1 | id_usuario → nome, email                  | Cada usuário é identificado unicamente por seu ID.                        |
| DF2 | id_quiz → titulo, descricao               | Cada quiz tem título e descrição únicos para seu identificador.           |
| DF3 | id_pergunta → enunciado                   | O enunciado depende apenas da pergunta, não do quiz.                      |
| DF4 | id_resposta → texto, correta              | Cada resposta é identificada pelo seu ID e contém o texto e se é correta. |
| DF5 | (id_usuario, id_quiz) → data_participacao | A participação é identificada pela combinação usuário + quiz.             |

Todas as tabelas estão em 3FN:

- Não há atributos multivalorados.
- Não há dependências transitivas.
- Cada atributo depende apenas da chave primária da tabela.

| Forma | Por que o esquema atende                                                                                                                                                                                                             | Tabela em que isso aparece                       |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------ |
| 1FN   | Valores atômicos; grupo multivalorado separado. As informações são armazenadas individualmente, sem listas ou valores repetidos em uma mesma coluna.                                                                                 | Usuário, Quiz, Pergunta, Resposta e Usuário_Quiz |
| 2FN   | Sem dependência parcial de chave composta. As tabelas Usuário, Quiz, Pergunta e Resposta possuem chaves primárias simples. Na tabela Usuário_Quiz, a data de participação depende da combinação completa entre id_usuario e id_quiz. | Usuário_Quiz                                     |
| 3FN   | Sem dependência transitiva. O que não é chave e determina outro atributo está em tabela própria. As informações de usuários, quizzes, perguntas e respostas são armazenadas separadamente e relacionadas por chaves estrangeiras.    | Usuário, Quiz, Pergunta, Resposta e Usuário_Quiz |

Se alguma forma falhar: o que mudou neste dicionário.

Nenhuma das formas normais apresentou violação. O modelo foi estruturado para atender à 1FN, 2FN e 3FN. A tabela associativa Usuário_Quiz foi utilizada para representar o relacionamento N:N, evitando redundância de dados e garantindo a organização das informações.

## 6. Dicionário de dados

Repitam o bloco para cada tabela. A descrição diz o que a coluna guarda, em uma linha.

### Tabela: Usuário

| Coluna     | Tipo e tamanho | Nulo     | Restrição | Descrição                              |
| ---------- | -------------- | -------- | --------- | -------------------------------------- |
| id_usuario | INTEGER        | NOT NULL | PK        | Identificador único do usuário.        |
| nome       | VARCHAR(100)   | NOT NULL | —         | Nome do usuário cadastrado no sistema. |
| email      | VARCHAR(150)   | NOT NULL | UNIQUE    | Endereço de e-mail do usuário.         |

### Tabela: Quiz

| Coluna     | Tipo e tamanho | Nulo     | Restrição               | Descrição                                              |
| ---------- | -------------- | -------- | ----------------------- | ------------------------------------------------------ |
| id_quiz    | INTEGER        | NOT NULL | PK                      | Identificador único do quiz.                           |
| titulo     | VARCHAR(150)   | NOT NULL | —                       | Título do quiz cadastrado.                             |
| descricao  | VARCHAR(500)   | NULL     | —                       | Descrição do conteúdo ou objetivo do quiz.             |
| id_usuario | INTEGER        | NOT NULL | FK → Usuário.id_usuario | Identifica o usuário responsável pela criação do quiz. |

### Tabela: Pergunta

| Coluna      | Tipo e tamanho | Nulo     | Restrição         | Descrição                                      |
| ----------- | -------------- | -------- | ----------------- | ---------------------------------------------- |
| id_pergunta | INTEGER        | NOT NULL | PK                | Identificador único da pergunta.               |
| enunciado   | VARCHAR(500)   | NOT NULL | —                 | Texto da pergunta apresentada no quiz.         |
| id_quiz     | INTEGER        | NOT NULL | FK → Quiz.id_quiz | Identifica o quiz ao qual a pergunta pertence. |

### Tabela: Resposta

| Coluna      | Tipo e tamanho | Nulo     | Restrição                 | Descrição                                          |
| ----------- | -------------- | -------- | ------------------------- | -------------------------------------------------- |
| id_resposta | INTEGER        | NOT NULL | PK                        | Identificador único da resposta.                   |
| texto       | VARCHAR(500)   | NOT NULL | —                         | Texto da alternativa de resposta.                  |
| correta     | BOOLEAN        | NOT NULL | DEFAULT FALSE             | Indica se a alternativa está correta ou incorreta. |
| id_pergunta | INTEGER        | NOT NULL | FK → Pergunta.id_pergunta | Identifica a pergunta à qual a resposta pertence.  |

### Tabela: Usuário_Quiz

| Coluna            | Tipo e tamanho | Nulo     | Restrição                             | Descrição                                                        |
| ----------------- | -------------- | -------- | ------------------------------------- | ---------------------------------------------------------------- |
| id_usuario        | INTEGER        | NOT NULL | PK composta / FK → Usuário.id_usuario | Identifica o usuário que participou do quiz.                     |
| id_quiz           | INTEGER        | NOT NULL | PK composta / FK → Quiz.id_quiz       | Identifica o quiz do qual o usuário participou.                  |
| data_participacao | TIMESTAMP      | NOT NULL | DEFAULT CURRENT_TIMESTAMP             | Armazena a data e o horário em que o usuário participou do quiz. |
