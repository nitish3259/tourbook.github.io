var mongoose=require("mongoose");

var hotelSchema = new mongoose.Schema({
   name: String,
   image: String,
   price: String,
   url:String,
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
   imageId:String,
   createdAt: { type: Date, default: Date.now },
   author: {
   id: {
	   type:mongoose.Schema.Types.ObjectId,
	   ref:"User"
   },
   username:String
   }
});
 
module.exports = mongoose.model("Hotel", hotelSchema);