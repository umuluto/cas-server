import express from 'express';
import session from 'express-session';
import mysqlSession from 'express-mysql-session';
import bodyParser from 'body-parser';

import pool from "./db.js";
import predict, { forecast } from './predict.js';

const app = express();
const MySQLStore = mysqlSession(session);

const options = {
    user: 'root',
    database: 'fall_army_worm',
};

const sessionStore = new MySQLStore(options);

app.use(session({
    key: 'session_cookie_name',
    secret: 'session_cookie_secret',
    store: sessionStore,
    resave: false,
    saveUninitialized: false
}));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/api/locations', async (req, res) => {
    const rows = await pool.query("SELECT * FROM locations");
    const result = rows.map(obj => ({ location_id: obj.location_id, coordinates: obj.coordinates.coordinates }));
    res.send(result);
});

app.get('/api/history', async (req, res, next) => {
    const { location_id, start, end } = req.query;
    if (location_id === undefined || start === undefined || end === undefined) {
        return next();
    }

    const prediction = await predict(start, end, location_id, pool);
    return res.send(prediction);
});

app.get("/api/forecast", async (req, res, next) => {
    const { location_id } = req.query;
    if (location_id === undefined) {
        return next();
    }

    const [location] = await pool.query("SELECT * FROM locations WHERE location_id = ?", [location_id]);
    location.coordinates = location.coordinates.coordinates;
    const result = await forecast(location, pool);
    res.send(result);
});

app.post('/api/login', async (req, res, next) => {
    if (req.body.username === undefined | req.body.password === undefined) {
        return next();
    }

    const [credentials] = await pool.query("SELECT * FROM credentials WHERE username = ?", [req.body.username]);

    if (credentials?.password !== req.body.password) {
        return res.sendStatus(401);
    }

    req.session.username = credentials.username;
    res.sendStatus(200);
});

app.get('/api/logout', function (req, res, next) {
    req.session.destroy();
    res.sendStatus(200);
});


app.get('/api/expert/locations', async (req, res, next) => {
    if (!req.session.username) {
        return next();
    }

    const locations = await pool.query("SELECT * FROM locations WHERE username = ?", [req.session.username]);
    const result = locations.map(obj => ({ location_id: obj.location_id, coordinates: obj.coordinates.coordinates }));
    res.send(result);
});

app.get('/api/expert/observations', async (req, res, next) => {
    if (!req.session.username) {
        return next();
    }

    let { location_id, page } = req.query;
    if (location_id === undefined || page === undefined) {
        return next();
    }

    const observations = await pool.query(`
    SELECT * FROM observations
    JOIN weathers
    USING (location_id, date)
    WHERE
        location_id = ?
    ORDER BY date DESC
    LIMIT 14 OFFSET ?
    `, [location_id, page * 14]);

    res.send(observations);
});

app.post('/api/expert/insert', async (req, res, next) => {
    if (!req.session.username) {
        return next();
    }

    let { location_id, stage, date } = req.body;
    console.log(req.body)
    if (location_id === undefined || stage === undefined || date === undefined) {
        return next();
    }

    date = new Date(date * 1000);

    console.log("before")

    await pool.query(`
    REPLACE observations(date, location_id, stage)
    VALUES(?, ?, ?)`, [date, location_id, stage]);

    console.log("after")

    res.sendStatus(200);
});

const port = 4000;
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
});