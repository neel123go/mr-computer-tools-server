const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

// use Middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vxz1z.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const userCollection = client.db("Mr-Computer-Tools").collection("users");

        // update or insert verify user in the database
        app.put("/user/:email", async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: user,
            };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET);
            res.send({ result, token });
        });

        // Update user name in the database
        app.put("/userName/:email", async (req, res) => {
            const email = req.params.email;
            const userName = req.body;
            const filter = { email };
            const options = { upsert: true };
            const updateDoc = {
                $set: userName,
            };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            res.send(result);
        });

        // get user by email
        app.get("/user/:email", async (req, res) => {
            const email = req.params.email;
            const query = { email };
            console.log(query)
            const user = await userCollection.findOne(query);
            res.send(user);
        });

    } finally {

    }
}

run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Hello World');
});

app.listen(port, () => {
    console.log('Listening the port', port);
});