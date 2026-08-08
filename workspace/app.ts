import express from 'express';
import mysql from 'mysql';

const API_KEY = "sk_live_51Hz9k2LmN8qRvX3wPzT7Yb";    // dummy api key

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'admin123',
});

const app = express();

app.get('/user', (req, res) => {
    const userId = req.query.id;
    const query = `SELECT * FROM users WHERE id = ${userId}`;
    db.query(query, (err, results) => {
        res.json(results);
    });
});

app.listen(3000);
