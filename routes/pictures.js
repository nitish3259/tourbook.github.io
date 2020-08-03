var express=require("express");
var router=express.Router({mergeParams:true});
var Campground=require("../models/campground.js");
var Picture=require("../models/pictures.js");
var mongoose=require("mongoose");
var middleware=require("../middleware/index.js");

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

router.get("/new",middleware.isLoggedIn,function(req,res){
	Campground.findById(req.params.id,function(err,campground){
		if(err){
			console.log(err.message);
			res.redirect("back");
		}else{
			res.render("pictures/new",{campground:campground});
		}
	});
});

router.post("/", middleware.isLoggedIn, upload.single('image'), function(req, res) {
    cloudinary.v2.uploader.upload(req.file.path, function(err, result) {
        if (err) {
		  req.flash('error', err.message);
		  return res.redirect('back');
		  }
      // add cloudinary url for the image to the campground object under image property
      req.body.picture.image = result.secure_url;
      // add image's public_id to campground object
      req.body.picture.imageId = result.public_id;
      // add author to campground
      req.body.picture.author = {
        id: req.user._id,
        username: req.user.username
      }
	  Campground.findById(req.params.id,function(err,campground){
		  if (err) {
		  req.flash('error', err.message);
		  return res.redirect('back');
		  }
		  Picture.create(req.body.picture, function(err,picture) {
		 if (err) {
		 req.flash('error', err.message);
		 return res.redirect('back');
		 }
		 campground.pictures.push(picture);
		 campground.save();
		 res.redirect("/campgrounds");
		 });
	  });
    });
});

router.get("/",function(req,res){
	Campground.findById(req.params.id).populate("pictures").exec(function(err,foundCampground){
		if(err){
			req.flash('error', err.message);
		    return res.redirect('back');
		}else{  
			res.render("pictures/index",{campground:foundCampground});
		}
	});
});

router.get("/:picture_id/edit",middleware.checkPictureOwnership,function(req,res){
	Picture.findById(req.params.picture_id,function(err,foundpicture){
		if(err){
			res.redirect("back");
		}else{
			res.render("pictures/edit",{campground_id:req.params.id,picture:foundpicture});
		}
	});
});

router.put("/:picture_id",middleware.checkPictureOwnership,upload.single('image'),function(req,res){
			Picture.findById(req.params.picture_id,async function(err, picture){
			if(err){
			req.flash("error", err.message);
			res.redirect("back");
			} else {
			if (req.file) {
				try{
					await cloudinary.v2.uploader.destroy(picture.imageId);
					var result=await cloudinary.v2.uploader.upload(req.file.path);
					picture.imageId = result.public_id;
			        picture.image = result.secure_url;
				}catch(err){
					req.flash("error", err.message);
			res.redirect("back");
				}   
			}
			picture.description = req.body.description;
		    picture.save();
			req.flash("success","Successfully Updated!");
			res.redirect("/campgrounds");
			}
			});
});

router.delete("/:picture_id",middleware.checkPictureOwnership,function(req,res){
	Picture.findById(req.params.picture_id,async function(err,picture){
		if(err){
			req.flash("error", err.message);
            res.redirect("back");
		}else{
			try{
				await cloudinary.v2.uploader.destroy(picture.imageId);
				picture.remove();
				req.flash("success", "picture deleted successfully");
				res.redirect("/campgrounds");
			}catch(err){
				req.flash("error", err.message);
                res.redirect("back");
			}
		}
	});
});

module.exports=router;