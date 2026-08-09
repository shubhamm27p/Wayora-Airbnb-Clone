require('dotenv').config();
const cloudinary = require('cloudinary').v2;
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
  debug: true
});

console.log('config', cloudinary.config());
cloudinary.uploader.upload('https://res.cloudinary.com/demo/image/upload/sample.jpg', { folder: 'wanderlusr_test' }, (err, res) => {
  if (err) {
    console.error('UPLOAD_ERR_FULL', err);
    if (err.response) console.error('ERR_RESPONSE', err.response.text || err.response.body || err.response);
    if (err.http_code) console.error('ERR_HTTP', err.http_code);
    process.exit(1);
  }
  console.log('UPLOAD_OK', res);
  process.exit(0);
});
