var express=require("express");
var router=express.Router();
var Campground=require("../models/campground.js");
var Comment=require("../models/comment.js");
var User = require("../models/user");
var moment= require("moment");
var Notification = require("../models/notification");
var middleware=require("../middleware/index.js");

var NodeGeocoder = require('node-geocoder');
 
var options = {
  provider: process.env.GEOCODER_PROVIDER,
  httpAdapter: 'https',
  apiKey: process.env.GEOCODER_API_KEY,
  formatter: null
};
 
var geocoder = NodeGeocoder(options);


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
  api_key:496875726527852, 
  api_secret: "NSNfOrohSUD1m_6k3E2beio5f5E"
});

router.get("/",function(req,res){
	var noMatch = null;
	if(req.query.search){
		var regex = new RegExp(escapeRegex(req.query.search), 'gi');
		Campground.find({name:regex},function(err,allcampgrounds){
		if(err){
			console.log(err);
		}
		else{
			if(allcampgrounds.length < 1) {
                  noMatch = "No TourBlogs match that query, please try again.";
              }
			res.render("campgrounds/index",{campgrounds:allcampgrounds,page: 'campgrounds', noMatch: noMatch});
		}
	});
	}else{
		Campground.find({},function(err,allcampgrounds){
		if(err){
			console.log(err);
		}
		else{
			res.render("campgrounds/index",{campgrounds:allcampgrounds,page: 'campgrounds', noMatch: noMatch});
		}
	});
	}
});

// router.post("/", middleware.isLoggedIn, upload.single('image'), function(req, res) {
//       cloudinary.v2.uploader.upload(req.file.path,async function(err, result) {
//       if(err) {
//         req.flash('error', err.message);
//         return res.redirect('back');
//       }
//       // add cloudinary url for the image to the campground object under image property
//       req.body.campground.image = result.secure_url;
//       // add image's public_id to campground object
//       req.body.campground.imageId = result.public_id;
//       // add author to campground
//       req.body.campground.author = {
//         id: req.user._id,
//         username: req.user.username
//       }
//     try {
//       let campground = await Campground.create(req.body.campground);
//       let user = await User.findById(req.user._id).populate('followers').exec();
// 	  var activity="uploaded a campground "+ campground.name + " " +moment(campground.createdAt).fromNow() ;
// 	  user.activity.push(activity);
// 	  user.save();
//       let newNotification = {
//         username: req.user.username,
//         campgroundId: campground.id,
// 		activity:"created"
//       }
//       for(const follower of user.followers) {
//         let notification = await Notification.create(newNotification);
//         follower.notifications.push(notification);
//         follower.save();
//       }

//       //redirect back to campgrounds page
//       res.redirect("/campgrounds");
//     } catch(err) {
//       req.flash('error', err.message);
//       res.redirect('back');
//     }
// });
// });



//CREATE - add new campground to DB
router.post("/", middleware.isLoggedIn,  upload.single('image'),function(req, res){
  // get data from form and add to campgrounds array
  geocoder.geocode(req.body.address, function (err, data) {
    if (err || !data.length) {
	  console.log(err);
      req.flash('error', 'Invalid address');
      return res.redirect('back');
    }
    req.body.campground.location = {
		type:"Point",
		coordinates:[data[0].longitude,data[0].latitude]
	};
    req.body.campground.address = data[0].formattedAddress;
 
    cloudinary.v2.uploader.upload(req.file.path,async function(err, result) {
      if(err) {
        req.flash('error', err.message);
        return res.redirect('back');
      }
      // add cloudinary url for the image to the campground object under image property
      req.body.campground.image = result.secure_url;
      // add image's public_id to campground object
      req.body.campground.imageId = result.public_id;
      // add author to campground
      req.body.campground.author = {
        id: req.user._id,
        username: req.user.username
      }
    try {
      let campground = await Campground.create(req.body.campground);
      let user = await User.findById(req.user._id).populate('followers').exec();
	  var activity="uploaded a campground "+ campground.name + " " +moment(campground.createdAt).fromNow() ;
	  user.activity.push(activity);
	  user.save();
      let newNotification = {
        username: req.user.username,
        campgroundId: campground.id,
		activity:"created"
      }
      for(const follower of user.followers) {
        let notification = await Notification.create(newNotification);
        follower.notifications.push(notification);
        follower.save();
      }

      //redirect back to campgrounds page
      res.redirect("/campgrounds");
    } catch(err) {
      req.flash('error', err.message);
      res.redirect('back');
    }
});
  });
});

router.get("/new",middleware.isLoggedIn,function(req,res){
	res.render("campgrounds/new");
});

router.get("/map",function(req,res){
	Campground.find({},function(err,allcampgrounds){
		if(err){
			req.flash("error", "campground not found");
			res.redirect("/campgrounds");
		}
		else{
			res.render("campgrounds/map",{campgrounds:allcampgrounds});
		}
	});
});

router.get("/:id",function(req,res){
	Campground.findById(req.params.id).populate("comments").exec(function(err,foundCampground){
		if(err || !foundCampground){
			req.flash("error", "campground not found");
			res.redirect("/campgrounds");
		}else{
			res.render("campgrounds/show",{campground:foundCampground});
		}
	});
});

router.get("/:id/map",function(req,res){
	Campground.findById(req.params.id).populate("hotels").exec(function(err,foundCampground){
		if(err || !foundCampground){
			req.flash("error", "campground not found");
			res.redirect("/campgrounds");
		}else{
			res.render("map/show",{campground:foundCampground});
		}
	});
	// Campground.findById(req.params.id,function(err,foundcampground){
	// 	if(err){
	// 		res.redirect("/campgrounds");
	// 	}else{
	// 		res.render("map/show",{campground:foundcampground});
	// 	}
	// });
});

router.get("/:id/edit",middleware.checkCampgroundOwnership,function(req,res){
	Campground.findById(req.params.id,function(err,foundcampground){
		if(err){
			res.redirect("/campgrounds");
		}else{
			res.render("campgrounds/edit",{campground:foundcampground});
		}
	});
});

router.put("/:id",middleware.checkCampgroundOwnership,upload.single('image'),function(req,res){
	Campground.findById(req.params.id,async function(err, campground){
        if(err){
            req.flash("error", err.message);
            res.redirect("back");
        } else {
            if (req.file) {
				try{
					await cloudinary.v2.uploader.destroy(campground.imageId);
					var result=await cloudinary.v2.uploader.upload(req.file.path);
					campground.imageId = result.public_id;
                    campground.image = result.secure_url;
				}catch(err){
					req.flash("error", err.message);
                    res.redirect("back");
				}   
            }
			  if(req.body.address !== campground.address){
                try{
                    var updatedLocation = await geocoder.geocode(req.body.address);
					campground.location = {
		                type:"Point",
		                coordinates:[ updatedLocation[0].longitude, updatedLocation[0].latitude]
	                };
                    campground.address = updatedLocation[0].formattedAddress;                
                } catch(err){
                    req.flash("error", err.message);
                    return res.redirect("back");
                }
            }
			campground.name = req.body.name;
			campground.price = req.body.price;
			campground.description = req.body.description;
			campground.save();
			
			//res.redirect("/campgrounds/" + campground._id);
			try {
           // let campground = await Campground.create(req.body.campground);
            let user = await User.findById(req.user._id).populate('followers').exec();
			var activity="updated a campground "+ campground.name + " " +moment(campground.createdAt).fromNow() ;
	        user.activity.push(activity);
	        user.save();
            let newNotification = {
              username: req.user.username,
              campgroundId: campground.id,
		      activity:"updated"
            }
            for(const follower of user.followers) {
              let notification = await Notification.create(newNotification);
              follower.notifications.push(notification);
              follower.save();
            }

      //redirect back to campgrounds page
			req.flash("success","Successfully Updated!");
            res.redirect("/campgrounds/" + campground._id);
          } catch(err) {
            res.redirect('back');
          }
           }
    });
});

router.delete("/:id",middleware.checkCampgroundOwnership,function(req,res){
	Campground.findById(req.params.id,async function(err,campground){
		if(err){
			req.flash("error", err.message);
            res.redirect("back");
		}else{
			try{
				var activity="deleted a campground "+ campground.name + " " +moment(campground.createdAt).fromNow() ;
				await cloudinary.v2.uploader.destroy(campground.imageId);
				campground.remove();
				req.flash("success", "campground deleted successfully");
				 let user = await User.findById(req.user._id).populate('followers').exec();
	            user.activity.push(activity);
	            user.save();
                 let newNotification = {
                   username: req.user.username,
                   //campgroundId: campground.id,
		           activity:"deleted"
                 }
                 for(const follower of user.followers) {
                   let notification = await Notification.create(newNotification);
                   follower.notifications.push(notification);
                   follower.save();
                 }
				res.redirect("/campgrounds");
			    }catch(err){
				req.flash("error", err.message);
                res.redirect("back");
			}
		}
	});
});

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports=router;