-- init.sql
-- db della demo. piu' tabelle apposta, cosi' l'attaccante deve scoprire lo schema
-- (se ci fosse solo users non ci sarebbe niente da enumerare).

CREATE DATABASE IF NOT EXISTS testdb;
USE testdb;

-- utenti per il login (password in chiaro, di proposito)
CREATE TABLE IF NOT EXISTS users (
    id       INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50)  NOT NULL,
    password VARCHAR(50)  NOT NULL,
    ruolo    VARCHAR(20)  NOT NULL DEFAULT 'cliente'
);

-- tabella "sensibile" che l'attaccante non sa che esiste: e' il vero bersaglio
CREATE TABLE IF NOT EXISTS carte_credito (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    user_id      INT          NOT NULL,
    intestatario VARCHAR(80)  NOT NULL,
    numero       VARCHAR(20)  NOT NULL,
    cvv          VARCHAR(4)   NOT NULL,
    scadenza     VARCHAR(7)   NOT NULL
);

-- terza tabella, serve solo ad avere qualcosa in piu' da elencare
CREATE TABLE IF NOT EXISTS ordini (
    id       INT AUTO_INCREMENT PRIMARY KEY,
    user_id  INT           NOT NULL,
    prodotto VARCHAR(100)  NOT NULL,
    importo  DECIMAL(10,2) NOT NULL
);

INSERT INTO users (username, password, ruolo) VALUES
  ('admin',  'adminpass',   'admin'),
  ('user1',  'user1pass',   'cliente'),
  ('mrossi', 'primavera92', 'cliente');

INSERT INTO carte_credito (user_id, intestatario, numero, cvv, scadenza) VALUES
  (1, 'Mario Bianchi', '4539115678901234', '321', '11/27'),
  (2, 'Luigi Verdi',   '5105105105105100', '852', '03/26'),
  (3, 'Marco Rossi',   '4916338506082832', '147', '07/28');

INSERT INTO ordini (user_id, prodotto, importo) VALUES
  (2, 'Laptop ThinkPad', 1299.00),
  (3, 'Smartphone',       799.99);
