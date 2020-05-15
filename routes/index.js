var express = require('express');
var router = express.Router();

var User = require(__dirname + '/../models/User');
var Order = require(__dirname + '/../models/Order');
var config = require(__dirname + '/../config.json');
var settings = require(__dirname + '/../config/System');

/* GET home page. */
router.get('/', function(req, res, next) {
  //let serviceAccount = require("path/to/serviceAccountKey.json");
  //let registrationToken = "drxe--tDDgE:APA91bF-BZGQm2fL-M6IQYo3EhNqBPT-jpTs77ZUurSYd0b2IhcsmU4XpIWAaMFz5jDDomhtsxawfSINSEzm4dcrPfEOkLTbx_gmtC_a74mDPrfh-1OQ7IyQfEW39Bdd7gv9QcFw2LwJ";
    // let message = {
    //   notification: {
    //     title: 'Your Order is assigned',
    //     body: "Mode: "
    //   },
    //   //topic : topic,
    //   token : "caNzbYU52xQ:APA91bHfRWXDitZiwdvPgTNnziQDdY262-OQLuUh1JFLiwbuZXSeT9R0B8TVR1n44kcJfVzN7QRqJdT-QdR14fHL8v853zDysucXXhBoNfMma3kKfkHmtCo7GX0r3o9cwR5hUWg27gey"
    // };

    // // Send a message to devices subscribed to the provided topic.
    // settings.firebase.messaging().send(message)
    //   .then((response) => {
    //     // Response is a message ID string.
    //     console.log('Successfully sent message:', response);
    //   })
    //   .catch((error) => {
    //     console.log('Error sending message:', error);
    //   });
  
  res.render('index', { title: 'Nitume API' });
});

router.get('/time', function(req, res, next) {
  res.json({time: new Date()})
})

router.get('/notification', async function(req,res){
  
  let body = req.query.body;
  let title = req.query.title;
  let message = {
    notification: {
      title: title,
      body: body
    },
    topic: 'notification'
  };

  //console.log("token"+order.user.firebaseToken);

  // Send a message to devices subscribed to the provided topic.
  settings.firebase.messaging().send(message)
    .then((response) => {
      // Response is a message ID string.
      console.log('Successfully sent message:', response);
    })
    .catch((error) => {
      console.log('Error sending message:', error);
    });
    res.send("notifications sent");
});

router.get('/orders', function(req, res, next) {
  Order.find({},{'_id': 0,'_v': 0}).sort({"date": -1}).then(function(d){
    res.render('orders', { title: 'Nitume Orders', orders: d });
  })
});

router.get('/users', function(req, res, next) {
  User.find({},{'_id': 0,'_v': 0}).sort({"date": -1}).then(function(d){
    res.render('users', { title: 'Nitume Users', users: d });
  })
});

module.exports = router;
