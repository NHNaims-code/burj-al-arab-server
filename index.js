const express = require('express');
const cors= require('cors');
const bodyParser = require('body-parser');
const admin = require("firebase-admin");
require('dotenv').config()

console.log(process.env.DB_USER);
const port = 5000;
const app = express();

app.use(cors());
app.use(bodyParser.json());


const serviceAccount = require("./configs/burj-al-arab-ef49d-firebase-adminsdk-794ha-c24f045162.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIRE_DB
});


const MongoClient = require('mongodb').MongoClient;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.sjmet.mongodb.net/burjAlArab?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const bookings = client.db("burjAlArab").collection("bookings");
  console.log('db connected successfull');
  app.post('/addbooking', (req, res) => {
      const newBooking = req.body;
      bookings.insertOne(newBooking)
      .then(result => {
          res.send(result.insertedCount > 0)
      })
      console.log(newBooking);
  })
  app.get('/bookings', (req, res) => {
    //   console.log(req.headers.authorization);
      const bearer = req.headers.authorization;
      if(bearer && bearer.startsWith('Bearer ')){
          const idToken = bearer.split(' ')[1];
          console.log({ idToken });

        // idToken comes from the client app
        admin.auth().verifyIdToken(idToken)
        .then(function(decodedToken) {
          // let uid = decodedToken.uid;
          // console.log({uid});
          const tokenEmail = decodedToken.email;
          const queryEmail = req.query.email;
          console.log(tokenEmail, queryEmail);
          if(tokenEmail === queryEmail){
              bookings.find({email: queryEmail}).toArray((err, document) => {
                res.status(200).send(document);
            })
          }
        }).catch(function(error) {
          res.status(401).send('un-authorized');
          // Handle error
        });
          // idToken comes from the client app
 
      }
      else{
        res.status(401).send('un-authorized')
      }

 
      
  })
});


app.get('/', (req, res) => {
    res.send('Welcome');
})


app.listen(port);