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
    console.log(email, password)
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
        .catch(err => console.log(err))
})

app.post('/profile', (req, res) => {
    const { id, prayed, streak, level } = req.body
    console.log('me llamaronnnnnnnnnnnnnn')
    console.log(id, prayed, streak, level)
    db('users')
        .where({ id: id })
        .update({ prayed, streak, level })
        .then(data=> {
            console.log(data)
          res.json(data)  
        })
        .catch(err => res.status(400).json(err))
}

)

app.post('/register', (req, res) => {
    const { firstName, lastName, email, password } = req.body
    if(!email || !firstName || !lastName || !password){
        return res.status(400).json('Incorrect form submission');
    }
    var hash = bcrypt.hashSync(password, saltRounds);
    console.log(firstName, lastName, email, password, hash)
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
                        firstname:firstName,
                        lastname: lastName,
                        email: loginEmail[0]
                    })
                    .then(user => res.json(user[0]))
                    .catch(err => res.json(err))
            })
            .then(trx.commit)
            .catch(trx.rollback)
    })
        .catch(err => res.status(400).json(err))
})



const usedPort = port || 3000
app.listen(usedPort, () => {
    console.log(`app is running on port: ${usedPort}`)
})

// onSubmitSignIn = () => {

//     fetch("https://mighty-inlet-18738.herokuapp.com/signin", {
//       method: "post",
//       headers: { "content-type": "application/json" },
//       body: JSON.stringify({
//         email: this.state.signInEmail,
//         password: this.state.signInPassword
//       })
//     })
//       .then(response => response.json())
//       .then(user => {
//         if (user[0].id) {
//           this.props.loadUser(user[0]);
//           this.props.onRouteChange("home");
//         }
//       });
//   };