const express = require('express');
const mysql = require('mysql');
const app = express();

const db = mysql.createConnection({
  host: 'db',
  user: 'user',
  password: 'password',
  database: 'testdb'
});

db.connect((err) => {
  if (err) {
    console.error('Database connection failed: ' + err.stack);
    return;
  }
  console.log('Connected to database');
});

app.get('/', (req, res) => {
  const user = req.query.user;
  const query = `SELECT * FROM users WHERE username = '${user}'`;
  
  db.query(query, (error, results, fields) => {
    if (error) throw error;
    
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
