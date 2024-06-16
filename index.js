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
 

  const classCollection = client.db('fitnessDb').collection('class');
  const trainerCollection = client.db('fitnessDb').collection('trainers');
  const slotsCollection = client.db('fitnessDb').collection('slots');

  const forumCollection = client.db('fitnessDb').collection('forum');
  const reviewCollection = client.db('fitnessDb').collection('review');

  const usersCollection = client.db('fitnessDb').collection('users');
  const paymentCollection = client.db('fitnessDb').collection('payment');

  const subscribeCollection = client.db('fitnessDb').collection('subscribers');


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

     app.get('/slots', async (req, res) => {
            const result = await slotsCollection.find({
                status: 'pending'
            }).toArray();
            res.send(result);
        })
        // save become trainer slots data to db
        app.post('/slots', async (req, res) => {
            const slot = req.body;
            const result = await slotsCollection.insertOne(slot)
            res.send(result);
        })
        //Trainer slots 
        app.post('/trainers', async (req, res) => {
            const slot = req.body;
            const result = await trainerCollection.insertOne(slot)
            res.send(result);
        })
        // get slot data form db
        app.get("/slot/:email", async (req, res) => {
            try {
                const email = req.params.email;
                const query = { email: email }
                const result = await slotsCollection.findOne(query);
                res.send(result);
            } catch (error) {
                res.status(500).send({ message: "Failed to fetch trainer slots data", error });
            }
        });

        app.post("/slot/make-trainer/:email", async (req, res) => {
            try {
                if (req.body.make_trainer) {
                    const email = req.params.email;
                    const query = { email: email }
                    const result = await slotsCollection.updateOne(query, {
                        $set: { status: "approved" },
                    });
                    // user role to trainer
                    const trainerQuery = { email: email }
                    const trainerResult = await trainerCollection.updateOne(trainerQuery, {
                        $set: { role: "trainer" },
                    });

                    res.send(result);
                } else {

                }



            } catch (error) {
                res.status(500).send({ message: "Failed to fetch trainer slots data", error });
            }
        });
        //slot data delete 
        app.delete('/slot/:email', async (req, res) => {
            const email = req.params.email
            const query = { email: email }
            const result = await slotsCollection.deleteOne(query)
            res.send(result)
        })

        app.post('/users/trainer/demote/:email', async (req, res) => {
            const trainer = await trainerCollection.findOne({
                email: req.params.email
            });
            if (!trainer) {
                return res.status(404).send({ error: 'Trainer not found' });
            }
            const result = await usersCollection.updateOne({
                email: req.params.email
            }, {
                $set: { role: 'member' },
            })
            res.json({
                success: true,
                message: 'demoted successfully'
            }).status(200)
        })
        //save user data in database
        app.put('/user', async (req, res) => {
            const user = req.body;
            const query = { email: user?.email }
            // check if user already in database
            const isExist = await usersCollection.findOne(query);
            if (isExist) {
                if (user.status === 'Requested') {
                    // if existing user try to change his role
                    const result = await usersCollection.updateOne(query, {
                        $set: { status: user?.status },
                    })
                    return res.send(result)
                } else {
                    // if existing user login again
                    return res.send(isExist)
                }
            }
            // save user for the first time
            const options = { upsert: true }
            const updateDoc = {
                ...user,
                Timestamp: Date.now()

            }
            const result = await usersCollection.insertOne(updateDoc, options)
            res.send(result)
        })
        // get all user email from db.
        app.get('/user/:email', async (req, res) => {
            const email = req.params.email;
            const result = await usersCollection.findOne({ email });
            res.send(result);
        })
        // get all users data from db
        app.get('/users', async (req, res) => {
            const result = await usersCollection.find().toArray()
            res.send(result)
        })
        app.get('/users/trainer', async (req, res) => {
            const result = await usersCollection.find({
                role: 'trainer'
            }).toArray()
            res.send(result)
        })
        // Forum API 
        app.get('/forum', async (req, res) => {
            const result = await forumCollection.find().toArray();
            res.send(result);
        })
        //review related Api
        app.get('/review', async (req, res) => {
            const result = await reviewCollection.find().toArray();
            res.send(result);
        })
        // Save subscribe data in DB
        app.post("/subscribe", async (req, res) => {
            const subscriptionData = req.body;
            try {
                const result = await subscribeCollection.insertOne(subscriptionData);
                res.send(result);
            } catch (error) {
                res.status(500).send({ message: "Failed to save subscription data", error });
            }
        });

        // get all all subscribers data from DB
        app.get("/subscribers", async (req, res) => {
            try {
                const result = await subscribeCollection.find().toArray();
                res.send(result);
            } catch (error) {
                res.status(500).send({ message: "Failed to fetch subscribers data", error });
            }
        });

        // collect all class from database
        app.get('/classes', async (req, res) => {
            const result = await classCollection.find().toArray();
            res.send(result)
        })
        // save add class data from database 
        app.post("/class", async (req, res) => {
            const ClassData = req.body;
            const result = await classCollection.insertOne(ClassData);
            res.send(result);
        });
        app.post("/pay-now", async (req, res) => {
            const { trainer_info, trainer_id, slot_name, package_name, price, user_id, email, otherInfo } = req.body;

            // Validate data (add more validation as needed)
            if (!trainer_info || !trainer_id || !slot_name || !package_name || !price || !email) {
                return res.status(422).json({ error: 'Missing required fields' });
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
                created_at: new Date(),
            };

            // Insert the payment document into the collection
            const result = await paymentCollection.insertOne(newPayment);

            res.json({
                'message': "Payment successful",
                'data': result,
                'result': true
            }).status(200);
        });
        app.get("/payment-list", async (req, res) => {

            // Insert the payment document into the collection
            const result = await paymentCollection.find().sort({
                crated_at: 1
            }).toArray();

            res.json({
                'data': result,
                'result': true
            }).status(200);
        });
        // collect single class data from database
        app.get('/class/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await classCollection.findOne(query);
            res.send(result)
        })
        // 
        app.get('/trainers/class/:id', async (req, res) => {
            id = req.params.id;
            const query = { classes: id }
            const result = await trainerCollection.find(query).toArray();
            res.send(result)
        })
        // collect all trainer data from database
        app.get('/trainers', async (req, res) => {
            const result = await trainerCollection.find().toArray();
            res.send(result)
        })
        // collect trainer details  data from database
        app.get('/trainer/:id', async (req, res) => {
            id = req.params.id;
            if (!ObjectId.isValid(id)) {
                return res.status(400).send({ error: 'Invalid trainer ID format' });
            }
            const query = { _id: new ObjectId(id) }
            const result = await trainerCollection.findOne(query);
            if (!result) {
                return res.status(404).send({ error: 'Trainer not found' });
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
        })


        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
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
