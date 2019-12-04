var express = require('express');
var router = express.Router();

var Order = require(__dirname + '/../models/Order');
var config = require(__dirname + '/../config.json');
let admin = require('firebase-admin');
admin.initializeApp({
  credential: admin.credential.cert(config.firebaseAccountKey),
  databaseURL: "https://nitume-4cfe0.firebaseio.com"
});

/* GET home page. */
router.get('/', function(req, res, next) {
  //let serviceAccount = require("path/to/serviceAccountKey.json");
  //let registrationToken = "drxe--tDDgE:APA91bF-BZGQm2fL-M6IQYo3EhNqBPT-jpTs77ZUurSYd0b2IhcsmU4XpIWAaMFz5jDDomhtsxawfSINSEzm4dcrPfEOkLTbx_gmtC_a74mDPrfh-1OQ7IyQfEW39Bdd7gv9QcFw2LwJ";

  
  res.render('index', { title: 'Nitume API' });
});

router.get('/orders', function(req, res, next) {
  Order.find({},{'_id': 0,'_v': 0}).sort({"date": -1}).then(function(d){
    res.render('orders', { title: 'Nitume Orders', orders: d });
  })
});

module.exports = router;
