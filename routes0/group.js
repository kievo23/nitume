var express = require('express');
var router = express.Router();

var slug = require('slug');
var User = require(__dirname + '/../models/User');
var Prof = require(__dirname + '/../models/Pro');
var Category = require(__dirname + '/../models/Category');
var Group = require(__dirname + '/../models/Group');
var role = require(__dirname + '/../config/Role');

var Jimp = require("jimp");
var multer  = require('multer');
var mime = require('mime');


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
/* GET users listing. */
router.get('/',role.auth, function(req, res, next) {
  Group.find({}).then(function(d){
    res.render('group/index',{groups: d});
  });
});

//  GROUP
router.get('/create',role.auth,function(req, res){
  res.render('group/create');
});

router.get('/edit/:id',role.auth,function(req, res){
  var group = Group.findById(req.params.id);
  Promise.all([group]).then(values => {
    res.render('group/edit',{group: values[0]});
  });
});

router.post('/edit/:id',role.auth, cpUpload, function(req, res){
  var photo = '';
  if (req.files['photo']){
    photo = req.files['photo'][0].filename;
  }
  var group = Group.findById(req.params.id).then(function(group){
    group.name = req.body.name;
    group.slug = slug(req.body.name);
    group.photo = photo;
    group.save(function(err){
      if(err) throw console.log(err);
      if (req.files['photo']){
        Jimp.read("./public/uploads/"+group.photo).then(function (cover) {
          return cover.resize(200, 140)     // resize
             .quality(100)                // set greyscale
             .write("./public/uploads/group/thumbs/"+group.photo); // save
        }).catch(function (err) {
          console.error(err);
        });
      }
      res.redirect('/group');
    });
  });
});

router.post('/create', role.auth, cpUpload, function(req, res){
  var photo = '';
  if (req.files['photo']){
    photo = req.files['photo'][0].filename;
  }
  Group.create({
    name : req.body.name,
    slug : slug(req.body.name),
    photo: photo,
  },function(err, group){
    if(err){
      //console.log(err);
      res.redirect('/group/create');
    }else{
      if (req.files['photo']){
        Jimp.read("./public/uploads/"+group.photo).then(function (cover) {
          return cover.resize(200, 140)     // resize
             .quality(100)                // set greyscale
             .write("./public/uploads/group/thumbs/"+group.photo); // save
        }).catch(function (err) {
          console.error(err);
        });
      }
      res.redirect('/group');
    }
  });
});

router.get('/delete/:id',role.auth, function(req, res){
    Group.findByIdAndRemove(req.params.id, (err, todo) => {
    if(err) {
      return next(new Error('Todo was not found!'));
    }
    res.redirect('/group');
  })
});

module.exports = router;
