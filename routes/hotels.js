var express=require("express");
var router=express.Router({mergeParams:true});
var Campground=require("../models/campground.js");
var Hotel=require("../models/hotels.js");
var mongoose=require("mongoose");
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

router.get("/new",middleware.isLoggedIn,function(req,res){
	Campground.findById(req.params.id,function(err,campground){
		if(err){
			console.log(err.message);
			res.redirect("back");
		}else{
			res.render("hotels/new",{campground:campground});
		}
	});
});

router.post("/", middleware.isLoggedIn, upload.single('image'), function(req, res) {
	 geocoder.geocode(req.body.address, function (err, data) {
    if (err || !data.length) {
	  console.log(err);
      req.flash('error', 'Invalid address');
      return res.redirect('back');
    }
    req.body.hotel.location = {
		type:"Point",
		coordinates:[data[0].longitude,data[0].latitude]
	};
    req.body.hotel.address = data[0].formattedAddress;
    cloudinary.v2.uploader.upload(req.file.path, function(err, result) {
		
        if (err) {
		  req.flash('error', err.message);
		  return res.redirect('back');
		  }
      // add cloudinary url for the image to the campground object under image property
      req.body.hotel.image = result.secure_url;
      // add image's public_id to campground object
      req.body.hotel.imageId = result.public_id;
      // add author to campground
      req.body.hotel.author = {
        id: req.user._id,
        username: req.user.username
      }
	  Campground.findById(req.params.id,function(err,campground){
		  if (err) {
		  req.flash('error', err.message);
		  return res.redirect('back');
		  }
		   Hotel.create(req.body.hotel, function(err,hotel) {
		 if (err) {
		 req.flash('error', err.message);
		 return res.redirect('back');
		 }
		 campground.hotels.push(hotel);
		 campground.save();
		 res.redirect("/campgrounds");
		 });
	  });
    });
   });
});

router.get("/",function(req,res){
	Campground.findById(req.params.id).populate("hotels").exec(function(err,foundCampground){
		if(err){
			req.flash('error', err.message);
		    return res.redirect('back');
		}else{  
			res.render("hotels/index",{campground:foundCampground});
		}
	});
});

router.get("/:hotel_id/edit",middleware.checkHotelOwnership,function(req,res){
	Hotel.findById(req.params.hotel_id,function(err,foundhotel){
		if(err){
			res.redirect("back");
		}else{
			res.render("hotels/edit",{campground_id:req.params.id,hotel:foundhotel});
		}
	});
});

router.put("/:hotel_id",middleware.checkHotelOwnership,upload.single('image'),function(req,res){
			Hotel.findById(req.params.hotel_id,async function(err, hotel){
			if(err){
			req.flash("error", err.message);
			res.redirect("back");
			} else {
			if (req.file) {
				try{
					await cloudinary.v2.uploader.destroy(hotel.imageId);
					var result=await cloudinary.v2.uploader.upload(req.file.path);
					hotel.imageId = result.public_id;
			        hotel.image = result.secure_url;
				}catch(err){
					req.flash("error", err.message);
			        res.redirect("back");
				}   
			}
			if(req.body.address !== hotel.address){
                try{
                    var updatedLocation = await geocoder.geocode(req.body.address);
					hotel.location = {
		                type:"Point",
		                coordinates:[ updatedLocation[0].longitude, updatedLocation[0].latitude]
	                };
                    hotel.address = updatedLocation[0].formattedAddress;                
                } catch(err){
                    req.flash("error", err.message);
                    return res.redirect("back");
                }
            }
			hotel.name = req.body.name;
			hotel.price = req.body.price;
			hotel.url = req.body.url;
			//console.log(hotel);
			hotel.save();
			req.flash("success","Successfully Updated!");
			res.redirect("/campgrounds");
			}
			});
});

router.delete("/:hotel_id",middleware.checkHotelOwnership,function(req,res){
	Hotel.findById(req.params.hotel_id,async function(err,hotel){
		if(err){
			req.flash("error", err.message);
            res.redirect("back");
		}else{
			try{
				await cloudinary.v2.uploader.destroy(hotel.imageId);
				hotel.remove();
				req.flash("success", "hotel deleted successfully");
				res.redirect("/campgrounds");
			}catch(err){
				req.flash("error", err.message);
                res.redirect("back");
			}
		}
	});
});

module.exports=router;