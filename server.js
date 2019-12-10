const express = require('express');
const { port } = require('./config');
const bodyParser = require('body-parser');
const cors = require('cors');
const knex = require('knex');
const bcrypt = require('bcrypt');
const saltRounds = 10;

const app = express();

app.use(bodyParser.json())
app.use(cors())

const db = knex({
    client: 'pg',
    connection: {
        // heroku postgresql
        connectionString: process.env.DATABASE_URL
        // ssl: false,
        // host: '127.0.0.1',
        // user: '',
        // password: '',
        // database: 'dailyrosary'
    }
});

app.get('/', (req, res) => {
    res.json('Daily Rosary')
})

app.post('/signin', (req, res) => {
    const { email, password } = req.body
    if (!email || !password) {
        return res.status(400).json('incorrect form submission');
    }
    db.select('email', 'hash').from('login')
        .where('email', '=', email)
        .then(data => {
            const isValid = bcrypt.compareSync(password, data[0].hash);
            if (isValid) {
                return db.select('*').from('users')
                    .where('email', '=', data[0].email)
                    .then(user => {
                        res.json(user[0])
                    })
                    .catch(err => res.status(400).json('Unable to signin'))
            }
            return res.status(400).json('Wrong Credentials')
        })
            .catch(err => res.status(400))
})

app.post('/profile', (req, res) => {
    const { id, prayed, streak, level, lastlogouttime } = req.body
    db('users')
        .where({ id: id })
        .update({ prayed, streak, level, lastlogouttime })
        .then(data => {
            res.json(data)
        })
        .catch(err => res.status(400))
    }
)

app.post('/register', (req, res) => {
    const { firstName, lastName, email, password, joined } = req.body
    if (!email || !firstName || !lastName || !password || !joined) {
        return res.status(400).json('Incorrect form submission');
    }
    var hash = bcrypt.hashSync(password, saltRounds);
    db.transaction(trx => {
        trx.insert({
            hash: hash,
            email: email
        })
            .into('login')
            .returning('email')
            .then(loginEmail => {
                return db('users')
                    .returning('*')
                    .insert({
                        firstname: firstName,
                        lastname: lastName,
                        email: loginEmail[0],
                        joined
                    })
                    .then(user => res.json(user[0]))
                    .catch(err => res.json(err))
            })
            .then(trx.commit)
            .catch(trx.rollback)
    })
        .catch(err => res.status(400))
})

const usedPort = port || 3000
app.listen(usedPort, () => {
    console.log(`app is running on port: ${usedPort}`)
})