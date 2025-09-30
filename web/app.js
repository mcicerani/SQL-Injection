// web/app.js
// SQLi demo - login che mostra direttamente la pagina di search dopo login
// USARE SOLO IN LAB/AMBIENTE DI TEST - questo codice è INTENZIONALMENTE VULNERABILE

const express = require('express');
const mysql = require('mysql');
const path = require('path');
const session = require('express-session');

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// session semplice in-memory (solo per demo)
// in produzione usare store persistente e cookie secure
app.use(session({
  secret: 'demo_secret_change_me',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, httpOnly: true }
}));

// serve static files dalla cartella public
app.use(express.static(path.join(__dirname, 'public')));

// DB connection con retry (non fare uscire il processo se DB non pronto)
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
    multipleStatements: true // PER DEMO: abilita piggy-back (rimuovere in produzione)
  });

  db.connect((err) => {
    connecting = false;
    if (err) {
      console.error('DB connect error', err && err.code ? err.code : err);
      // riprova dopo 2s
      setTimeout(connectDB, 2000);
      return;
    }
    console.log('Connected to database');
  });

  db.on('error', (err) => {
    console.error('Database error:', err && err.code ? err.code : err);
    if (err && (err.code === 'PROTOCOL_CONNECTION_LOST' || err.fatal)) {
      console.log('Reconnecting to DB...');
      setTimeout(connectDB, 2000);
    }
  });
}
connectDB();

// middleware per proteggere le route che richiedono autenticazione
function requireLogin(req, res, next) {
  if (req.session && req.session.authenticated) return next();
  return res.redirect('/');
}

/*
  ROUTE:
  - GET /            -> login page (public/index.html)
  - POST /login      -> login vulnerabile (se OK: imposta sessione e risponde con la pagina di search)
  - GET /search      -> protetta: serve public/search.html
  - GET /search/result?user=... -> protetta: esegue query vulnerabile e mostra risultati
  - GET /logout      -> logout
*/

// POST /login (con redirect e flash via query)
app.post('/login', (req, res) => {
  const username = req.body.username || '';
  const password = req.body.password || '';

  const query = `SELECT id, username FROM users WHERE username = '${username}' AND password = '${password}'`;
  console.log(`Eseguo query (vulnerable login): ${query}`);

  if (!db || db.state === 'disconnected') {
    return res.status(503).send('<h3>Database non disponibile, riprova più tardi.</h3>');
  }

  db.query(query, (err, results) => {
    if (err) {
      console.error('Query error (login):', err);
      // redirect with error flag (puoi migliorare includendo un codice se vuoi)
      return res.redirect('/?error=1');
    }
    if (results.length > 0) {
      // login ok -> crea sessione
      req.session.authenticated = true;
      req.session.user = results[0].username;
      // redirect diretto a /search e flag di welcome
      return res.redirect('/search?justLogged=1');
    } else {
      // login fallito -> redirect alla home con flag di errore
      return res.redirect('/?error=1');
    }
  });
});

// endpoint che restituisce info sulla sessione (usato dal client per mostrare username)
app.get('/session-info', (req, res) => {
  if (req.session && req.session.authenticated) {
    return res.json({ user: req.session.user });
  }
  return res.status(401).json({ user: null });
});

// GET /search - protetta (serve il form di ricerca)
app.get('/search', requireLogin, (req, res) => {
  console.log('[DEBUG] GET /search session:', req.session && req.session.user);
  res.sendFile(path.join(__dirname, 'public', 'search.html'));
});

// GET /search/result - protetta - esegue la query vulnerabile e mostra risultati
app.get('/search/result', requireLogin, (req, res) => {
  const user = req.query.user || '';

  // VULNERABLE: concatenazione diretta (solo demo)
  const query = `SELECT id, username, password FROM users WHERE username = '${user}'`;
  console.log(`Eseguo (vulnerable search): ${query}`);

  if (!db || db.state === 'disconnected') {
    return res.status(503).send('<h3>Database non disponibile, riprova più tardi.</h3>');
  }

  db.query(query, (err, results) => {
    if (err) {
      console.error('Query error (search):', err);
      return res.status(500).send(`<pre>DB error: ${err.code}\n${err.sqlMessage || ''}</pre>`);
    }

    let html = `<h1>Search results (utente loggato: ${req.session.user})</h1>`;
    if (!results.length) html += '<p><i>Nessun risultato</i></p>';
    results.forEach(row => {
      html += `<p>id: ${row.id} - Name: ${row.username} - Password: ${row.password}</p>`;
    });
    html += `<p><a href="/search">Nuova ricerca</a> | <a href="/logout">Logout</a></p>`;
    res.send(html);
  });
});

// GET /logout
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

// help route (opzionale)
app.get('/help', (req, res) => {
  res.send(`<h2>Demo</h2>
    <p>Login (POST /login) e la pagina di search apparirà direttamente se l'autenticazione ha successo.</p>
    <p>Esempi payload login: <code>' OR '1'='1' --</code> | <code>admin' #</code></p>
    <p>Esempi payload search: <code>' UNION SELECT 1, username, password FROM users --</code></p>`);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
