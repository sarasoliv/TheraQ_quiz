# Marco M1 — Entregável: `entregas/01-contexto.md`

## 1. Introdução e contexto

### Contexto
O **TheraQ** é um projeto que tem como objetivo ensinar, de forma dinâmica e fácil, pessoas da área de tecnologia ou não, a partir do acidente do Therac-25 (ocorrido entre 1985 e 1987), sobre os perigos de confiar excessivamente em softwares sem mecanismos físicos de segurança, principalmente quando se trata de uma máquina que opera em prol da saúde.

O quiz permite ao usuário personalizar a dificuldade das perguntas que irá responder (**fácil, médio ou difícil**). Independentemente da dificuldade escolhida, cada rodada será composta por **10 perguntas selecionadas de forma aleatória**, garantindo que cada usuário tenha uma experiência única a cada novo questionário iniciado. Cada pergunta terá 5 opções de resposta (de A a E), sendo apenas uma correta. As questões são escolhidas criteriosa e cuidadosamente em fontes confiáveis e armazenadas em um Banco de Dados, juntamente com seu texto, resposta correta, explicação e nível de dificuldade.

Também haverá um Banco de Dados destinado ao armazenamento do nome de usuário e da pontuação total de cada jogador por partida, permitindo a geração de um ranking geral organizado de forma decrescente (do jogador com maior pontuação para o de menor pontuação).

### Escopo

| O banco faz | O banco não faz |
| :--- | :--- |
| Armazena dados do usuário ao se cadastrar | Exclui os dados de cadastro |
| Armazena credenciais de login | Bloqueia alteração das informações do perfil |
| Guarda a pontuação do usuário | Guarda as perguntas e respostas automaticamente no client |
| Ranqueia de forma decrescente a pontuação total do usuário | Guarda as respostas do quiz por tempo ilimitado |
| Armazena os dados de todas as questões cadastradas | Salva usernames iguais |

### Papéis e Acessos do Sistema

| Usuário | O que faz | Acessos |
| :--- | :--- | :--- |
| **Jogador** | Responde às perguntas do quiz e personaliza a dificuldade que seu quiz terá. | Acesso apenas à interface do quiz para jogar. |
| **Desenvolvedor** | Gerencia o servidor do quiz e faz atualizações conforme a necessidade a partir de sugestões. | Acesso aos códigos do sistema (front-end e back-end). |
| **Tester** | Faz o teste de mesa virtual e reporta bugs. | Acesso à interface do quiz, à tabela de questões e ao registro temporário das respostas dos jogadores. |
| **Analista de informações** | Confere a veracidade das perguntas e respostas. | Acesso à tabela em que são armazenadas temporariamente as perguntas. |

---

## 2. Minimundo

Somos estudantes da área de tecnologia e gostaríamos de criar um quiz interativo sobre o acidente do Therac-25, ocorrido entre os anos de 1985 e 1987. No quiz, o usuário poderá personalizar o nível de dificuldade do seu desafio (fácil, médio ou difícil). Independentemente do nível escolhido, **o sistema distribuirá 10 perguntas de forma aleatória por rodada**, proporcionando uma experiência única e renovada a cada partida. As questões são selecionadas de fontes confiáveis e armazenadas em um banco de dados relacional para evitar informações incorretas. Todas as perguntas contarão com 5 alternativas (A a E) e apenas 1 resposta correta. Após selecionar e enviar a opção desejada, o usuário receberá imediatamente o feedback com o gabarito e uma explicação detalhada sobre a resposta.

O sistema também contará com um ranking geral em ordem decrescente de pontuação, não permitindo o cadastro de usuários com nomes de usuário (*usernames*) repetidos.

A aplicação contará com recursos de acessibilidade e efeitos sonoros característicos ao acertar ou errar uma questão, inspirados em programas clássicos de perguntas e respostas (como o jogo do Silvio Santos). A interface deve ser clara e intuitiva em todas as etapas. Para o desenvolvimento do projeto, serão utilizadas estritamente as linguagens **JavaScript (JS)**, **C**, **HTML** e **CSS**, sem o uso de frameworks. O SGBD utilizado será o **PostgreSQL**, responsável pelo armazenamento de usuários, perguntas, respostas, pontuações e ranking.

---

## 3. Requisitos e regras de negócio

| Código | Texto do requisito | Tipo |
| :--- | :--- | :--- |
| **RA01** | O sistema permite ao usuário se cadastrar via *username*. | Requisito Funcional |
| **RA02** | O sistema realiza a somatória da pontuação ao final de cada desafio. | Requisito Funcional |
| **RA03** | Ao finalizar o questionário, o sistema exibe a pontuação final obtida. | Requisito Funcional |
| **RA04** | A resposta correta e sua explicação são apresentadas logo após o usuário confirmar a opção escolhida. | Requisito Funcional |
| **RA05** | O sistema permite selecionar o nível de dificuldade do questionário (Fácil, Médio ou Difícil). | Requisito Funcional |
| **RA06** | O sistema seleciona e distribui 10 perguntas aleatoriamente a cada novo questionário iniciado, independente da dificuldade, garantindo uma experiência única por rodada. | Requisito Não Funcional |
| **RA07** | O sistema possui recursos de acessibilidade e efeitos sonoros de acerto e erro. | Requisito Não Funcional |
| **RD01** | O sistema não armazena o histórico das perguntas respondidas no client após o encerramento do quiz. | Regra de Negócio |
| **RD02** | O sistema busca as perguntas aleatoriamente a partir do banco de dados alimentado por fontes confiáveis. | Regra de Negócio |
| **RD03** | O banco de dados armazena o *username* do jogador e suas pontuações para composição do ranking. | Regra de Negócio |
| **RD04** | O cadastro e a identificação do usuário serão feitos obrigatoriamente através de um *username* único (sem duplicidades). | Regra de Negócio |
