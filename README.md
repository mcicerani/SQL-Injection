# SQL-Injection

SQL Injection demo. Homework per esame di Sicurezza

Realizzare un attacco di SQL injection di tipo inband (ovvero stesso canale utilizzato per l’injection della query malevola e per ricevere i risultati), basato su input dell’utente (ovvero l’attaccante inietta i comandi SQL fornendo un input opportunamente costruito) e che utilizzi una o più delle seguenti modalità: Tautologia, commento di fine riga; query piggybacked.
Mediante l’injection di opportuni comandi mostrare che e’ sia possibile compromettere almeno due delle proprietà CIA.
Suggerimenti:

Supponete che il sistema da attaccare sia un server su cui e’ installato un DBMS, su cui risiede il database e su cui risiede l’applicazione web vulnerabile (ad esempio una pagina Php che genera query al DB).
Il server può’ essere emulato mediante una macchina virtuale o un docker container.
Scegliere versioni del software (OS, DB, Php, etc…) che siano vulnerabili ad attacchi SQLi.

Questo progetto dimostra come un attacco di SQL Injection possa compromettere la sicurezza di un'applicazione web vulnerabile. Utilizza Node.js, Express e MySQL in un ambiente Docker.

## Prerequisiti

- Docker
- Docker Compose

## Configurazione dell'Ambiente

1. Clonare il repository.
2. Eseguire `docker-compose up` per avviare l'ambiente Docker.

## Esecuzione degli Attacchi SQL Injection

1. Aprire un nuovo terminale.
2. Eseguire `docker-compose exec web npm run attack` per avviare gli attacchi automatizzati.

## Tipi di Attacchi Eseguiti

- **Tautologia**
- **Commento di Fine Riga**
- **Query Piggybacked**
- **Unione (UNION)**
- **Errore Basato (Error-Based)**
- **Subquery**

## Misure di Sicurezza

Implementare query preparate e sanitizzare l'input dell'utente per prevenire SQL Injection.
