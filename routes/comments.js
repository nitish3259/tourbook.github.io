var express=require("express");
var router=express.Router({mergeParams:true});
var Campground=require("../models/campground.js");
var Comment=require("../models/comment.js");
var mongoose=require("mongoose");
var User = require("../models/user");
var moment= require("moment");
var Notification = require("../models/notification");
var middleware=require("../middleware/index.js");

router.get("/new",middleware.isLoggedIn,function(req,res){
	console.log(req.params.id);
	Campground.findById(req.params.id,function(err,campground){
		if(err){
			console.log(err);
		}else{
			res.render("comments/new",{campground:campground});
		}
	});
});

router.post("/",middleware.isLoggedIn,function(req,res){
	Campground.findById(req.params.id,function(err,campground){
		if(err){
			console.log(err);
			res.redirect("/campgrounds");
		}else{
			Comment.create(req.body.comment,async function(err,comment){
				if(err){
					req.flash("err","something went wrong");
					res.redirect("back");
				}else{
					comment.author.id=req.user._id;
					comment.author.username=req.user.username;
					comment.save();
					campground.comments.push(comment);
					campground.save();
					try {
                    //let campground = await Campground.create(req.body.campground);
                    let user = await User.findById(req.user._id).populate('followers').exec();
	                var activity="commented on "+ campground.name + " "+moment(comment.createdAt).fromNow() ;
	                user.activity.push(activity);
	                user.save();
                    let newNotification = {
                      campgroundId: campground.id,
		              activity:"commented",
				      username:req.user.username
                    }
                    for(const follower of user.followers) {
					  let notification = await Notification.create(newNotification);
                      follower.notifications.push(notification);
                      follower.save();
                    }
                     req.flash("success","Successfully Added The Comment");
                     res.redirect("/campgrounds/"+campground._id);
                    } catch(err) {
                      req.flash('error', err.message);
                      res.redirect('back');
                    }
					
				}
			});
		}
	});
});

router.get("/:comment_id/edit",middleware.checkCommentOwnership,function(req,res){
	Campground.findById(req.params.id, function(err, foundCampground) {
        if(err || !foundCampground) {
            req.flash("error", "No campground found");
            return res.redirect("back");
        }
        Comment.findById(req.params.comment_id, function(err, foundComment){
            if(err){
                res.redirect("back");
            } else {
                res.render("comments/edit", {campground_id: req.params.id, comment: foundComment});
            }
        });
    });
	// Comment.findById(req.params.comment_id,function(err,foundComment){
	// 	if(err){
	// 		res.redirect("back");
	// 	}else{
	// 		res.render("comments/edit",{campground_id:req.params.id,comment:foundComment});
	// 	}
	// });
});

router.put("/:comment_id",middleware.checkCommentOwnership,function(req,res){
		Comment.findByIdAndUpdate(req.params.comment_id,req.body.comment,async function(err,updatedcomment){
			try {
           // let campground = await Campground.create(req.body.campground);
            let user = await User.findById(req.user._id).populate('followers').exec();
			let campground=await Campground.findById(req.params.id); 
			var activity="updated his comment on "+ campground.name + " "+moment(updatedcomment.createdAt).fromNow() ;
	        user.activity.push(activity);
	        user.save();
            let newNotification = {
              username: req.user.username,
              campgroundId: req.params.id,
		      activity:"updated a comment on"
            }
            for(const follower of user.followers) {
              let notification = await Notification.create(newNotification);
              follower.notifications.push(notification);
              follower.save();
            }

      //redirect back to campgrounds page
            res.redirect("/campgrounds/"+req.params.id);
          } catch(err) {
            res.redirect('back');
          }
		// if(err){
		// 	res.redirect("back");
		// }else{
		// 	res.redirect("/campgrounds/"+req.params.id);
		// }
	});
});

router.delete("/:comment_id",middleware.checkCommentOwnership,function(req,res){	
	Comment.findByIdAndRemove(req.params.comment_id,async function(err){
	        try{
				 let user = await User.findById(req.user._id).populate('followers').exec();
				let campground=await Campground.findById(req.params.id);
				var activity="commented on "+ campground.name;
	            user.activity.push(activity);
	            user.save();
                 let newNotification = {
                   username: req.user.username,
                   //campgroundId: campground.id,
		           activity:"deleted a comment on"
                 }
                 for(const follower of user.followers) {
                   let notification = await Notification.create(newNotification);
                   follower.notifications.push(notification);
                   follower.save();
                 }
				req.flash("success","comment deleted");
				res.redirect("/campgrounds/"+req.params.id);
			    }catch(err){
				req.flash("error", err.message);
                res.redirect("back");
			}
		// if(err){
		// 	res.redirect("back");
		// 	console.log(err);
		// }else{
		// 	req.flash("success","comment deleted");
			
		// 	res.redirect("/campgrounds/"+req.params.id);
		// }
	});
});

module.exports=router;
