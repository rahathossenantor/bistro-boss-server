const express = require("express");
const cors = require("cors");
require("dotenv").config();

const port = process.env.PORT || 5000;
const app = express();

// middlewares
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Bistro Boss 1.0");
});

app.listen(port, () => {
    console.log(`Server started on port: ${port}`);
});
