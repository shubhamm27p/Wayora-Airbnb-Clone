require('dotenv').config();
const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
  debug: true
});

const filePath = path.join(__dirname, 'tmp_test_image.png');
fs.writeFileSync(filePath, Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AAn0BFJ6/WXMAAAAASUVORK5CYII=', 'base64'));

cloudinary.uploader.upload(filePath, { folder: 'wanderlusr_test' }, (err, res) => {
  fs.unlinkSync(filePath);
  if (err) {
    console.error('UPLOAD_ERR', err);
    process.exit(1);
  }
  console.log('UPLOAD_OK', res.secure_url);
  process.exit(0);
});
