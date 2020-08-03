var Campground=require("../models/campground.js");
var Comment=require("../models/comment.js");
var Hotel=require("../models/hotels.js");
var Picture=require("../models/pictures.js");

var middlewareObj={};

middlewareObj.checkCampgroundOwnership=function(req,res,next){
	if(req.isAuthenticated()){
		Campground.findById(req.params.id,function(err,foundcampground){
			if(err || !foundcampground){
				req.flash("error","Campground Not Found");
				res.redirect("back");
			}else{
				if(foundcampground.author.id.equals(req.user._id) || req.user.IsAdmin){
					next();
				}else{
					req.flash("error","You Don't Have Permission To Do That!!");
					res.redirect("back");
				}
			}
		});
	}else{
		req.flash("error","Please Login First");
		res.redirect("/login");
	}
};

middlewareObj.checkCommentOwnership=function(req,res,next){
	if(req.isAuthenticated()){
		Comment.findById(req.params.comment_id,function(err,foundcomment){
			if(err || !foundcomment){
				req.flash("error","Comment Not Found");
				res.redirect("back");
			}else{
				if(foundcomment.author.id.equals(req.user._id) || req.user.IsAdmin){
					next();
				}else{
					req.flash("error","You Don't Have Permission To Do That!!");
					res.redirect("back");
				}
			}
		 });
	
	}else{
		req.flash("error","Please Login First");
		res.redirect("back");
	}
};

middlewareObj.checkHotelOwnership=function(req,res,next){
	if(req.isAuthenticated()){
		Hotel.findById(req.params.hotel_id,function(err,foundhotel){
			if(err){
				req.flash("error","hotel Not Found");
				res.redirect("back");
			}else{
				if(foundhotel.author.id.equals(req.user._id) || req.user.IsAdmin){
					next();
				}else{
					req.flash("error","You Don't Have Permission To Do That!!");
					res.redirect("back");
				}
			}
		 });
	
	}else{
		req.flash("error","Please Login First");
		res.redirect("back");
	}
};

middlewareObj.checkPictureOwnership=function(req,res,next){
	if(req.isAuthenticated()){
		Picture.findById(req.params.picture_id,function(err,foundpicture){
			if(err){
				req.flash("error","picture Not Found");
				res.redirect("back");
			}else{
				if(foundpicture.author.id.equals(req.user._id) || req.user.IsAdmin){
					next();
				}else{
					req.flash("error","You Don't Have Permission To Do That!!");
					res.redirect("back");
				}
			}
		 });
	
	}else{
		req.flash("error","Please Login First");
		res.redirect("back");
	}
};

middlewareObj.isLoggedIn=function(req,res,next){
	if(req.isAuthenticated()){
		return next();
	}
	else{
		req.flash("error","Please Login First");
		res.redirect("/login");
	}
};

module.exports=middlewareObj;