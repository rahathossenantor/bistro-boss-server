const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");

const port = process.env.PORT || 5000;
const app = express();

// middlewares
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Bistro Boss 1.0");
});

// MongoDB uri
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@junior.tpsklbw.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const menuCollection = client.db("bistroDB").collection("menu");
        const cartItemsCollection = client.db("bistroDB").collection("cartItems");

        // get all menu data from database
        app.get("/menu", async (req, res) => {
            const data = await menuCollection.find().toArray();
            res.send(data);
        });

        // get cart data based on user email
        app.get("/cart", async (req, res) => {
            const query = {};
            const email = req.query?.email;
            if (email) {
                query.email = email
            }
            const data = await cartItemsCollection.find(query).toArray();
            res.send(data);
        });

        // post cart data in database
        app.post("/cart", async (req, res) => {
            const data = req.body;
            const result = await cartItemsCollection.insertOne(data);
            res.send(result);
        });

        // delete cart item
        app.delete("/cart/:id", async (req, res) => {
            const id = req.params.id;
            const query = {_id: id};
            const result = await cartItemsCollection.deleteOne(query);
            res.send(result);
        });

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

app.listen(port, () => {
    console.log(`Server started at ${port} port`);
});

// bistroDB
// yjnBuKig6935lKo2
