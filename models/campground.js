var mongoose=require("mongoose");

var campgroundSchema = new mongoose.Schema({
   name: String,
   image: String,
   price: String,
   imageId:String,
   description: String,
   address: String,
   location: {
    type: {
      type: String, // Don't do `{ location: { type: String } }`
      enum: ['Point'] // 'location.type' must be 'Point'
    },
    coordinates: {
      type: [Number],
	  index:"2dsphere"
    }
    },
   createdAt: { type: Date, default: Date.now }, 
   author: {
   id: {
	   type:mongoose.Schema.Types.ObjectId,
	   ref:"User"
   },
   username:String
   },
   comments: [
      {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Comment"
      }
   ],
   hotels:[
	   {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Hotel"
      }
   ],
   pictures:[
	   {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Picture"
      }
   ]
});
 
module.exports = mongoose.model("Campground", campgroundSchema);