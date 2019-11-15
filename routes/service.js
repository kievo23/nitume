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


router.post('/create',function(req, res){
    var code = Math.floor((Math.random() * 9000) + 1000);
    var phone = req.body.phone.replace(/\s+/g, '');
    phone = "254"+phone.substr(phone.length - 9);
    Prof.create({
      names : req.body.names,
      email: req.body.email,
      phone: phone,
      otp: code
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
  
  router.post('/prof/verifyotp',function(req, res){
    var phone = req.body.phone.replace(/\s+/g, '');
    phone = "254"+phone.substr(phone.length - 9);
    Prof.findOne({
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
  
  router.post('/prof/generateotp',function(req, res){
    var phone = req.body.phone.replace(/\s+/g, '');
    phone = "254"+phone.substr(phone.length - 9);
    Prof.findOne({phone: phone}).then(function(d){
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
        res.json({code:101, msg: "User not found"});
      }
    });
  });

  router.post('/prof/myorders',async function(req, res){
    var phone = req.body.phone.replace(/\s+/g, '');
    phone = "254"+phone.substr(phone.length - 9);
    let prof = await Prof.findOne({phone: phone});
    let orders = await Order.find({prof: prof.id},{'_v': 0}).sort({"date": -1});
    res.json({code:100,data: orders});
  });

  router.post('/prof/availableorders',async function(req, res){
    let orders = await Order.find({prof: null}).sort({"date": -1});
    res.json({code:100,data: orders});
  });

  router.post('/prof/takeOrder', async function(req, res){
    var phone = req.body.phone.replace(/\s+/g, '');
    phone = "254"+phone.substr(phone.length - 9);
    let prof = await Prof.findOne({phone: phone});
    let order = await Order.findById(req.body.orderId);
    order.prof = prof.id
    let rst = await order.save()
    res.json({code:100, msg: "Order taken"});
  })

  module.exports = router;
  