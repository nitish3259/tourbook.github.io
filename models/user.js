var mongoose=require("mongoose");
var passportLocalMongoose=require("passport-local-mongoose");

var userSchema = new mongoose.Schema({
   username:{type:String,unique:true,required:true},
   imageId:String,
   password:String,
   email:{type:String,unique:true,required:true},
   first_name:String,
   last_name:String,
   avatar:String,
   resetPasswordToken:String,
   resetPasswordExpires:Date,
   IsAdmin:{type:Boolean,default:false},
   notifications: [
    	{
    	   type: mongoose.Schema.Types.ObjectId,
    	   ref: 'Notification'
    	}
    ],
    followers: [
    	{
    		type: mongoose.Schema.Types.ObjectId,
    		ref: 'User'
    	}
    ],
	activity:[String]
});

userSchema.plugin(passportLocalMongoose);
 
module.exports = mongoose.model("User", userSchema);