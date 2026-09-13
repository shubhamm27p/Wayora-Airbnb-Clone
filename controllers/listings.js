const ExpressError = require('../utils/ExpressError.js');
const Listing = require('../models/listing.js');
const { cloudinary } = require('../cloudConfig.js');
const { Readable } = require('stream');
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const fs = require('fs');
const pathModule = require('path');

const DEFAULT_IMAGE_URL = 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80';

const getLocationGeometry = async (location, country = '') => {
    const fallbackGeometry = { type: 'Point', coordinates: [77.5946, 12.9716] };
    const queryStr = [location, country].filter(Boolean).join(', ').trim();

    if (!queryStr) {
        return fallbackGeometry;
    }

    // 1. Try Photon Geocoding API (Fast, Free, OpenStreetMap-based)
    try {
        const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(queryStr)}`;
        const response = await fetch(photonUrl, {
            headers: { 'User-Agent': 'Wanderlust-App/1.0' }
        });
        if (response.ok) {
            const data = await response.json();
            if (data?.features?.[0]?.geometry?.coordinates) {
                const coords = data.features[0].geometry.coordinates; // [lng, lat]
                if (Array.isArray(coords) && coords.length >= 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
                    return {
                        type: 'Point',
                        coordinates: [parseFloat(coords[0]), parseFloat(coords[1])]
                    };
                }
            }
        }
    } catch (photonErr) {
        console.warn('Photon server geocoding error:', photonErr.message);
    }

    // 2. Try OpenStreetMap Nominatim API
    try {
        const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryStr)}`;
        const response = await fetch(nomUrl, {
            headers: { 'User-Agent': 'Wanderlust-App/1.0' }
        });
        if (response.ok && response.headers.get('content-type')?.includes('json')) {
            const data = await response.json();
            if (Array.isArray(data) && data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lon = parseFloat(data[0].lon);
                if (!isNaN(lat) && !isNaN(lon)) {
                    return {
                        type: 'Point',
                        coordinates: [lon, lat]
                    };
                }
            }
        }
    } catch (nomErr) {
        console.warn('Nominatim server geocoding error:', nomErr.message);
    }

    // 3. Secondary attempt: Mapbox Geocoding
    const mapToken = process.env.Map_Token || process.env.MAP_TOKEN;
    if (mapToken && mapToken.trim()) {
        try {
            const geocodingClient = mbxGeocoding({ accessToken: mapToken.trim() });
            const response = await geocodingClient.forwardGeocode({
                query: queryStr,
                limit: 1
            }).send();

            if (response?.body?.features?.[0]?.geometry?.coordinates) {
                return response.body.features[0].geometry;
            }
        } catch (geoErr) {
            console.warn('Mapbox geocoding error:', geoErr.message);
        }
    }

    return fallbackGeometry;
};

const uploadBufferToCloudinary = (buffer) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream({ folder: 'wanderlusr_DEV' }, (error, result) => {
            if (error) return reject(error);
            resolve(result);
        });
        Readable.from(buffer).pipe(uploadStream);
    });
};

const saveLocalFile = (file) => {
    try {
        const uploadDir = pathModule.join(__dirname, '../public/uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        const ext = pathModule.extname(file.originalname || '') || '.jpg';
        const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
        const filePath = pathModule.join(uploadDir, filename);

        if (file.buffer) {
            fs.writeFileSync(filePath, file.buffer);
        } else if (file.path && fs.existsSync(file.path)) {
            fs.copyFileSync(file.path, filePath);
        }
        return { url: `/uploads/${filename}`, filename };
    } catch (err) {
        console.error('Failed to save file locally:', err);
        return null;
    }
};

const escapeRegex = (text) => {
    return text.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};

//Index 
module.exports.index = async (req, res) => {
     const { category, q } = req.query;
     let filter = {};

     if (category) {
         filter.category = new RegExp(`^${escapeRegex(category)}$`, 'i');
     }

     const searchQuery = typeof q === 'string' ? q.trim() : '';
     if (searchQuery) {
         const terms = searchQuery.split(/[\s,]+/).filter(Boolean);
         if (terms.length > 0) {
             filter.$and = terms.map(term => {
                 const reg = new RegExp(escapeRegex(term), 'i');
                 return {
                     $or: [
                         { title: reg },
                         { location: reg },
                         { country: reg }
                     ]
                 };
             });
         }
     }

     const allListings = await Listing.find(filter);
     res.render('listings/index.ejs', { 
         allListings, 
         category: category || '', 
         q: searchQuery 
     });
};

// New
module.exports.newListing  = async (req, res) => {
    res.render('listings/new.ejs');
};

// show 
module.exports.showListing = async (req, res, next) => {
    try{
        let { id } = req.params;
        const listing = await Listing.findById(id)
        .populate({path:'reviews', populate: { path: 'author' }})
        .populate('owner');
        if(!listing){
            req.flash("error", "Listing you requested for does not exist!")
            return res.redirect("/listings");
        }
        return res.render('listings/show.ejs', { listing });
    
        
} catch (err) {
    next(err);
}};

// Create
module.exports.createListing =  async (req, res, next) => {
    try {
        if (!req.body.listing) {
            throw new ExpressError(400, 'Invalid Listing Data');
        }

        const { title, description, location, country, price, category } = req.body.listing;

        if (!title?.trim() || !description?.trim() || !location?.trim() || !country?.trim()) {
            throw new ExpressError(400, 'Title, description, country, and location are required');
        }

        const listing = new Listing({
            title: title.trim(),
            description: description.trim(),
            location: location.trim(),
            country: country.trim(),
            price,
            category,
            owner: req.user._id
        });

        listing.geometry = await getLocationGeometry(location, country);

        const imageUrl = typeof req.body.listing.image === 'string' ? req.body.listing.image.trim() : '';

        if (req.file) {
            try {
                if (req.file.buffer) {
                    const result = await uploadBufferToCloudinary(req.file.buffer);
                    listing.image = { url: result.secure_url, filename: result.public_id };
                } else if (req.file.path) {
                    listing.image = { url: req.file.path, filename: req.file.filename || 'listingimage' };
                }
            } catch (uploadErr) {
                console.error('Cloudinary upload failed, saving uploaded file locally:', uploadErr.message);
                const localImage = saveLocalFile(req.file);
                listing.image = localImage || { url: imageUrl || DEFAULT_IMAGE_URL, filename: 'listingimage' };
            }
        } else if (imageUrl) {
            listing.image = { url: imageUrl, filename: 'listingimage' };
        } else {
            throw new ExpressError(400, 'Listing image is required');
        }

        await listing.save();
        req.flash("success","New Listing Created!");
        res.redirect('/listings');
    } catch (err) {
        next(err);
    }
};

// Edit
module.exports.editListing = async (req, res, next) => {
    try {
        let { id } = req.params;
        const listing = await Listing.findById(id);
        if (!listing) {
            req.flash("error", "Listing you requested for does not exist!");
            return res.redirect("/listings");
        }

        let originalImageUrl = "";
        if (listing.image) {
            if (typeof listing.image === 'string') {
                originalImageUrl = listing.image;
            } else if (listing.image.url) {
                originalImageUrl = listing.image.url;
            }
        }
        if (originalImageUrl && originalImageUrl.includes("/upload/")) {
            originalImageUrl = originalImageUrl.replace("/upload/", "/upload/w_250/");
        }

        return res.render('listings/edit.ejs', { listing, originalImageUrl });
    } catch (err) {
        next(err);
    }
};

// Update
module.exports.updateListing = async (req, res, next) => {
    try {
        if (!req.body.listing) {
            throw new ExpressError(400, 'Invalid Listing Data');
        }

        let { id } = req.params;
        const { title, description, location, country, price, image, category } = req.body.listing;

        if (!title?.trim() || !description?.trim() || !location?.trim() || !country?.trim()) {
            throw new ExpressError(400, 'Title, description, country, and location are required');
        }

        const listing = await Listing.findById(id);
        if (!listing) {
            req.flash('error', 'Listing you requested for does not exist!');
            return res.redirect('/listings');
        }

        listing.title = title.trim();
        listing.description = description.trim();
        listing.location = location.trim();
        listing.country = country.trim();
        listing.price = price;
        listing.category = category;
        listing.geometry = await getLocationGeometry(location, country);

        const imageUrl = typeof image === 'string' ? image.trim() : '';

        if (req.file) {
            try {
                if (req.file.buffer) {
                    const result = await uploadBufferToCloudinary(req.file.buffer);
                    listing.image = { url: result.secure_url, filename: result.public_id };
                } else if (req.file.path) {
                    listing.image = { url: req.file.path, filename: req.file.filename || 'listingimage' };
                }
            } catch (uploadErr) {
                console.error('Cloudinary upload failed on update, saving uploaded file locally:', uploadErr.message);
                const localImage = saveLocalFile(req.file);
                if (localImage) {
                    listing.image = localImage;
                } else if (imageUrl) {
                    listing.image = { url: imageUrl, filename: listing.image?.filename || 'listingimage' };
                }
            }
        } else if (imageUrl) {
            listing.image = { url: imageUrl, filename: listing.image?.filename || 'listingimage' };
        }

        let saveListing = await listing.save();
        console.log(saveListing);
        req.flash("success", "Listing Updated!")
        res.redirect(`/listings/${id}`);
    } catch (err) {
        next(err);
    }
};

// Delete
module.exports.deleteListing = async (req, res, next) => {
    try {
        let { id } = req.params;
        const deletedListing = await Listing.findByIdAndDelete(id);
        console.log('deleted listing:', deletedListing);
        req.flash("success", "Listing Deleted!")
        res.redirect('/listings');
    } catch (err) {
        next(err);
    }
};
