var express = require('express');
var router = express.Router();
const bcrypt = require('bcryptjs');
var role = require(__dirname + '/../config/Role');

var User = require(__dirname + '/../models/User');

/* GET home page. */
router.get('/',role.auth, function(req, res, next) {
  res.render('index', { title: 'SakaPro' });
});

router.get('/terms-conditions', function(req, res, next){
  res.render('site/terms',{title: 'SakaPro: Terms and Conditions'});
});


router.get('/changepassword', function(req, res) {
  //console.log(bcrypt.compareSync("1234", "$2a$10$wrRsNw7dmptu67ldFGrTOOS/0oMG80AgYvqbtdIYQIJn/LT5U9nCm"));
  res.render('users/changePassword',{title: "Change Password"});
})
router.post('/changepassword', function(req, res, next) {
  if(req.body.newPassword.length < 4){
    req.flash('error',"Password is too short");
    res.redirect('/changepassword');
  }else if(req.body.newPassword != req.body.confirmPassword){
    req.flash('error',"Passwords don't match");
    res.redirect('/changepassword');
  }else{
    User.findById(req.user.id)
    .then(function(user){
      //console.log(req.body.newPassword);
      if(bcrypt.compareSync(req.body.currentPassword, user.password)){
        user.password = bcrypt.hashSync(req.body.newPassword, 10);
        user.save(function(d){

        });
        req.flash('success',"Password Change Successfully");
        res.redirect('/');
      }else{
        req.flash('error',"Wrong Current Password");
        res.redirect('/changepassword');
      }
    });
  }
});

module.exports = router;
