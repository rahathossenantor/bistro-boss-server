const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const {MongoClient, ServerApiVersion, ObjectId} = require("mongodb");
const {sign} = require("jsonwebtoken");

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

        const userCollection = client.db("bistroDB").collection("users");
        const menuCollection = client.db("bistroDB").collection("menu");
        const cartItemsCollection = client.db("bistroDB").collection("cartItems");

        // jwt related APIs
        // custom (jwt) middlewares
        const verifyToken = (req, res, next) => {
            if (!req.headers.authorization) {
                return res.status(401).send({massage: "Unauthorized access!"});
            }
            const token = req.headers.authorization.split(" ")[1];
            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
                if (err) {
                    return res.status(401).send({massage: "Unauthorized access!"});
                }
                req.decoded = decoded;
                next();
            });
        };

        // verify is admin or not (use it after token verification)
        const verifyIsAdmin = async (req, res, next) => {
            const email = req.decoded.email;
            const query = {email: email};
            const user = await userCollection.findOne(query);
            let isAdmin = user?.role === "admin";

            if (!isAdmin) {
                return res.status(403).send({massage: "Forbidden access!"});
            }
            next();
        };

        // get jwt token
        app.post("/jwt", async (req, res) => {
            const userInfo = req.body;
            const token = jwt.sign(userInfo, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: "1h"
            });
            res.send({token});
        });

        // users related APIs
        // get all users data
        app.get("/users", verifyToken, verifyIsAdmin, async (req, res) => {
            const data = await userCollection.find().toArray();
            res.send(data);
        });

        // create new user in db
        app.post("/users", async (req, res) => {
            const userInfo = req.body;
            const email = userInfo?.email;
            const isExist = await userCollection.findOne({email});

            if (isExist) {
                return res.send({message: "user already exist!", insertedId: null});
            }

            const result = await userCollection.insertOne(userInfo);
            res.send(result);
        });


        // admin related APIs
        // update user roll
        app.patch("/users/admin/:id", verifyToken, verifyIsAdmin, async (req, res) => {
            const id = req.params.id;
            const filter = {_id: new ObjectId(id)};
            const updatedUserData = {
                $set: {
                    role: "admin"
                }
            };
            const result = await userCollection.updateOne(filter, updatedUserData);
            res.send(result);
        });

        // check is admin or not
        app.get("/users/admin/:email", verifyToken, async (req, res) => {
            const email = req.params.email;

            if (email !== req.decoded.email) {
                return res.status(403).send({massage: "Forbidden access!"});
            }
            const user = await userCollection.findOne({email});
            let isAdmin = false;
            if (user) {
                isAdmin = user?.role === "admin";
            }
            res.send({isAdmin});
        });

        // delete user
        app.delete("/users/:id", verifyToken, verifyIsAdmin, async (req, res) => {
            const id = req.params.id;
            const query = {_id: new ObjectId(id)};
            const result = await userCollection.deleteOne(query);
            res.send(result);
        });


        // menu related APIs
        // get all menu data from database
        app.get("/menu", async (req, res) => {
            const data = await menuCollection.find().toArray();
            res.send(data);
        });

        // add new menu item
        app.post("/menu", verifyToken, verifyIsAdmin, async (req, res) => {
            const menuItem = req.body;
            const result = await menuCollection.insertOne(menuItem);
            res.send(result);
        });

        // delete single menu item
        app.delete("/menu/:id", verifyToken, verifyIsAdmin, async (req, res) => {
            const id = req.params.id;
            const query = {_id: new ObjectId(id)};
            const result = await menuCollection.deleteOne(query);
            res.send(result);
        });


        // cart related APIs
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

        // delete single cart item
        app.delete("/cart/:id", async (req, res) => {
            const id = req.params.id;
            const query = {itemId: id};
            const result = await cartItemsCollection.deleteOne(query);
            res.send(result);
        });

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ping: 1});
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
