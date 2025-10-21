---
title: "Resolvendo problema de performance no PostgreSQL com CTE"
slug: "resolvendo-problema-de-performance-no-postgresql-com-cte-468d"
published_at: "2022-06-13 16:41:39Z"
language: "pt-BR"
status: "published"
tags: ["sql", "postgres", "cte"]
---

**Spoiler**: *a query ficou 23x mais rápida com CTE's apenas transformando o problema quadrático em linear. Sem índices*.

Um dos [cenários mais comuns](https://dev.to/leandronsp/how-to-reduce-the-time-complexity-of-nested-loops-1lkd) de problemas de performance em software é o famoso **nested loop**.

Com o banco de dados não é diferente. Por vezes podemos acabar por escrever queries que apresentam complexidade quadrática, onde nossa primeira solução óbvia para melhorar a performance seria através da criação de **índices**. 

Neste artigo vou mostrar uma alternativa para este problema de nested loops em queries sem criar índices, apenas utilizando [CTE's](https://www.postgresql.org/docs/current/queries-with.html), ou *Common Table Expressions*.

## Setup
O setup deste artigo contém basicamente 3 tabelas contendo:

- 200 users
- 20 bancos
- 4000 contas bancárias
- 4000 transferências feitas entre diferentes contas

**Nota**: no final do artigo compartilho o link para o Gist com o código completo.

## Desafio
A ideia é que a query retorne a lista com todas as contas de diferentes bancos com seus respectivos saldos calculados:
![setup de dados](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/uckhspgfy565thdj41nr.png)

## Query com múltiplos JOIN's e SUM aggregate
A princípio, podemos escrever uma query que, a partir da tabela de **users**, faça `JOIN` com as tabelas **banco**, **accounts** e **transfers**, tal como a seguir:
```sql
SELECT
    users.name AS username,
    banks.name AS bank,
	SUM(CASE
		WHEN accounts.id = transfers.source_account_id
			THEN transfers.amount * -1
		WHEN accounts.id = transfers.target_account_id
			THEN transfers.amount
		ELSE
			0.00
		END)
	AS balance
FROM
    users
JOIN accounts ON accounts.user_id = users.id
JOIN banks ON banks.id = accounts.bank_idq
LEFT JOIN transfers ON
    transfers.source_account_id = accounts.id
    OR transfers.target_account_id = accounts.id
GROUP BY users.name, banks.name
ORDER BY username ASC, balance ASC
```
Ao executarmos a query com `EXPLAIN` no PgAdmin4, temos esta imagem que mostra o nested loop sendo utilizado e seu custo associado:

![explain](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/nsx0c233gptlsrex2ije.png)

![total cost](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/hkv4m1prur10l5g2al9e.png)

Com um total cost de **280k** no `JOIN` com *transfers*. Ou seja, é mesmo ali que está o gargalo na nossa query, que totaliza uma demora de **7000ms** (7 segundos) em média.

## Índices?
Uma possível solução passa por criar [índices](https://www.postgresql.org/docs/current/indexes.html). Neste nosso exemplo, cheguei a criar o índice na tabela de transfers (onde está acontecendo o nested loop):
```sql
DROP INDEX IF EXISTS transfers_in, transfers_out;
CREATE INDEX transfers_in ON transfers (target_account_id);
CREATE INDEX transfers_out ON transfers (source_account_id);
```
...o que reduziu a query de 7000ms para 400ms (melhoria gigante), mas o índice tem um custo: a cada escrita na tabela transfer, o índice é atualizado. 

Ok, mas há alternativa para este caso *específico* sem criação de índices? 

**Nota:** em apps de produção, é muito comum a utilização de índices. Mas não podemos abusar de índices por causa do impacto na escrita, pelo que estes têm de ser analisados e utilizados com parcimônia. 

## Reduzindo a complexidade do nested loop
Como já podemos saber, a melhor forma de resolver um algoritmo de complexidade quadrática (nested loops) é reduzindo-o para linear, logarítmica ou até mesmo, constante. 

Neste caso, analisamos que o melhor que podemos conseguir é reduzindo para linear, ou seja, **percorrendo a tabela transfers 1 ou 2 ou 3 vezes se for o caso, mas não de forma aninhada (nested)**.

Como podemos então fazer? Criar uma query com SELECTs e Sub-SELECTs? Talvez, mas a query ficaria *enorme* e bastante difícil de manter. 

## CTE's for the rescue
Sabemos que com [CTE's](https://www.postgresql.org/docs/current/queries-with.html), podemos organizar melhor nossas queries, quebrando uma query grande em diversas queries pequenas, facilitando a compreensão da mesma. 

E de quebra, isto pode ajudar a melhorar a performance, se conseguirmos escrever bem a query de forma linear (e não nested).

```sql
WITH 
accounts_idx AS(
    SELECT 
        accounts.id AS account_id,
        users.name AS username,
        banks.name AS bank
    FROM accounts
    JOIN users ON users.id = accounts.user_id
    JOIN banks ON banks.id = accounts.bank_id
),
accounts_from AS (
    SELECT 
        idx.username,
        idx.bank,
        SUM(transfers.amount * -1) AS balance
    FROM transfers
    JOIN accounts_idx idx ON idx.account_id = transfers.source_account_id
    GROUP BY idx.username, idx.bank
),
accounts_to AS (
    SELECT 
        idx.username,
        idx.bank,
        SUM(transfers.amount) AS balance
    FROM transfers
    JOIN accounts_idx idx ON idx.account_id = transfers.target_account_id
    GROUP BY idx.username, idx.bank
),
results AS (
    SELECT * FROM accounts_from
    UNION
    SELECT * FROM accounts_to
)
SELECT 
    username,
    bank,
    SUM(balance) AS balance
FROM results
GROUP BY username, bank
ORDER BY username ASC, balance ASC
```
Com o `WITH` do PostgreSQL, estamos criando 4 tabelas temporárias que estarão ativas apenas durante a execução da transação da query:

- **accounts_idx**, guarda a info dos users e bancos em uma hash
- **accounts_from**, percorre a tabela "transfers" buscando por saídas em contas
- **accounts_to**, percorre a tabela "transfers" buscando por entradas em contas
- **results**, que faz a UNION das CTE's

Esta é a técnica por trás da escrita de um código linear. O JOIN com `OR` na tabela `transfers` foi completamente removido!

E sobre o **UNION**, o truque é que, ao garantirmos que as CTE's têm a mesma quantidade de colunas, podemos projetar como um append, exatamente como na *união* de conjuntos.

## Analisando a query com CTE's
Agora podemos novamente analisar com EXPLAIN no PgAdmin4:

![explain cte](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/6w7iddgklcbhc2ioaf3y.png)
Podemos reparar que já não há mais o node de *Nested Loop*, pelo que é feito um **CTE scan** primeiro, que garante que os dados serão materializados de forma linear e posteriormente agregados e filtrados na query. 

Com isto, a query **reduziu de 7000ms para 300ms**! Sem necessidade de índices!

## Conclusão
Apesar de haver drawbacks com o uso de CTE's, pois podem ser materializadas sem necessidade e ocupar espaço demasiado, o uso consciente com query planner (EXPLAIN) pode ser um bom aliado para terminarmos com um código modular e performático sem abusar de índices!

Segue [link para o gist](https://gist.github.com/leandronsp/0f93c79ba70c2d44d150011a4c747604).

