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
        // connectionString: process.env.DATABASE_URL,
        ssl: false,
        host: '127.0.0.1',
        user: '',
        password: '',
        database: 'dailyrosary'
    }
});


app.get('/', (req, res) => {
    res.json('Hello World')
})

app.post('/signin', (req, res) => {
    const { email, password } = req.body
    if (!email || !password) {
        return res.status(400).json('incorrect form submission');
    }
    console.log(email, hash)
    db.select('email', 'hash').from('login')
        .where('email', '=', email)
        .then(data => {
            const isValid = bcrypt.compareSync(password, data[0].hash);
            if (isValid) {
                return db.select('*').from('users')
                    .where('email', '=', data[0].email)
                    .then(user => {
                        res.json(user)
                    })
                    .catch(err => res.status(400).json('Unable to signin'))
            }
            return res.status(400).json('wrong credentials 1')
        })
        .catch(err => console.log(err))
})

app.post('/profile', (req, res) => {
    const { id, prayed } = req.body
    console.log(id, prayed)
    db('users')
        .where({ id: id })
        .update({ prayed: prayed })
        .catch(err => res.status(400).json('unable to ge user'))
}
)

app.post('/register', (req, res) => {
    const { name, email, password } = req.body
    if(!email || !name || !password){
        return res.status(400).json('incorrect from submission');
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
                console.log(loginEmail)
                return db('users')
                    .returning('*')
                    .insert({
                        name: name,
                        email: loginEmail[0],
                        joined: new Date()
                    })
                    .then(user => res.json(user[0]))
                    .catch(err => res.json('not able to register'))
            })
            .then(trx.commit)
            .catch(trx.rollback)
    })
        .catch(err => res.status(400).json('unable to register'))
})



const usedPort = port || 3000
app.listen(usedPort, () => {
    console.log(`app is running on port: ${usedPort}`)
})

