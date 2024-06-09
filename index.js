const express = require("express");
const cors = require("cors");
var jwt = require("jsonwebtoken");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());
const {
  MongoClient,
  ServerApiVersion,
  ObjectId,
  Timestamp,
} = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wotzmkf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const classesCollection = client.db("fitnessDb").collection("classes");
    const trainerCollection = client.db("fitnessDb").collection("trainers");
    const usersCollection = client.db("fitnessDb").collection("users");
    const trainerApplicationCollection = client
      .db("fitnessDb")
      .collection("trainerApplications");

    const subscriptionsCollection = client
      .db("fitnessDb")
      .collection("subscriptions");

      const trainerSlotsCollection = client.db("fitnessDb").collection("trainerSlots");
      

    // jwt related api
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res.send({ token });
    });

    // middlewares
    const verifyToken = (req, res, next) => {
      console.log("inside verify token", req.headers.authorization);
      if (!req.headers.authorization) {
        return res.status(401).send({ message: "unauthorized access" });
      }
      const token = req.headers.authorization.split(" ")[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: "unauthorized access" });
        }
        req.decoded = decoded;
        next();
      });
    };

    // Send a ping to confirm a successful connection

    // // save a user data in db
    app.put("/user", async (req, res) => {
      const user = req.body;
      const query = { email: user?.email };
      //check if user already exists in db
      const isExist = await usersCollection.findOne(query);
      if (isExist) return res.send(isExist);

      // save user for the first time
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          ...user,
          timestamp: Date.now(),
        },
      };
      const result = await usersCollection.updateOne(query, updateDoc, options);
      res.send(result);
    });

    // get a user info by email from db
    app.get("/user/:email", async (req, res) => {
      const email = req.params.email;
      const result = await usersCollection.findOne({ email });
      res.send(result);
    });

    // get all users data from db
    app.get("/users", verifyToken, async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    // get all classes from db
    app.get("/classes", async (req, res) => {
      const result = await classesCollection.find().toArray();
      res.send(result);
    });

    // Add new class
    app.post("/classes", async (req, res) => {
      const classData = req.body;
      console.log(classData);
      const result = await classesCollection.insertOne(classData);
      res.send(result);
    });

    // get all trainers from db
    app.get("/trainers", async (req, res) => {
      const result = await trainerCollection.find().toArray();
      res.send(result);
    });

    // get a single data all from db using id
    app.get("/trainer/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await trainerCollection.findOne(query);
      res.send(result);
    });

    // Add the new route here
    app.post("/trainerApplications", verifyToken, async (req, res) => {
      const trainerData = req.body;
      try {
        const result = await trainerApplicationCollection.insertOne(
          trainerData
        );
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Failed to save trainer data", error });
      }
    });

    // Handle subscription POST request
    app.post("/subscribe", async (req, res) => {
      const subscriptionData = req.body;
      try {
        const result = await subscriptionsCollection.insertOne(
          subscriptionData
        );
        res.send(result);
      } catch (error) {
        res
          .status(500)
          .send({ message: "Failed to save subscription data", error });
      }
    });

    // Endpoint to get all subscribers
    app.get("/subscribers", async (req, res) => {
      try {
        const result = await subscriptionsCollection.find().toArray();
        res.send(result);
      } catch (error) {
        res
          .status(500)
          .send({ message: "Failed to fetch subscribers data", error });
      }
    });


    // Add trainer slot
    app.post("/trainerSlots", verifyToken, async (req, res) => {
      const slotData = req.body;
      try {
        const result = await trainerSlotsCollection.insertOne(slotData);
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Failed to save slot data", error });
      }
    });



    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("fitness tracker is running");
});
app.listen(port, () => {
  console.log(`fitness tracker is running on port ${port}`);
});
