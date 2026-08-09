const mongoose = require('mongoose');
const initdata= require('./data.js');
const Listing = require('../models/listing.js');
const Review = require('../models/review.js');

const MONGO_URL= "mongodb://127.0.0.1:27017/wanderlust";

 main() 
    .then(() => {
        console.log("connected to DB");
    })
    .catch((err) => {
        console.log(err);
    });
    
async function main() {
    await mongoose.connect(MONGO_URL);
}

const initDB = async () => {
    await Listing.deleteMany({});
    await Review.deleteMany({});
    const updatedData = [];
    for (let obj of initdata.data) {
        let geometry = { type: 'Point', coordinates: [77.5946, 12.9716] };
        const queryStr = [obj.location, obj.country].filter(Boolean).join(', ');
        if (queryStr) {
            try {
                const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryStr)}`;
                const res = await fetch(url, { headers: { 'User-Agent': 'Wanderlust-App/1.0' } });
                const data = await res.json();
                if (data && data.length > 0) {
                    const lat = parseFloat(data[0].lat);
                    const lon = parseFloat(data[0].lon);
                    if (!isNaN(lat) && !isNaN(lon)) {
                        geometry = { type: 'Point', coordinates: [lon, lat] };
                    }
                }
            } catch (e) {
                console.warn('Init geocode error for', queryStr, e.message);
            }
        }
        updatedData.push({
            ...obj,
            owner: "64a9c3e8b1d5f8e1c8c5d7e9",
            geometry
        });
    }
    await Listing.insertMany(updatedData);
    console.log("Data was intialized");
};

initDB();
