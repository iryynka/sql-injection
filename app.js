const express = require('express');
const path = require('path');
const pgp = require('pg-promise')(/* options */)
const session = require('express-session');
const bodyParser = require('body-parser');
const db = pgp('postgres://postgres:postgres@localhost:5432/postgres')
const app = express();
const PORT = process.env.PORT || 3000;

app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));
app.use(express.json());

//connect to database
app.use(bodyParser.urlencoded({extended: true}));


async function tableInit() {
    try {
        const query = `CREATE TABLE IF NOT EXISTS public."Users"
                       (
                           "ID"       SERIAL PRIMARY KEY,
                           "USERNAME" VARCHAR(255) UNIQUE NOT NULL,
                           "PASSWORD" VARCHAR(255) UNIQUE NOT NULL
                       )`
        const result = await db.query(query)
        console.log('Success.')
    } catch (err) {
        console.log("Error:", err)
    }
}

async function userInit() {
    try {
        const result = await db.one(`SELECT COUNT(*)
                                     FROM public."Users"`);
        if (result.count > 0) {
            await db.none(`TRUNCATE public."Users"`)
        }
        console.log(result);
        await db.none(`INSERT INTO public."Users"
                       VALUES ('1', 'Iryna', '123'),
                              ('2', 'Anastasiia', '222'),
                              ('3', 'Sofia', '010'),
                              ('4', 'admin', '111')`);
        console.log('Users added successfully.')
    } catch (err) {
        console.log("Error in userInit", err);
    }
}

tableInit().then(r => userInit());


// placeholder for getting all rows from db table


//

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/login',(req,res)=>{
    res.sendFile(path.join(__dirname,'index.html'))
})

app.post('/login', async (req, res) => {
    const {username, password} = req.body;
    console.log('username:', username);
    console.log('password:', password);
    const user = await db.any(`SELECT *
                               FROM public."Users"
                               WHERE "USERNAME" = '${username}'
                                 AND "PASSWORD" = '${password}'`);
    if (user.length > 0) {
        req.session.loggedin = true;
        req.session.username = username;
        res.redirect('/profile');
    } else {
        res.send("Incorrect Username and Password. Please, try again...")
    }

})

app.get('/logout', (req,res)=>{
    req.session.destroy(err=>{
        if(err){
            console.log("Error destroying session:", err);
            res.status(500).send("Error destroying session");
        }else{
            console.log('redirect...')
            res.redirect('/login')
        }
    })
})
app.get('/profile', (req, res) => {
    //   res.send(`Welcome ${req.session.user.username}`);
    res.sendFile(path.join(__dirname, '/components/profile.html'));
})

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, '/')));
app.use(express.static(path.join(__dirname, '/components')));

// Define a route to serve the index.html file


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

