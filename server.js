const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const redis = require('redis');
const jwt = require('jsonwebtoken');
const app = express();
const port = 3005;

// Middleware
app.use(bodyParser.json());

// MySQL connection
const db = mysql.createConnection({
  host: '192.168.64.104',
  user: 'site',
  password: 'site',
  database: 'projet_fin_annee'
});

db.connect((err) => {
  if (err) throw err;
  console.log('Connecté à la base MySQL');
});

// Redis client
const redisClient = redis.createClient();
redisClient.connect().then(() => console.log("Redis connecté"));

const SECRET_KEY = "secret123";

async function verifyToken(req, res, next) {
  let token = req.headers['authorization'];
  
  if (!token) {
    return res.status(403).send('Token requis');
  }

  // Nettoyage du token
  token = token.replace('Bearer ', '').trim(); //  TRIM = retire les \n, espaces, etc.

  console.log("🔐 Token reçu :", token);

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    console.log("Token décodé :", decoded);

    const stored = await redisClient.get(decoded.id);
    console.log(" Token en cache Redis :", stored);

    if (!stored || stored !== token) {
      return res.status(403).send('Token expiré ou modifié');
    }

    next();
  } catch (err) {
    console.error(" Erreur JWT :", err.message);
    res.status(403).send('Token invalide');
  }
}

// Authentification simple (admin)
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'admin') {
    const token = jwt.sign({ id: username }, SECRET_KEY, { expiresIn: '1h' });
    await redisClient.set(username, token);
    res.json({ token });
  } else {
    res.status(401).send('Identifiants invalides');
  }
});

// CRUD Utilisateurs
app.get('/utilisateurs', verifyToken, (req, res) => {
  db.query('SELECT * FROM Utilisateur', (err, results) => {
    if (err) res.status(500).json(err);
    else res.json(results);
  });
});

app.get('/utilisateurs/:id', verifyToken, (req, res) => {
  db.query('SELECT * FROM Utilisateur WHERE id = ?', [req.params.id], (err, results) => {
    if (err) res.status(500).json(err);
    else res.json(results[0]);
  });
});

app.post('/utilisateurs', verifyToken, (req, res) => {
  const { nom, prenom, id_rfid, is_prof } = req.body;
  db.query('INSERT INTO Utilisateur (nom, prenom, id_rfid, is_prof) VALUES (?, ?, ?, ?)',
    [nom, prenom, id_rfid, is_prof], (err) => {
      if (err) res.status(500).json(err);
      else res.json({ message: 'Utilisateur créé' });
    });
});

app.put('/utilisateurs/:id', verifyToken, (req, res) => {
  const { nom, prenom, id_rfid, is_prof } = req.body;
  db.query('UPDATE Utilisateur SET nom=?, prenom=?, id_rfid=?, is_prof=? WHERE id=?',
    [nom, prenom, id_rfid, is_prof, req.params.id], (err) => {
      if (err) res.status(500).json(err);
      else res.json({ message: 'Utilisateur modifié' });
    });
});

app.delete('/utilisateurs/:id', verifyToken, (req, res) => {
  db.query('DELETE FROM Utilisateur WHERE id = ?', [req.params.id], (err) => {
    if (err) res.status(500).json(err);
    else res.json({ message: 'Utilisateur supprimé' });
  });
});

// CRUD Plages Horaires
app.get('/plages', verifyToken, (req, res) => {
  db.query('SELECT * FROM PlagesHoraires', (err, results) => {
    if (err) res.status(500).json(err);
    else res.json(results);
  });
});

app.get('/plages/:jour/:heure', verifyToken, (req, res) => {
  db.query('SELECT * FROM PlagesHoraires WHERE jour = ? AND heure = ?',
    [req.params.jour, req.params.heure], (err, results) => {
      if (err) res.status(500).json(err);
      else res.json(results[0]);
    });
});

app.post('/plages', verifyToken, (req, res) => {
  const { jour, heure, cours } = req.body;
  db.query('INSERT INTO PlagesHoraires (jour, heure, cours) VALUES (?, ?, ?)',
    [jour, heure, cours], (err) => {
      if (err) res.status(500).json(err);
      else res.json({ message: 'Plage horaire ajoutée' });
    });
});

app.put('/plages/:jour/:heure', verifyToken, (req, res) => {
  const { cours } = req.body;
  db.query('UPDATE PlagesHoraires SET cours = ? WHERE jour = ? AND heure = ?',
    [cours, req.params.jour, req.params.heure], (err) => {
      if (err) res.status(500).json(err);
      else res.json({ message: 'Plage horaire modifiée' });
    });
});

app.delete('/plages/:jour/:heure', verifyToken, (req, res) => {
  db.query('DELETE FROM PlagesHoraires WHERE jour = ? AND heure = ?',
    [req.params.jour, req.params.heure], (err) => {
      if (err) res.status(500).json(err);
      else res.json({ message: 'Plage horaire supprimée' });
    });
});

// Lancer le serveur
app.listen(port, () => {
  console.log(`Serveur API lancé sur http://localhost:${port}`);
});