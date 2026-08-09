require('dotenv').config();
const cloudinary = require('cloudinary').v2;
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET
});
cloudinary.uploader.upload('https://res.cloudinary.com/demo/image/upload/sample.jpg', (err, res) => {
  if (err) {
    console.error('UPLOAD_ERR', err);
    process.exit(1);
  }
  console.log('UPLOAD_OK', res.secure_url);
});
