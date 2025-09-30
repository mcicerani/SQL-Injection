// app.js - SQLi demo (VULNERABLE) - usare SOLO in ambiente di test
const express = require('express');
const mysql = require('mysql');
const path = require('path');

const app = express();
app.use(express.urlencoded({ extended: false })); // parse form urlencoded
app.use(express.json());

// serve static frontend da web/public (metti index.html in web/public)
app.use(express.static(path.join(__dirname, 'public')));

let db;
let connecting = false;

function connectDB() {
  if (connecting) return;
  connecting = true;

  db = mysql.createConnection({
    host: process.env.DB_HOST || 'db',
    user: process.env.DB_USER || 'user',
    password: process.env.DB_PASS || 'password',
    database: process.env.DB_NAME || 'testdb',
    multipleStatements: true // PER DEMO: permette piggy-back / stacked queries
  });

  db.connect((err) => {
    connecting = false;
    if (err) {
      console.error('DB connect error', err.code || err);
      // riprova dopo 2 secondi
      setTimeout(connectDB, 2000);
      return;
    }
    console.log('Connected to database');
  });

  db.on('error', (err) => {
    console.error('Database error:', err.code || err);
    // se la connessione è persa, prova a riconnettere
    if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.fatal) {
      console.log('Reconnecting to DB...');
      setTimeout(connectDB, 2000);
    }
  });
}

// Avvia la connessione (gestita con retry)
connectDB();

// --- ROUTES VULNERABILI PER LA DEMO ---

// GET /search?user=...  -> stampa risultati della query (vulnerabile)
app.get('/search', (req, res) => {
  const user = req.query.user || '';
  // VULNERABLE: concatenazione diretta (per demo)
  const query = `SELECT id, username, password FROM users WHERE username = '${user}'`;

  console.log(`Executing (vulnerable) query: ${query}`);

  // Se DB non è pronto, rispondi con messaggio amichevole
  if (!db || db.state === 'disconnected') {
    return res.status(503).send('<h3>Database non disponibile, riprova fra poco.</h3>');
  }

  db.query(query, (err, results) => {
    if (err) {
      console.error('Query error: ', err);
      return res.status(500).send(`<pre>DB error: ${err.code}\n${err.sqlMessage || ''}</pre>`);
    }

    let html = '<h1>Users</h1>';
    if (!results.length) html += '<p><i>Nessun risultato</i></p>';
    results.forEach(row => {
      html += `<p>id: ${row.id} - Name: ${row.username} - Password: ${row.password}</p>`;
    });
    res.send(html);
  });
});

// POST /login -> demo login vulnerabile (form POST from /)
app.post('/login', (req, res) => {
  const username = req.body.username || '';
  const password = req.body.password || '';

  // VULNERABLE: concatenazione diretta (mostrare per demo)
  const query = `SELECT id, username FROM users WHERE username = '${username}' AND password = '${password}'`;
  console.log(`Eseguo query (vulnerable): ${query}`);

  if (!db || db.state === 'disconnected') {
    return res.status(503).send('<h3>Database non disponibile, riprova fra poco.</h3>');
  }

  db.query(query, (err, results) => {
    if (err) {
      console.error('Query error:', err);
      return res.status(500).send('Errore DB');
    }
    if (results.length > 0) {
      const u = results[0];
      return res.send(`<h2>Login OK: ${u.username} (id=${u.id})</h2>`);
    } else {
      return res.status(401).send('<h2>Login fallito</h2>');
    }
  });
});

// Optional: route che mostra le istruzioni base (se vuoi)
app.get('/help', (req, res) => {
  res.send(`
    <h2>Demo SQLi - istruzioni</h2>
    <p>Usa il form in <a href="/">frontend</a> oppure /search?user=...</p>
    <ul>
      <li>Tautology (bypass): <code>' OR '1'='1' --</code></li>
      <li>Commento EOL (mirato): <code>admin' --</code></li>
      <li>Piggy-back (UPDATE example): <code>anything'; UPDATE testdb.users SET password='pwned' WHERE username='admin'; --</code></li>
    </ul>
    <p><strong>ATTENZIONE:</strong> piggy-back è distruttivo; fai backup prima.</p>
  `);
});

// start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
