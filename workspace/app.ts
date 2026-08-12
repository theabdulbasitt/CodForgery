import express from 'express';
import mysql from 'mysql';

const API_KEY = process.env.API_KEY;    // dummy api key

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: process.env.DB_PASSWORD || '',
});

const app = express();

const authMiddleware = (req, res, next) => {
  const key = req.headers['x-api-key'];
  if (!key || key !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

app.get('/user', authMiddleware, (req, res) => {
    const userId = req.query.id;
    const query = "SELECT * FROM users WHERE id = ?";
    db.query(query, [userId], (err, results) => {
        res.json(results);
    });
});

app.listen(3000);
