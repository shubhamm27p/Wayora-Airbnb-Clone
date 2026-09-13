require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const User = require('./models/user.js');
const Listing = require('./models/listing.js');

const MONGO_URL = process.env.ATLASDB_URL || "mongodb://127.0.0.1:27017/wanderlust";

async function main() {
    await mongoose.connect(MONGO_URL);
    console.log("connected to DB");

    const username = "wayora";
    const password = "Sp4522119#";
    
    // Find or create user
    let user = await User.findOne({ username });
    if (!user) {
        console.log(`User ${username} not found. Creating...`);
        const newUser = new User({ email: `${username}@example.com`, username });
        user = await User.register(newUser, password);
        console.log("User created:", user._id);
    } else {
        console.log(`User ${username} found:`, user._id);
    }

    // Read CSV
    const csvData = fs.readFileSync('listings.csv', 'utf-8');
    const lines = csvData.split('\n').filter(line => line.trim() !== '');
    
    // Skip header
    const headers = lines[0].split(',');
    
    const listingsToAdd = [];
    
    for (let i = 1; i < lines.length; i++) {
        const row = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        if (!row || row.length < 7) continue;

        const cleanStr = (str) => str ? str.replace(/^"|"$/g, '').trim() : '';

        const title = cleanStr(row[0]);
        const description = cleanStr(row[1]);
        const image_url = cleanStr(row[2]);
        const price = parseFloat(cleanStr(row[3]));
        const location = cleanStr(row[4]);
        const country = cleanStr(row[5]);
        const category = cleanStr(row[6]);

        let geometry = { type: 'Point', coordinates: [77.5946, 12.9716] };
        
        listingsToAdd.push({
            title,
            description,
            image: { url: image_url, filename: "listingimage" },
            price,
            location,
            country,
            category,
            owner: user._id,
            geometry
        });
    }

    if (listingsToAdd.length > 0) {
        await Listing.insertMany(listingsToAdd);
        console.log(`Successfully added ${listingsToAdd.length} listings to the database.`);
    } else {
        console.log("No listings found to add.");
    }
    
    mongoose.connection.close();
}

main().catch(err => {
    console.error(err);
    mongoose.connection.close();
});
