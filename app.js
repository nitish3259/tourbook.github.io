require('dotenv').config();
var express=require("express");
var app=express();
var bodyparser=require("body-parser");
var mongoose=require("mongoose");
var Campground=require("./models/campground.js");
var seedDB=require("./seeds.js");
var Comment=require("./models/comment.js");
var Hotel=require("./models/hotels.js");
var Picture=require("./models/pictures.js");
var User=require("./models/user.js");
var passport=require("passport");
var flash=require("connect-flash");
var methodOverride=require("method-override");
var localStrategy=require("passport-local");
var passportLocalMongoose=require("passport-local-mongoose");
var expressSession=require("express-session");

var commentRoutes=require("./routes/comments.js");
var hotelRoutes=require("./routes/hotels.js");
var pictureRoutes=require("./routes/pictures.js");
var campgroundRoutes=require("./routes/campgrounds.js");
var indexRoutes=require("./routes/index.js");

mongoose.connect("mongodb://localhost/yelp_camp",{useUnifiedTopology:true,useNewUrlParser:true});
app.use(bodyparser.urlencoded({extended:true}));
app.set("view engine","ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());

//seedDB();

app.use(expressSession({
	secret:"IIT INDORE IS BEST 2ND GENERATION IIT",
	resave:false,
	saveUninitialized:false
}));

app.locals.moment = require("moment");

app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(async function(req,res,next){
	res.locals.currentUser=req.user;
	if(req.user) {
    try {
      var user = await User.findById(req.user._id).populate('notifications', null, { isRead: false }).exec();
      res.locals.notifications = user.notifications.reverse();
    } catch(err) {
      console.log(err.message);
    }
   }
	res.locals.error=req.flash("error");
	res.locals.success=req.flash("success");
	next();
});

app.use("/campgrounds/:id/comments",commentRoutes);
app.use("/campgrounds/:id/hotels",hotelRoutes);
app.use("/campgrounds/:id/pictures",pictureRoutes);
app.use("/campgrounds",campgroundRoutes);
app.use("/",indexRoutes);

app.listen(3000,function(){
	console.log("TourBook server is listening");
});