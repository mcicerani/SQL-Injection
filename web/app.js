const express = require('express');
const mysql = require('mysql');
const app = express();

let db;

function handleDisconnect() {
  db = mysql.createConnection({
    host: 'db',
    user: 'user',
    password: 'password',
    database: 'testdb'
  });

  db.connect((err) => {
    if (err) {
      console.error('Error connecting to database:', err);
      setTimeout(handleDisconnect, 2000);  // Ritenta la connessione dopo 2 secondi
    } else {
      console.log('Connected to database');
    }
  });

  db.on('error', (err) => {
    console.error('Database error:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      handleDisconnect();
    } else {
      throw err;
    }
  });
}

handleDisconnect();

app.get('/', (req, res) => {
  const user = req.query.user || '';
  const query = `SELECT * FROM users WHERE username = ?`;

  console.log(`Executing query: ${query}`);
  
  db.query(query, [user], (error, results, fields) => {
    if (error) {
      console.error('Query error: ', error);
      return res.status(500).send('Database query failed');
    }

    let response = '<h1>Users</h1>';
    results.forEach(row => {
      response += `<p>id: ${row.id} - Name: ${row.username} - Password: ${row.password}</p>`;
    });
    res.send(response);
  });
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
