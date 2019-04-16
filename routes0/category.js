var express = require('express');
var router = express.Router();

var slug = require('slug');
var User = require(__dirname + '/../models/User');
var Prof = require(__dirname + '/../models/Pro');
var Category = require(__dirname + '/../models/Category');
var Group = require(__dirname + '/../models/Group');
var role = require(__dirname + '/../config/Role');

/* GET users listing. */
router.get('/',role.auth, function(req, res, next) {
  Category.find({}).populate('group').then(function(d){
    console.log(d);
    res.render('categories/index',{categories: d});
  });
});

//  GROUP
router.get('/group/create',role.auth,function(req, res){
  res.render('group/create');
});

router.get('/create',role.auth,function(req, res){
  Group.find({}).then(function(d){
    res.render('categories/create',{groups: d});
  });
});

router.get('/edit/:id',function(req, res){
  var groups = Group.find({});
  var category = Category.findById(req.params.id).populate('group');
  Promise.all([category,groups]).then(values => {
    res.render('categories/edit',{category: values[0], groups: values[1]});
  });
});

router.post('/edit/:id',function(req, res){
  var category = Category.findById(req.params.id).populate('group').then(function(category){
    category.name = req.body.name;
    category.price = req.body.price;
    category.group = req.body.group;
    category.slug = slug(req.body.name);
    category.save(function(err){
      if(err) throw console.log(err);
      res.redirect('/category');
    });
  });
});

router.post('/create',function(req, res){
  Group.findById(req.body.group).then(function(cat){
    Category.create({
      name : req.body.name,
      group: req.body.group,
      slug : slug(req.body.name)
    },function(err, category){
      if(err){
        console.log(err);
        res.redirect('/category/create');
      }else{
        res.redirect('/category');
      }
    });
  });
});

router.post('/group/create',function(req, res){
  Group.create({
    name : req.body.name,
    slug : slug(req.body.name)
  },function(err, category){
    if(err){
      console.log(err);
      res.redirect('/category/create');
    }else{
      res.redirect('/category');
    }
  });
});

router.get('/delete/:id',role.auth, function(req, res){
    Category.findByIdAndRemove(req.params.id, (err, todo) => {
    if(err) {
      return next(new Error('Todo was not found!'));
    }
    res.redirect('/category');
  })
});

module.exports = router;
