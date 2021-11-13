const express = require('express');
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
const admin = require("firebase-admin");

const cors = require('cors')
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

// dji-official-website-firebase-admin.json


const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Midleware

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.piqtj.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });


async function verifyToken(req, res, next) {
    if (req.headers?.authorization?.startsWith('Bearer ')) {
        const token = req.headers.authorization.split(' ')[1];

        try {
            const decodedUser = await admin.auth().verifyIdToken(token);
            req.decodedEmail = decodedUser.email;
        }
        catch {

        }

    }
    next();
}


async function run(){

    try{
        await client.connect();
        const database = client.db('DjiOfficial');
            const djiproductsCollection = database.collection('djiproducts');
            const djiOrdersCollection = database.collection('orderProducts');
            const usersCollection = database.collection('users');
            const reviewCollection = database.collection('review');
            
            

            // GET API
            app.get('/djiproducts', async(req, res)=>{
                const cursor = djiproductsCollection.find({});
                const djiproducts = await cursor.toArray();
                res.send(djiproducts);
            })
            



            // GET SINGLE Item
            app.get('/djiproducts/:id', async(req, res)=>{
                const id = req.params.id;
                const query = {_id: ObjectId(id)};
                const djiproduct = await djiproductsCollection.findOne(query);
                res.json(djiproduct)
            })

            // POST API
            

            app.post('/djiproducts', async(req, res)=>{
                const djiproduct = req.body;

               console.log('Hit the post api', djiproduct)
                const result = await djiproductsCollection.insertOne(djiproduct);
                console.log(result);
                res.json(result);
            })

             // DELETE API

             app.delete('/djiproducts/:id', async(req, res )=>{
                const id = req.params.id;
                const query = {_id:ObjectId(id)};
                const result = await djiproductsCollection.deleteOne(query);
                res.json(result);
                
            })



            // __________________________

                // confirm order
            app.post('/confirmOrder', async (req, res) => {
                const result = await djiOrdersCollection.insertOne(req.body);
                res.send(result);
            });
        
            // my confirmOrder
        
            app.get('/myOrders/:email', async (req, res) => {
                const result = await djiOrdersCollection
                .find({ email: req.params.email })
                .toArray();
                res.send(result);
            });
        
            // delete order
        
            app.delete('/deleteOrder/:id', async (req, res) => {
                const result = await djiOrdersCollection.deleteOne({
                _id: ObjectId(req.params.id),
                });
                res.send(result);
            });

            
            app.get('/users/:email', async(req, res) => {
                const email = req.params.email;
                const query = { email: email};
                const user = await usersCollection.findOne(query);
                let isAdmin = false;
                if(user?.role === 'admin'){
                    isAdmin = true;
                }
                res.json({admin: isAdmin});
              })
      
              app.post('/users', async (req, res) => {
                const user = req.body;
                const result = await usersCollection.insertOne(user);
                console.log(result);
                res.json(result);
            });



            app.put('/users', async(req, res)=>{
                const user = req.body;
                const filter = {email: user.email};
                const options = {upsert: true};
                const updateDoc = {$set: user};
                const result = await usersCollection.updateOne(filter, updateDoc, options);
                res.json(result)
            })
      
            app.put('/users/admin', verifyToken, async(req, res)=>{
              const user = req.body;
              const requester = req.decodedEmail;
              if(requester){
                const requesterAccount = await usersCollection.findOne({email: requester});
                if(requesterAccount.role === 'admin'){
                  const filter = {email: user.email};
                  const updateDoc = {$set:{role:'admin'}};
                  const result = await usersCollection.updateOne(filter, updateDoc);
                  res.json(result);
      
                }
              }
              else {
                res.status(403).json({message: 'You do not have access to make Admin'})
              }
            })


            // all order
            app.get("/allOrders", async (req, res) => {
                const result = await djiOrdersCollection.find({}).toArray();
                res.send(result);
            });
        
            // update statuses
        
            app.put("/status/:id", (req, res) => {
                const id = req.params.id;
                const updatedStatus = req.body.status;
                const filter = { _id: ObjectId(id) };
                console.log(updatedStatus);
                ordersCollection
                .updateOne(filter, {
                    $set: { status: updatedStatus },
                })
                .then((result) => {
                    res.send(result);
                });
            });

            // review
            app.post("/addReview", async (req, res) => {
                const result = await reviewCollection.insertOne(req.body);
                res.send(result);
            });
            // GET review API
            app.get('/addReview', async(req, res)=>{
                const cursor = reviewCollection.find({});
                const reviws = await cursor.toArray();
                res.send(reviws);
            })



    }
    finally{
        // await client.close();
    }

}

run().catch(console.dir)

app.get('/', (req, res)=>{
    res.send('DJI Official server is running');
  
})
app.listen(port, ()=>{
    console.log('server running at port', port)
})