const express = require("express");
const cors = require("cors");
var jwt = require("jsonwebtoken");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 5000;

// middleware
//Must remove "/" from your production URL
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://fitness-tracker-b2f74.web.app",
      "https://fitness-tracker-b2f74.firebaseapp.com",
      "https://jade-gingersnap-ed17f2.netlify.app",
    ],
    credentials: true,
  })
);
app.use(express.json());
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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
    const classCollection = client.db("fitnessDb").collection("class");
    const trainerCollection = client.db("fitnessDb").collection("trainers");
    const slotsCollection = client.db("fitnessDb").collection("slots");

    const slotCollection = client.db("fitnessDb").collection("slot");

    const forumCollection = client.db("fitnessDb").collection("forum");
    const reviewCollection = client.db("fitnessDb").collection("review");

    const usersCollection = client.db("fitnessDb").collection("users");
    const paymentCollection = client.db("fitnessDb").collection("payment");

    const subscribeCollection = client
      .db("fitnessDb")
      .collection("subscribers");

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
    app.get("/slot-slot", verifyToken, async (req, res) => {
      const result = await slotsCollection
        .find({
          status: "pending",
        })
        .toArray();
      res.send(result);
    });

    app.get("/slots", async (req, res) => {
      try {
        const result = await slotsCollection
          .find({ status: "approved", role: "trainer" })
          .toArray();

        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Failed to fetch slots data", error });
      }
    });

    // save become trainer slots data to db
    app.post("/slots", async (req, res) => {
      const slot = req.body;
      const result = await slotsCollection.insertOne(slot);
      res.send(result);
    });

    app.post("/slot", async (req, res) => {
      const slot = req.body;
      const result = await slotCollection.insertOne(slot);
      res.send(result);
    });

    //slots data get activity page from DB
    app.get("/slots/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await slotsCollection.findOne(query);
      res.send(result);
    });

    app.get("/slot-add/:email", async (req, res) => {
      try {
        const email = req.params.email;
        const query = { email: email };
        const result = await slotCollection.findOne(query);
        res.send(result);
      } catch (error) {
        res
          .status(500)
          .send({ message: "Failed to fetch trainer slots data", error });
      }
    });

    app.get("/slot-manage/:email", async (req, res) => {
      try {
        const email = req.params.email;
        const query = { email: email };
        const result = await slotCollection.find(query).toArray(); // Use find() and toArray() to return a list of slots
        res.send(result);
      } catch (error) {
        res
          .status(500)
          .send({ message: "Failed to fetch trainer slots data", error });
      }
    });



    // Route to delete slot based on email
    app.delete("/slot-delete/:email", async (req, res) => {
      try {
        const email = req.params.email;
        const result = await slotCollection.deleteOne({ email: email });
        if (result.deletedCount === 0) {
          return res
            .status(404)
            .send({ message: "No slots found for this email" });
        }
        res.send(result);
      } catch (error) {
        console.error("Error deleting slot:", error);
        res.status(500).send({ message: "Failed to delete slot data", error });
      }
    });

    //for details page
    app.get("/slot/:id", async (req, res) => {
      const id = req.params.id;
      if (!ObjectId.isValid(id)) {
        return res.status(400).send({ error: "Invalid slot ID format" });
      }
      try {
        const query = { _id: new ObjectId(id) };
        const result = await slotsCollection.findOne(query);
        if (!result) {
          return res.status(404).send({ error: "Slot not found" });
        }
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Failed to fetch slot data", error });
      }
    });

    //Trainer slots
    app.post("/trainers", async (req, res) => {
      const slot = req.body;
      const result = await trainerCollection.insertOne(slot);
      res.send(result);
    });
    // get slot data form db
    app.get("/slot-data/:email", async (req, res) => {
      try {
        const email = req.params.email;
        const query = { email: email };
        const result = await slotsCollection.findOne(query);
        res.send(result);
      } catch (error) {
        res
          .status(500)
          .send({ message: "Failed to fetch trainer slots data", error });
      }
    });

    app.post("/slot/make-trainer/:email", async (req, res) => {
      try {
        if (req.body.make_trainer) {
          const email = req.params.email;
          const query = { email: email };
          const result = await slotsCollection.updateOne(query, {
            $set: { status: "approved", role: "trainer" },
          });
          // user role to trainer
          const trainerQuery = { email: email };
          const trainerResult = await usersCollection.updateOne(trainerQuery, {
            $set: { role: "trainer" },
          });

          res.send(result);
        } else {
        }
      } catch (error) {
        res
          .status(500)
          .send({ message: "Failed to fetch trainer slots data", error });
      }
    });

    app.delete("/users/trainer/demote/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await slotsCollection.updateOne(query, {
        $set: { status: "pending", role: "member" },
      });
      res.send(result);
    });

    app.put("/user", async (req, res) => {
      const user = req.body;
      const query = { email: user?.email };

      try {
        // Check if user already exists in the database
        const existingUser = await usersCollection.findOne(query);

        if (existingUser) {
          if (user.status === "Requested") {
            // Update the user status if they request a status change
            const result = await usersCollection.updateOne(query, {
              $set: { status: user?.status },
            });
            return res.send(result);
          } else if (user.name) {
            // Update only non-role fields if the user logs in again and has a valid name
            const updateDoc = {
              $set: {
                name: user.name,
                status: user.status,
                Timestamp: Date.now(),
              },
            };
            const result = await usersCollection.updateOne(query, updateDoc);
            return res.send(result);
          } else {
            // If existing user logs in again and doesn't require an update, return their data
            return res.send(existingUser);
          }
        } else {
          // If user doesn't exist in the database, insert them as a new entry
          if (user.name) {
            const newUser = {
              ...user,
              Timestamp: Date.now(),
            };
            const result = await usersCollection.insertOne(newUser);
            return res.send(result);
          } else {
            return res.status(400).send({ message: "Name cannot be null" });
          }
        }
      } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).send({ message: "Internal server error", error });
      }
    });

    // get all user email from db.
    app.get("/user/:email", async (req, res) => {
      const email = req.params.email;
      const result = await usersCollection.findOne({ email });
      res.send(result);
    });

    app.patch("/update-userData/:id", async (req, res) => {
      const data = req.body;
      const filter = { _id: new ObjectId(req.params.id) };
      // const result = await
    });

    // get all users data from db
    app.get("/users", async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    app.get("/users/trainer", verifyToken, async (req, res) => {
      const result = await slotsCollection
        .find({
          role: "trainer",
        })
        .toArray();
      res.send(result);
    });

    //review related Api
    app.get("/review", async (req, res) => {
      const result = await reviewCollection.find().toArray();
      res.send(result);
    });

    // review data post here to DB
    app.post("/review", async (req, res) => {
      try {
        const {
          displayName,
          photoURL,
          email,
          trainerId,
          review,
          rating,
          date,
        } = req.body;
        const newReview = {
          displayName,
          email,
          trainerId,
          review,
          rating,
          date,
          photoURL,
        };
        const result = await reviewCollection.insertOne(newReview);
        res.status(201).json(result);
      } catch (error) {
        res.status(500).json({ error: "Failed to submit review" });
      }
    });

    // Save subscribe data in DB
    app.post("/subscribe", async (req, res) => {
      const subscriptionData = req.body;
      try {
        const result = await subscribeCollection.insertOne(subscriptionData);
        res.send(result);
      } catch (error) {
        res
          .status(500)
          .send({ message: "Failed to save subscription data", error });
      }
    });

    // get all all subscribers data from DB
    app.get("/subscribers", async (req, res) => {
      try {
        const result = await subscribeCollection.find().toArray();
        res.send(result);
      } catch (error) {
        res
          .status(500)
          .send({ message: "Failed to fetch subscribers data", error });
      }
    });

    // collect all class from database
    app.get("/class", async (req, res) => {
      const result = await classCollection.find().toArray();
      res.send(result);
    });

    // save add class data from database
    app.post("/class", async (req, res) => {
      const ClassData = req.body;
      const result = await classCollection.insertOne(ClassData);
      res.send(result);
    });

    // collect all class from database
    app.get("/class-home", async (req, res) => {
      try {
        const { page = 1, limit = 3 } = req.query;

        // Convert page and limit to integers
        const pageInt = parseInt(page);
        const limitInt = parseInt(limit);

        // Calculate the number of documents to skip
        const skip = (pageInt - 1) * limitInt;

        // Fetch the paginated results from the collection
        const result = await classCollection
          .find()
          .skip(skip)
          .limit(limitInt)
          .toArray();

        // Get the total number of documents in the collection
        const totalDocuments = await classCollection.countDocuments();

        // Calculate the total number of pages
        const totalPages = Math.ceil(totalDocuments / limitInt);

        // Send the paginated results and metadata
        res.send({
          totalDocuments,
          totalPages,
          currentPage: pageInt,
          limit: limitInt,
          data: result,
        });
      } catch (error) {
        console.error("Error fetching paginated classes:", error);
        res
          .status(500)
          .send({ error: "An error occurred while fetching classes" });
      }
    });

    // payment
    app.post("/pay-now", async (req, res) => {
      const {
        trainer_info,
        trainer_id,
        slot_name,
        package_name,
        price,
        user_id,
        email,
        displayName,
        photoURL,
      } = req.body;

      // Validate data (add more validation as needed)
      if (
        !trainer_info ||
        !trainer_id ||
        !slot_name ||
        !package_name ||
        !price ||
        !email ||
        !displayName ||
        !photoURL
      ) {
        return res.status(422).json({ error: "Missing required fields" });
      }

      // Create a new payment document
      const newPayment = {
        trainer_info,
        trainer_id,
        slot_name,
        package_name,
        price,
        user_id,
        email,
        displayName,
        photoURL,
        created_at: new Date(),
      };

      // Insert the payment document into the collection
      const result = await paymentCollection.insertOne(newPayment);

      res
        .json({
          message: "Payment successful",
          data: result,
          result: true,
        })
        .status(200);
    });
    app.get("/payment-list", async (req, res) => {
      // Insert the payment document into the collection
      const result = await paymentCollection
        .find()
        .sort({
          crated_at: 1,
        })
        .toArray();

      res
        .json({
          data: result,
          result: true,
        })
        .status(200);
    });

    // get data from payment collection
    app.get("/payment/:email", async (req, res) => {
      const email = req.params.email;
      const result = await paymentCollection.find({ email }).toArray();
      res.send(result);
    });

    // collect single class data from database
    app.get("/class/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await classCollection.findOne(query);
      res.send(result);
    });
    //
    app.get("/trainers/class/:id", async (req, res) => {
      id = req.params.id;
      const query = { classes: id };
      const result = await trainerCollection.find(query).toArray();
      res.send(result);
    });

    // collect all trainer data from database
    app.get("/trainers", async (req, res) => {
      const result = await trainerCollection.find().toArray();
      res.send(result);
    });
    // collect trainer details  data from database
    app.get("/trainer/:id", async (req, res) => {
      id = req.params.id;
      if (!ObjectId.isValid(id)) {
        return res.status(400).send({ error: "Invalid trainer ID format" });
      }
      const query = { _id: new ObjectId(id) };
      const result = await trainerCollection.findOne(query);
      if (!result) {
        return res.status(404).send({ error: "Trainer not found" });
      }
      let classList = [];
      if (result.classes && Array.isArray(result.classes)) {
        classList = await Promise.all(
          result.classes.map(async (slot) => {
            return await classCollection.findOne({ _id: new ObjectId(slot) });
          })
        );
      }

      result.classLists = classList;
      res.send(result);
    });

    // Forum-related APIs
    // Add a new forum post
    app.post("/forum", async (req, res) => {
      const ForumData = req.body;

      try {
        // Fetch user's role from the database
        const user = await getUserByEmail(ForumData.email);

        // Default to 'user' if the role is not found
        const userRole = user ? user.role : "user";

        // Ensure only 'admin' or 'trainer' roles can post to the forum
        if (userRole === "admin" || userRole === "trainer") {
          const postWithRole = { ...ForumData, role: userRole };

          const result = await forumCollection.insertOne(postWithRole);
          res.send(result);
        } else {
          res
            .status(403)
            .send("Only admins and trainers are allowed to post in the forum.");
        }
      } catch (error) {
        console.error("Error posting to forum:", error);
        res.status(500).send("Internal Server Error");
      }
    });

    async function getUserByEmail(email) {
      try {
        // Fetch user from the usersCollection
        const user = await usersCollection.findOne({ email });
        return user;
      } catch (error) {
        console.error("Error fetching user by email:", error);
        return null;
      }
    }

    // Get forum posts with pagination
    app.get("/forum", async (req, res) => {
      const page = parseInt(req.query.page) || 1;
      const limit = 6;
      const skip = (page - 1) * limit;
      const total = await forumCollection.countDocuments();
      const forums = await forumCollection
        .find()
        .skip(skip)
        .limit(limit)
        .toArray();
      res.send({ forums, total, page, pages: Math.ceil(total / limit) });
    });

    // Upvote or downvote a forum post
    app.post("/forum/vote", async (req, res) => {
      try {
        const { postId, voteType } = req.body; // voteType can be 'upvote' or 'downvote'
        const update =
          voteType === "upvote"
            ? { $inc: { "votes.upvotes": 1 } }
            : { $inc: { "votes.downvotes": 1 } };
        const result = await forumCollection.updateOne(
          { _id: new ObjectId(postId) },
          update
        );
        res.send(result);
      } catch (error) {
        res
          .status(500)
          .send({ message: "Failed to vote on forum post", error });
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
