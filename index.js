const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId, ObjectID } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

function verifyJwt(req, res, next) {
    const authHeader = req?.headers?.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'Unauthorized Access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden Access' });
        }
        req.decoded = decoded;
        next();
    });
}

// use Middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vxz1z.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const userCollection = client.db("Mr-Computer-Tools").collection("users");
        const toolCollection = client.db("Mr-Computer-Tools").collection("tools");
        const orderCollection = client.db("Mr-Computer-Tools").collection("orders");
        const reviewCollection = client.db("Mr-Computer-Tools").collection("reviews");

        // Verify Admin
        const verifyAdmin = async (req, res, next) => {
            const requester = req.decoded.email;
            const requesterAccount = await userCollection.findOne({ email: requester });
            if (requesterAccount.role === 'admin') {
                next();
            } else {
                res.status(403).send({ message: 'Forbidden Access' });
            }
        }

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
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '20d' });
            res.send({ result, token });
        });

        // make user admin
        app.put("/user/admin/:email", verifyJwt, verifyAdmin, async (req, res) => {
            const email = req.params.email;
            const filter = { email: email };
            const updateDoc = {
                $set: { role: 'admin' },
            };
            const user = await userCollection.updateOne(filter, updateDoc);
            res.send(user);
        });

        app.get('/admin/:email', verifyJwt, async (req, res) => {
            const email = req.params.email;
            const user = await userCollection.findOne({ email: email });
            const isAdmin = user.role === 'admin';
            res.send({ admin: isAdmin });
        })

        // get all users
        app.get('/user', verifyJwt, async (req, res) => {
            const users = await userCollection.find().toArray();
            res.send(users);
        })

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
            const user = await userCollection.findOne(query);
            res.send(user);
        });

        // insert tools
        app.post('/tools', verifyJwt, verifyAdmin, async (req, res) => {
            const tool = req.body;
            const result = await toolCollection.insertOne(tool);
            res.send(result);
        });

        // get all tools
        app.get('/tools', async (req, res) => {
            const tools = await toolCollection.find().toArray();
            res.send(tools);
        });

        // get single tool by id
        app.get('/tools/:id', async (req, res) => {
            const toolId = req.params.id;
            const query = { _id: ObjectId(toolId) };
            const result = await toolCollection.findOne(query);
            res.send(result);
        });

        // insert user order in the database
        app.post('/order', verifyJwt, async (req, res) => {
            const order = req.body;
            const result = await orderCollection.insertOne(order);
            res.send(result);
        });

        // get user order by id
        app.get('/orders/:id', verifyJwt, async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const order = await orderCollection.findOne(query);
            res.send(order);
        });

        // get user order by email
        app.get('/order/:email', verifyJwt, async (req, res) => {
            const email = req.params.email;
            const order = await orderCollection.find({ email: email }).toArray();
            // console.log(order);
            res.send(order);
        });

        // cancel user order by id
        app.delete('/order/:id', verifyJwt, async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await orderCollection.deleteOne(query);
            res.send(result);
        });

        // insert user review
        app.post('/review', verifyJwt, async (req, res) => {
            const review = req.body;
            const result = await reviewCollection.insertOne(review);
            res.send(result);
        });

        // get user review
        app.get('/review', async (req, res) => {
            const reviews = await reviewCollection.find().toArray();
            res.send(reviews);
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