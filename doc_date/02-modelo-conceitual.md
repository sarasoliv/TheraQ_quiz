# Passo 4 — Modelo conceitual

Marco M1. A entrega deste passo é o modelo conceitual: o desenho em `entregas/02-conceitual.pdf` (ou `.png`) e as tabelas abaixo.

É um DER na notação de Chen, no brModelo ou no Visual Paradigm Online. Entidades, atributos, relacionamentos e cardinalidades. Ainda não aparecem tabela, chave estrangeira nem tipo de coluna: isso é o modelo lógico, no passo 5.

Versão 1.0
***[Baixar DER em PDF] [02_conceitual_isabella_rodrygo_sara_yasmin.pdf](https://github.com/user-attachments/files/33519047/02_conceitual_isabella_rodrygo_sara_yasmin.pdf)***

Versão 2.0
***[Baixar DER em PDF] [02_conceitual_isabella_rodrygo_sara_yasmin_v2.pdf](https://github.com/user-attachments/files/34157275/02_conceitual_isabella_rodrygo_sara_yasmin_v2.pdf)***

## Entidades

| Entidade | Atributos | Identificador |
| --- | --- | --- |
| Cadastro_usuario | id_usuario, nome | id_usuario |
| Tabela_ranking | id_ranking, usuario_id, nome_jogador, pontuacao_jogador, total_acertos, data_jogado | id_ranking |
| Opcao_questoes | id_opcao, opcao_a, opcao_b, opcao_c, opcao_d, opcao_e | id_opcao |
| Fonte | id, referencia, url | id |
| Questoes | id, enunciado, opcao_id, resposta_correta, dificuldade_nivel, fonte_id | id |
| Questoes_respondidas | id_resposta, usuario_id, questao_id, resposta_usuario, acerto, data_resposta | id_resposta |
| Solucionar | id_solucionar, usuario_id, resposta_id | id_solucionar |
| Possui | solucionar_id, ranking_id | solucionar_id, ranking_id |

## Relacionamentos

Uma frase por linha, ligada a um requisito. Cardinalidade dos dois lados, mínimo e máximo.

| Relacionamento | Cardinalidade | Justificativa | Requisito |
| --- | --- | --- | --- |
| Contem (Questões / Opcao_questoes) | (0,N) , (1,1) | Uma questão possui obrigatoriamente 1 conjunto de opções, enquanto uma opção pode estar associada a nenhuma ou a várias questões. | Requisitos funcionais |
| Contem (Questões / Fonte) | (0,N) , (0,1) | Uma questão pode estar associada a no máximo 1 fonte (opcional), e uma fonte pode fundamentar nenhuma ou várias questões. | Requisitos funcionais |
| Soluciona (Cadastro_usuario / Questoes_respondidas) | (1,N) , (1,1) | O sistema pode gerar 10 perguntas fixas e para cada uma, uma resposta, e cada registro de resposta pertence obrigatoriamente a 1 usuário. | Regras de negócios |
| Contem (Questoes / Questoes_respondidas) | (1,N) , (1,1) | Uma questão pode ter sido respondida várias vezes ou nenhuma, e cada registro de resposta avalia obrigatoriamente 1 questão. | Regras de negócios |
| Possui (Cadastro_usuario / Tabela_ranking) | (0,N) , (0,1) | Um usuário pode ter zero ou vários registros de pontuação no ranking, e cada registro de ranking referencia um usuário. | Regras de negócios |
| Possui (Cadastro_usuario / Solucionar) | (1,N) , (1,1) | Um usuário pode ter vários registros de solução, e cada registro de solução está vinculado a 1 usuário. | Regras de negócios |
| Possui (Solucionar / Tabela_ranking) | (1,N) , (1,N) | Um registro da tabela associativa conecta instâncias de soluções enviadas com pontuações do ranking. | Regras de negócios |

O diagrama e esta tabela descrevem o mesmo modelo. Toda entidade do desenho está na tabela.
