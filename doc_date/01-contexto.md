# Passos 1 a 3 — Contexto, minimundo e requisitos

Marco M1. Copiem para `entregas/01-contexto.md`.

## 1. Introdução e contexto

## Contexto 

O TheraQ é um projeto que tem como objetivo ensinar, de forma dinâmica e fácil, as pessoas da área de tecnologia ou não, a partir do acidente do Therac-25, ocorrido entre os anos de 1985 e 1987, como é perigoso confiar excessivamente em softwares sem mecanismos físicos de segurança, principalmente quando se trata de uma máquina que opera em prol da saúde das pessoas.

O quiz tem como funções permitir que o usuário personalize a dificuldade das perguntas que irá responder. Cada pergunta terá cinco opções de resposta, de A a E a princípio, sendo apenas uma delas a correta. As questões são escolhidas a dedo em fontes confiáveis e armazenadas em um Banco de Dados, juntamente com a pergunta, sua respectiva resposta e seu nível de dificuldade.

Também haverá um Banco de Dados destinado ao armazenamento da pontuação total de cada jogador por partida, com as pontuações separadas por nível de dificuldade. A partir desses dados, será possível gerar um ranking, organizado do jogador com maior pontuação para o jogador com menor pontuação.

## Escopo 

| O banco faz | O banco não faz |
| --- | --- |
| Armazena dados do usuário ao se cadastrarem | Exclui os dados de cadastro |
| Bloqueia alteração das informações do perfil | Armazena credenciais de login |
| Guarda as perguntas e respostas automaticamente | Guarda as respostas do quiz por tempo ilimitado |
| Guarda a pontuação do usuário | Salva usernames iguais |
| Ranqueia de forma decrescente a pontuação total do usuário | Armazena os dados de todas as questões de uma vez |

| Usuário | O que faz | Acessos
| --- | --- | --- |
| Jogador | Responde às perguntas do quiz e personaliza a dificuldade que seu quiz terá| Acesso apenas a interface do quiz para jogar |
| Desenvolvedor | Quem gerencia o servidor do quiz e faz atualizações conforme necessidade a partir de sugestões de usuários. | Acesso aos códigos por tras do quiz como o back-end e fornt-end |
| Tester | Faz o teste de mesa virtual e reporta bugs. | Acesso a interface do quiz para jogar como um usuario comum mas tendo acesso a tabela de questoes e tabela em que mostra as respostas que os jogadores deram |
| Analista de informações | Confere a veracidade das perguntas e respostas. | Acesso a tabela em que se é armazenado temporariamente as perguntas |

## 2. Minimundo

Somos estudantes da área de tecnologia e gostaríamos que você criasse um quiz sobre o acidente do Therac-25, ocorrido entre os anos de 1985 e 1987. No quiz, quero que seja possível escolher a dificuldade e a quantidade de perguntas que o usuário deseja responder. As questões são escolhidas a dedo em fontes confiáveis e armazenadas em um banco de dados, evitando fontes suspeitas ou informações sem comprovação para reduzir a possibilidade de erros. Todas as perguntas deverão ter alternativas de A a E a princípio, contendo apenas uma resposta correta. Após o usuário selecionar e enviar sua resposta, deverá ser mostrada a resposta correta juntamente com uma explicação do motivo pelo qual ela está correta. Também quero um ranking para mostrar as pessoas que mais acertaram as perguntas, sem permitir o cadastro de usuários com o mesmo nome de usuário (username).

Gostaria que o quiz tivesse recursos de acessibilidade e sons para quando o usuário acertar ou errar, semelhantes aos utilizados em programas de perguntas e respostas, como o antigo jogo de perguntas do Silvio Santos. A interface deve ser intuitiva, permitindo que o usuário tenha clareza sobre o que está fazendo em cada etapa do quiz. Para o desenvolvimento do projeto, deverão ser utilizadas apenas as linguagens JavaScript (JS), C, HTML e CSS, sem a utilização de frameworks. O banco de dados deverá utilizar PostgreSQL como SGBD, sendo responsável pelo armazenamento das informações necessárias para o funcionamento do sistema, como usuários, perguntas, respostas, pontuações e ranking.

## 3. Requisitos e regras de negócio

| Código | Texto do requisito | Tipo |
| --- | --- | --- |
| RA01 | O sistema permite ao usuário se cadastrar. | Requisito funcional |
| RA02 | É feita uma somatória da pontuação ao final de cada desafio. | Requisito funcional |
| RA03 | Ao finalizar o questionário, o sistema entrega a pontuação. | Requisito funcional |
| RA04 | A resposta é apresentada logo após o usuário escolher sua opção à pergunta feita. | Requisito funcional |
| RA05 | É possível selecionar o nível de dificuldade, sendo fácil, médio e difícil. | Requisito funcional |
| RA06 | O sistema do quiz gera as perguntas automaticamente a cada novo questionário aberto. | Requisito não funcional |
| RA07 | O sistema gera 10 perguntas a cada questionário iniciado. | Requisito não funcional |
| RD01 | O sistema não armazena as perguntas das questões após encerrar o quiz. | Regra de negócios |
| RD02 | O sistema gera as perguntas aleatoriamente baseada em fontes específicas. | Regra de negócios |
| RD03 | O sistema possui recursos de acessibilidade. | Regra de negócios |
| RD04 | O banco de dados guarda a pontuação e o nome do usuário que a fez. | Regra de negócios |
| RD05 | O cadastro será feito através do nome de usuário. | Regra de negócios |
