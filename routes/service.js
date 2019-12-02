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
  
router.post('/verifyotp',async function(req, res){
  var phone = req.body.phone.replace(/\s+/g, '');
  phone = "254"+phone.substr(phone.length - 9);
  let prof = await Prof.findOne({
    phone: phone,
    otp: req.body.otp
  });

  if(prof){
    prof.confirmed = true;
    let profSave = await prof.save();
    res.json({code: 100, msg: "User Found", user: prof});
  }else{
    res.json({code: 101, msg: "User Not Found"});
  }
});

router.post('/generateotp',function(req, res){
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
            url: config.url_for_sms,
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

router.post('/create',cpUpload,function(req, res){
  var code = Math.floor((Math.random() * 9999) + 1000);
  var phone = req.body.phone.replace(/\s+/g, '');
  phone = "254"+phone.substr(phone.length - 9);

    Prof.create({
      nickname: req.body.nickname,
      names : req.body.names,
      email: req.body.email,
      phone: phone,
      dob: req.body.dob,
      email: req.body.email,
      pin: req.body.pin,
      occupation: req.body.occupation,
      idno: req.body.idno,
      locationname: req.body.locationname,
      jobtype: req.body.jobtype,
      location: {type: "Point", coordinates: [ req.body.longitude, req.body.latitude ] },
      otp: code
    },function(err, user){
      if(err){
        console.log(err);
        res.json({code: 101, err: err});
      }else{
        res.json({code: 100, user: user});
      }
    });
});

router.post('/login',function(req, res){
  var phone = req.body.phone.replace(/\s+/g, '');
  phone = "254"+phone.substr(phone.length - 9);
  Prof.find({
    phone: phone,
    pin: req.body.pin
  },function(err, user){
    if(err){
      console.log(err);
      res.json({code: 101, err: err});
    }else{
      if(user){
        Category.populate( user, { path: "jobtype" }, function(err, usr) {
          if (err) throw err;
          User.populate( usr, { path: "reviews.userid" }, function(err, u) {
            if (err) {
              User.populate( usr, { path: "call_log.callerid" }, function(err, us) {
                if (err) {
                  
                  res.json({code: 100, data: usr});
                }else{
                  res.json({code: 100, data: us});
                }
              });
            }else{
              User.populate( u, { path: "call_log.callerid" }, function(err, us) {
                if (err) {
                  res.json({code: 100, data: u});
                }else{
                  res.json({code: 100, data: us});
                }
              });
            }
          });
        });
      }else{
        res.json({code: 101, msg: "User not found"});
      }
    }
  });
});

router.post('/myorders',async function(req, res){
  var phone = req.body.phone.replace(/\s+/g, '');
  phone = "254"+phone.substr(phone.length - 9);
  let prof = await Prof.findOne({phone: phone});
  let orders = await Order.find({prof: prof.id},{'_v': 0}).populate('user').populate('prof').sort({"date": -1});
  res.json({code:100,data: orders});
});

router.post('/availableorders',async function(req, res){
  let orders = await Order.find({status: 0}).populate('user').sort({"date": -1});
  res.json({code:100,data: orders});
});

router.post('/takeOrder', async function(req, res){
  var phone = req.body.phone.replace(/\s+/g, '');
  phone = "254"+phone.substr(phone.length - 9);
  let prof = await Prof.findOne({phone: phone});
  if(prof.approved == true){
    let order = await Order.findById(req.body.orderId);
    order.prof = prof.id
    order.status = 1;
    let rst = await order.save();
    if(rst){
      res.json({code:100, msg: "Order taken"});
    }else{
      res.json({code:101, msg: "Some problem happened"});
    } 
  }else{
    res.json({code:101, msg: "Your Account is not yet approved"});
  } 
})

module.exports = router;
