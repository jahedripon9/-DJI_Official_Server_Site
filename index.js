const express = require('express');
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;

const cors = require('cors')
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;


// Midleware

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.piqtj.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run(){

    try{
        await client.connect();
        const database = client.db('DjiOfficial');
            const djiproductsCollection = database.collection('djiproducts');

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