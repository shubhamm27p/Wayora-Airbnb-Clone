const mongoose = require('mongoose');
const review = require('./review');

// const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80';

const listingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  image: {
    url: {
      type: String,
      default: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80"
    },
    filename: String
  },
  price: Number,
  location: {
    type: String,
    required: true,
    trim: true,
  },
  country: {
    type: String,
    required: true,
    trim: true,
  },
  reviews: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Review'
    },
  ],
  owner: {
    type : mongoose.Schema.Types.ObjectId,
    ref:'User'
  },
  geometry: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
    }
  },
  category: {
    type: String,
    required: true,
    enum: [
      "Trending",
      "Rooms",
      "Iconic Cities",
      "Beach",
      "Amazing Pools",
      "Castles",
      "Mountains",
      "Camping",
      "Farms",
      "Arctic",
      "Boats",
      "Skiing",
      "Lakefront",
      "Golfing",
      "Tiny Homes",
      "Tropical",
      "Bed & Breakfast"
    ],
    trim: true
  }
});

listingSchema.post("findOneAndDelete", async (listing) => {
  if (listing)  {
    await review.deleteMany({ _id: { $in: listing.reviews } });
  }
});

const Listing = mongoose.model('Listing', listingSchema, 'listings');

module.exports = Listing;
// const mongoose = require('mongoose');
// const Schema = mongoose.Schema;
// const listingSchema = new mongoose.Schema({
//     title: {
//         type: String,
//         required: true,
//     },
//     description:String,
//     image: {
//         filename: String,
//         url: {
//             Type: String,
//         default: "https://tse3.mm.bing.net/th/id/OIP.MInViflWTn0CIsOU3esbLwHaE5?r=0&rs=1&pid=ImgDetMain&o=7&rm=3",   
//         set:(v) => v === "" ? "https://tse3.mm.bing.net/th/id/OIP.MInViflWTn0CIsOU3esbLwHaE5?r=0&rs=1&pid=ImgDetMain&o=7&rm=3" : v,
//     },
// },
//     price:Number,
    
//     location: String,
//     country: String,

// }); 

// const Listing = mongoose.model('Listing', listingSchema, 'listings');

// module.exports = Listing;




