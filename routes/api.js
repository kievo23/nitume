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

router.post('/user/create',function(req, res){
  var code = Math.floor((Math.random() * 9000) + 1000);
  var phone = req.body.phone.replace(/\s+/g, '');
  phone = "254"+phone.substr(phone.length - 9);
  User.create({
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

router.post('/prof/uploadProfilePhoto/:id',cpUpload,function(req, res){
  Prof.findById(req.params.id).then(function(p){
    //console.log(p);
    if (req.files['photo']){
		  p.photo = req.files['photo'][0].filename;
		}
    p.save(function(err){
      if(err){
        console.log(err);
        res.json({code:101, msg: "error happened"});
      }else{
        if (req.files['photo']){
          Jimp.read("./public/uploads/"+p.photo).then(function (cover) {
            return cover.resize(200, 140)     // resize
               .quality(100)                // set greyscale
               .write("./public/uploads/profs/thumbs/"+p.photo); // save
          }).catch(function (err) {
            console.error(err);
          });
        }
        res.json({code:100, msg: "Changes made",profilePhoto:p.photo});
      }
    });
  })
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

router.post('/prof/uploadGalleryPhoto/:id',cpUpload,function(req, res){
  Prof.findById(req.params.id).then(function(p){
    //console.log(p);
    var gallery = [];
    //console.log(req.files);
    if(req.files['gallery']){
      req.files['gallery'].forEach(function(x){
        x.info = req.body.info;
        x.date = new Date();
        p.gallery.push(x);
      });
		}
    p.save(function(err){
      if(err){
        console.log(err);
        res.json({code:101, msg: "error happened"});
      }else{
        if(p.gallery){
          p.gallery.forEach(function(gallery) {
              Jimp.read("./public/uploads/"+gallery.filename).then(function (cover) {
                return cover.resize(200, 140)     // resize
                     .quality(100)                 // set JPEG quality
                     .write("./public/uploads/profs/thumbs/"+gallery.filename); // save
            }).catch(function (err) {
                console.error(err);
            });
          });
        }
        res.json({code:100, msg: "Changes made",gallery:p.gallery});
      }
    });
  })
});


router.post('/order/create',function(req, res){
  //console.log(req.body);
  Order.create({
    category: req.body.category,
		destination: req.body.destination,
    distance: req.body.distance,
    duration: req.body.duration,
    items: req.body.items,
    price: req.body.price,
    source: req.body.source,
		usernames: req.body.usernames,
    userphone: req.body.userphone,
    date: new Date()
  },function(err, order){
    if(err){
      res.json({code: 101, err: err});
    }else{
      var pusher = new Pusher({
        appId: '756519',
        key: 'e4add9536654e5c1ee4a',
        secret: '7bdb9b873881fb753fcb',
        cluster: 'eu',
        encrypted: true
      });

      pusher.trigger('nitume', 'new-order', {
        "message": "new Order Received",
        "phone" : req.body.userphone,
        "distance" : req.body.distance,
        "duration" : req.body.duration,
        "category" : req.body.category,
        "price" : req.body.price,
        "items" : req.body.items,
        "source" : req.body.source,
        "destination" : req.body.destination
      });
      res.json({code:100, msg: "Order Uploaded successfully"});
    }
  });
});



router.post('/prof/call_log/:id',function(req, res){
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

router.post('/prof/create',cpUpload,function(req, res){
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

//Edit prof location
router.post('/prof/editlocation/:id',function(req, res){
  Prof.findById(req.params.id).then(function(p){
    p.locationname = req.body.locationname;
    p.location = {type: "Point", coordinates: [ req.body.longitude, req.body.latitude ] },
    p.save(function(err){
      if(err){
        console.log(err);
        res.json({code:101, msg: "error happened"});
      }else{
        //console.log(p);
        res.json({code:100, msg: "Location Updated successfully"});
      }
    });
  });
});

//Edit prof location
router.post('/prof/availability/:id',function(req, res){
  Prof.findById(req.params.id).then(function(p){
    p.availability = req.body.availability;
    p.save(function(err){
      if(err){
        console.log(err);
        res.json({code:101, msg: "error happened"});
      }else{
        //console.log(p);
        res.json({code:100,status: p.availability, msg: "Availability successfully"});
      }
    });
  });
});

router.post('/prof/verifyotp',function(req, res){
  var phone = req.body.phone.replace(/\s+/g, '');
  phone = "254"+phone.substr(phone.length - 9);
  Prof.find({
    phone: phone,
    otp: req.body.otp
  },function(err, user){
    if(err){
      console.log(err);
      res.json({code: 101, err: err});
    }else{
      if(user){
        res.json({code: 100, data: user});
      }else{
        res.json({code: 101, msg: "User not found"});
      }
    }
  });
});

router.post('/prof/login',function(req, res){
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

router.post('/user/verifyg',function(req, res){
  User.findOne({
    googleid: req.body.googleid
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

//DELETE PHOTO FROM GALLERY
router.post('/deletephoto/:id', function(req, res){
		Prof.findOne({
		  _id: req.params.id
		})
		.then(function(data){
      var result = data.gallery.filter(function(e, i) {
        //console.log(e.filename);
        return e.filename != req.body.photo;
      });
      data.gallery = result;
      //console.log(result);
      data.save(function(err){
  			if(err)
  				res.json({code: 101, msg: err});
  			res.json({code: 100, msg: "deleted gallery photo successfully"});
  		});
		  //res.redirect('/dashboard');
		})
		.catch(function(err){
		    console.log(err);
        res.json({code: 100, msg: err});
		});
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

router.get('/prof/categories', function(req, res){
  Category.find({}).populate('group').then(function(d){
    res.json({categories: d});
  })
});

router.get('/prof/groups', async(req, res) => {
  var groups = Group.find({});
  var categories = Category.find({});
  var profs = Prof.find({approved: true});
  Promise.all([groups, categories, profs]).then(values => {
    for (var i = 0; i < values[0].length; i++) {
      for (var j = 0; j < values[1].length; j++) {
        if(values[0][i].id == values[1][j].group){
          for(var k = 0; k < values[2].length; k++){
            if(values[1][j].id == values[2][k].jobtype){
              values[1][j].profs.push(values[2][k]);
            }
          }
          if(values[1][j].profs.length == 0){
            //console.log("zero");
            delete values[1][j].profs;
          }
          values[0][i].children.push(values[1][j]);
        }
      }
    }
    //console.log(values[0]);
    res.json({groups: values[0]});
  });

});

module.exports = router;
