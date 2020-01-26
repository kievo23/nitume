var express = require('express');
var router = express.Router();

var request = require("request");
var Jimp = require("jimp");
var slug = require('slug');
var multer  = require('multer');
var mime = require('mime');
var Pusher = require('pusher');

var User = require(__dirname + '/../models/User');
var Prof = require(__dirname + '/../models/Pro');
var Category = require(__dirname + '/../models/Category');
var Group = require(__dirname + '/../models/Group');
var Order = require(__dirname + '/../models/Order');

var settings = require(__dirname + '/../config/System');

var config = require(__dirname + '/../config.json');


var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/uploads/')
  },
  filename: function (req, file, cb) {
    var fileName = Date.now() + slug(file.originalname) +'.'+ mime.getExtension(file.mimetype);
    cb(null, fileName);
  }
});

var upload = multer({ storage: storage });
var cpUpload = upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'profile', maxCount: 1 },
  { name: 'catalog', maxCount: 5 },
  { name: 'gallery', maxCount: 30 }
]);

router.post('/user/create',function(req, res){
  var code = Math.floor((Math.random() * 9000) + 1000);
  var phone = req.body.phone.replace(/\s+/g, '');
  phone = "254"+phone.substr(phone.length - 9);
  User.create({
    names : req.body.names,
    email: req.body.email,
    phone: phone,
    otp: code,
    date: new Date()
  },function(err, user){
    if(err){
      res.json({code: 101, err: err});
    }else{
      var options = { method: 'GET',
        url: 'http://infopi.io/text/index.php',
        qs:
         { app: 'ws',
           u: 'Kev',
           h: config.sms_key,
           op: 'pv',
           to: user.phone,
           msg: 'OTP code is: '+ code } };
      request(options, function (error, response, body) {
        if (error) throw new Error(error);
        //console.log(body);
      });
      res.json({code:100, msg: "OTP generated successfully",user: user});
    }
  });
});

router.post('/user/verifyotp',function(req, res){
  var phone = req.body.phone.replace(/\s+/g, '');
  phone = "254"+phone.substr(phone.length - 9);
  User.findOne({
    phone: phone,
    otp: req.body.otp
  },function(err, user){
    if(err){
      console.log(err);
      res.json({code: 101, err: err});
    }else{
      if(user){
        res.json({code: 100, msg: "User Found", user: user});
      }else{
        res.json({code: 101, msg: "User Not Found", user: user});
      }
    }
  });
});

router.post('/user/generateotp',function(req, res){
  var phone = req.body.phone.replace(/\s+/g, '');
  phone = "254"+phone.substr(phone.length - 9);
  User.findOne({phone: phone}).then(function(d){
    if(d){
      var code = Math.floor((Math.random() * 9000) + 1000);
      d.otp = code;
      d.save(function(err){
        if(err){
          res.json({code:101, msg: "something went wrong"});
        }else{
          var options = { method: 'GET',
            url: 'http://infopi.io/text/index.php',
            qs:
             { app: 'ws',
               u: 'Kev',
               h: config.sms_key,
               op: 'pv',
               to: d.phone,
               msg: 'OTP code is: '+ code },
            headers:
             { 'postman-token': '4ca47976-a3bc-69d6-0cae-e80049f926e9',
               'cache-control': 'no-cache' } };

          request(options, function (error, response, body) {
            if (error) throw new Error(error);
            res.setHeader('Accept','no-cache');
            res.json({code:100, msg: "OTP generated successfully"});
            //console.log(body);
          });

        }
      })
    }else{
      res.json({code:101, msg: "User not found, Kindly Register, its free!"});
    }
  });
});

router.post('/addreview',function(req, res){
  Prof.findById(req.body.profid).then(function(p){
    x = {};
    x.userid = req.body.userid;
    x.review = req.body.review;
    x.rate = req.body.rate;
    x.date = new Date();
    p.reviews.push(x);
    p.save(function(err){
      if(err){
        console.log(err);
        res.json({code:101, msg: "error happened"});
      }else{
        //console.log(p);
        res.json({code:100, msg: "Review done successfully"});
      }
    });
  });
});

router.post('/order/create', async function(req, res){
  //console.log(req.body);
  let phone = "254"+req.body.userphone.substr(req.body.userphone.length - 9);
  let user = await User.findOne({phone: phone});
  if(user){
    let order = await Order.create({
      category: req.body.category,
      destination: req.body.destination,
      distance: req.body.distance,
      duration: req.body.duration,
      items: req.body.items,
      price: req.body.price,
      source: req.body.source,
      usernames: req.body.usernames,
      mode: req.body.mode,
      user: user.id,
      status: 0,
      date: new Date()
    });

    if(order){
      console.log(order);
      //let source = JSON.parse(order.source);
      //let destination = JSON.parse(order.destination);
      
      let topic = 'newOrder';
      let message = {
        notification: {
          title: 'New order has been received',
          body: "Mode: "+req.body.mode+', From: '+ order.source.placename+ " to: " +order.destination.placename
        },
        topic: topic
      };

      // Send a message to devices subscribed to the provided topic.
      settings.firebase.messaging().send(message)
        .then((response) => {
          // Response is a message ID string.
          console.log('Successfully sent message:', response);
        })
        .catch((error) => {
          console.log('Error sending message:', error);
        });

      res.json({code:100, msg: "Order Uploaded successfully"});
    }else{
      res.json({code:101, msg: "There was a problem uploading the order"});
    }
  }else{
    res.json({code: 101, err: "error, User not found"});
  }
  
});



router.post('/call_log/:id',function(req, res){
  Prof.findById(req.params.id).then(function(p){
    p.call_log.push(req.body);
    p.save(function(err){
      if(err){
        console.log(err);
        res.json({code:101, msg: "error happened"});
      }else{
        //console.log(p);
        res.json({code:100, msg: "call logged successfully"});
      }
    });
  });
});


router.post('/myorders', async function(req, res, next) {
  if(req.body.phone){
    var phone = req.body.phone.replace(/\s+/g, '');
    phone = "254"+phone.substr(phone.length - 9);
    let user = await User.findOne({phone: phone});
    let orders = await Order.find({user: user.id},{'_v': 0}).populate('prof').sort({"date": -1});
    res.json({code:100,data: orders});
  }else{
    res.json({code: 101, msg: "didnt submit data"});
  }
});

router.post('/deleteOrder', async function(req, res, next) {
  if(req.body.phone){
    var phone = req.body.phone.replace(/\s+/g, '');
    phone = "254"+phone.substr(phone.length - 9);
    let user = await User.findOne({phone: phone});
    let order = await Order.findOneAndRemove({user: user.id, _id: req.body.id});
    res.json({code : 100,msg: "record deleted",data : order});
  }else{
    res.json({code : 101,data: "no record found"});
  }
});


//SOCIALS
router.post('/user/verifyfb',function(req, res){
  User.findOne({
    facebookid: req.body.facebookid
  },function(err, user){
    if(err){
      console.log(err);
      res.json({code: 101, err: err});
    }else{
      if(user){
        res.json({code: 100, msg: "User Found", user: user});
      }else{
        res.json({code: 101, msg: "User Not Found", user: user});
      }
    }
  });
});


router.post('/updateToken', async function(req, res, next) {
  let phone = req.body.phone.replace(/\s+/g, '');
  phone = "254"+phone.substr(phone.length - 9);
  if(req.body.type == "user"){
    let user = await User.findOne({phone: phone});
    user.firebaseToken = req.body.token;
    let rst = await user.save();
    if(rst){
      res.json({code : 200, msg: "Token updated"});
    }else{
      res.json({code : 500, msg: "error happened"});
    }
  }else if(req.body.type == "serviceman"){
    let prof = await Prof.findOne({phone: phone});
    prof.firebaseToken = req.body.token;
    let rst = await prof.save();
    if(rst){
      res.json({code : 200, msg: "Token updated"});
    }else{
      res.json({code : 500, msg: "error happened"});
    }
  }
});


router.post('/orderCompleted', async function(req, res, next) {
  if(req.body.phone){
    var phone = req.body.phone.replace(/\s+/g, '');
    phone = "254"+phone.substr(phone.length - 9);
    let user = await User.findOne({phone: phone});
    if(user){
      let order = await Order.findOne({user: user.id, _id: req.body.orderId}).populate('prof');
      if(order){
        order.status = parseInt(req.body.status);
        let rst = await order.save();
        if(rst){
          let prof = await Prof.findById(order.prof);
          let commission = 0.1 * parseFloat(order.price);
          prof.commission -= commission;
          await prof.save();

          let registrationToken = order.prof.firebaseToken;
          //let topic = 'orderConfirmed';

          let message = {
            notification: {
              title: user.names+' confirmed the order',
              body: "The customer has confirmed that they have received their order"
            },
            token: registrationToken
          };

          // Send a message to devices subscribed to the provided topic.
          settings.firebase.messaging().send(message)
            .then((response) => {
              // Response is a message ID string.
              console.log('Successfully sent message:', response);
            })
            .catch((error) => {
              console.log('Error sending message:', error);
            });

          res.json({code : 100, data: "The order status has been changed successfully"});
        }else{
          res.json({code : 101, data: "Oops! Order status wasnt changed. Try again later"});
        }
      }else{
        res.json({code : 101, data: "Oops! Order doesn't exist"});
      }
    }else{
      res.json({code : 101, data: "Oops! User doesn't exist"});
    }    
  }else{
    res.json({code : 101, data: "Oops! no record found"});
  }
});

/*
router.post('/nearby', function(req, res){
  var point = { type : "Point", coordinates : [parseFloat(req.body.longitude),parseFloat(req.body.latitude)] };
  Prof.geoNear(point,{ maxDistance : 5000000, spherical : true, distanceMultiplier: 0.001 })
  .then(function(results){
    results = results.map(function(x) {
      var a = new Prof( x.obj );
      a.dis = x.dis;
      return a;
    });
    Prof.populate( results, { path: "jobtype" }, function(err,docs) {
      if (err) throw err;
      res.json({ nearby: docs });
    });
   });
});*/

module.exports = router;
