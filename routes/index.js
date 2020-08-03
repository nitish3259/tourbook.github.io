var express=require("express");
var router=express.Router();
var passport=require("passport");
var User=require("../models/user.js");
var Notification = require("../models/notification");
var middleware=require("../middleware/index.js");
var Campground=require("../models/campground.js");
var async=require("async");
var nodemailer=require("nodemailer");
var crypto=require("crypto");

var multer = require('multer');
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter})

var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: 'nitish3658', 
  api_key:process.env.API_KEY, 
  api_secret:process.env.API_SECRET
});

router.get("/",function(req,res){
	res.render("home");
});

router.get("/register",function(req,res){
	res.render("register", {page: 'register'});
});

router.post("/register",upload.single('image'),function(req,res){
	cloudinary.v2.uploader.upload(req.file.path, function(err, result){
		if(err) {
        req.flash('error', err.message);
        return res.redirect('back');
        }
		 var newuser=new User(
		{
			username:req.body.username,
			first_name:req.body.firstName,
			last_name:req.body.lastName,
			email:req.body.email,
			avatar:result.secure_url,
			imageId:result.public_id
		});
	    if(req.body.adminCode===process.env.SECRETCODE){
		newuser.IsAdmin=true;
	    }
		User.register(newuser,req.body.password,function(err,user){
		if(err){
			req.flash("error",err.message);
			res.redirect("/register");
		}
		else{
			passport.authenticate("local")(req,res,function(){
				req.flash("success","Welcome To YELPCAMP " + user.username);
				res.redirect("/campgrounds");
			});
		}
	  });
	});
	// var newuser=new User(
	// 	{
	// 		username:req.body.username,
	// 		first_name:req.body.firstName,
	// 		last_name:req.body.lastName,
	// 		email:req.body.email,
	// 		avatar:req.body.avatar
	// 	});
	// if(req.body.adminCode==="secretcode123"){
	// 	newuser.IsAdmin=true;
	// }
	// User.register(newuser,req.body.password,function(err,user){
	// 	if(err){
	// 		req.flash("error",err.message);
	// 		res.redirect("/register");
	// 	}
	// 	else{
	// 		passport.authenticate("local")(req,res,function(){
	// 			req.flash("success","Welcome To YELPCAMP " + user.username);
	// 			res.redirect("/campgrounds");
	// 		});
	// 	}
	// });
});

router.get("/login",function(req,res){
	res.render("login",{page: 'login'});
});

router.post("/login",passport.authenticate("local",{
	successRedirect:"/campgrounds",
	failureRedirect:"/login",
	failureFlash: true,
	successFlash: "Successfully Logged In!!"
}),function(req,res){
     
});


router.get("/logout",function(req,res){
	req.logout();
	req.flash("success","Logged You Out!!");
	res.redirect("/campgrounds");
});

router.get("/users/:id",function(req,res){
	User.findById(req.params.id).populate('followers').exec(function(err,foundUser){
		if(err){
			req.flash("err","Sorry,User Not Found");
			res.redirect("back");
		}else{
			Campground.find().where("author.id").equals(foundUser._id).exec(function(err,campgrounds){
				if(err){
					req.flash("err","Sorry,campground Not Found");
			        res.redirect("back");
				}else{
					res.render("users/show",{user:foundUser,campgrounds:campgrounds});
				}
			});
		}
	});
});

router.get('/follow/:id', middleware.isLoggedIn, async function(req, res) {
  try {
    let user = await User.findById(req.params.id);
	var already_a_follower=false;
	user.notifications.splice(0,user.notifications.length);
	user.followers.forEach(function(follower_id){
		if(follower_id.equals(req.user._id)){
			already_a_follower=true;
		}
	});
    if(!user._id.equals(req.user._id) && !already_a_follower){
		user.followers.push(req.user._id);
        user.save();
        req.flash('success', 'Successfully followed ' + user.username + '!');
	}
    res.redirect('/users/' + req.params.id);
  } catch(err) { 
    req.flash('error', err.message);
    res.redirect('back');
  }
});

router.get('/unfollow/:id', middleware.isLoggedIn, async function(req, res) {
  try {
    let user = await User.findById(req.params.id);
	var already_a_follower=false;
	user.followers.forEach(function(follower_id){
		if(follower_id.equals(req.user._id)){
			already_a_follower=true;
		}
	});
    if(!user._id.equals(req.user._id) && already_a_follower){
		var ind=user.followers.indexOf(req.user._id);
		user.followers.splice(ind,1);
        user.save();
        req.flash('success', 'Successfully unfollowed ' + user.username + '!');
	}
    res.redirect('/users/' + req.params.id);
  } catch(err) { 
    req.flash('error', err.message);
    res.redirect('back');
  }
});

// view all notifications
router.get('/notifications',  middleware.isLoggedIn, async function(req, res) {
  try {
    let user = await User.findById(req.user._id).populate({
      path: 'notifications',
      options: { sort: { "_id": -1 } }
    }).exec();
    let allNotifications = user.notifications;
    res.render('notifications/show', { Notifications:allNotifications });
  } catch(err) {
    req.flash('error', err.message);
    res.redirect('back');
  }
});

// handle notification
router.get('/notifications/:id',  middleware.isLoggedIn, async function(req, res) {
  try {
    let notification = await Notification.findById(req.params.id);
    notification.isRead = true;
    notification.save();
	if(notification.activity==="deleted" || notification.activity==="deleted a comment on"){
         res.redirect("/campgrounds");
		//res.send("bfbf");
	}
    else{
		res.redirect(`/campgrounds/${notification.campgroundId}`);
	}
  } catch(err) {
    req.flash('error', err.message);
    res.redirect('back');
  }
});

router.get("/forgot",function(req,res){
	res.render("forgot.ejs");
});

router.post('/forgot', function(req, res, next) {
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      User.findOne({ email: req.body.email }, function(err, user) {
        if (!user) {
          req.flash('error', 'No account with that email address exists.');
          return res.redirect('/forgot');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: 'nitish3658@gmail.com',
          pass:process.env.GMAIL_PW
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'nitish3658@gmail.com',
        subject: 'Yelp Camp Password Reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        console.log('mail sent');
        req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/forgot');
  });
});

router.get('/reset/:token', function(req, res) {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/forgot');
    }
    res.render('reset', {token: req.params.token});
  });
});

router.post('/reset/:token', function(req, res) {
  async.waterfall([
    function(done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('back');
        }
        if(req.body.password === req.body.confirm) {
          user.setPassword(req.body.password, function(err) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            user.save(function(err) {
              req.logIn(user, function(err) {
                done(err, user);
              });
            });
          })
        } else {
            req.flash("error", "Passwords do not match.");
            return res.redirect('back');
        }
      });
    },
    function(user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: 'nitish3658@gmail.com',
          pass:process.env.GMAIL_PW
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'nitish3658@mail.com',
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success', 'Success! Your password has been changed.');
        done(err);
      });
    }
  ], function(err) {
    res.redirect('/campgrounds');
  });
});

module.exports=router;