require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const FormData = require('form-data');
const https = require('https');

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

const timestamp = Math.floor(Date.now() / 1000);
const signature = cloudinary.utils.api_sign_request({ timestamp }, process.env.CLOUD_API_SECRET);
const form = new FormData();
form.append('file', 'https://res.cloudinary.com/demo/image/upload/sample.jpg');
form.append('api_key', process.env.CLOUD_API_KEY);
form.append('timestamp', timestamp);
form.append('signature', signature);
form.append('folder', 'wanderlusr_test');

const req = https.request({
  method: 'POST',
  host: 'api.cloudinary.com',
  path: `/v1_1/${process.env.CLOUD_NAME}/image/upload`,
  headers: form.getHeaders(),
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('STATUS', res.statusCode);
    console.log('HEADERS', res.headers);
    console.log('BODY', data);
    process.exit(res.statusCode === 200 ? 0 : 1);
  });
});
form.pipe(req);
req.on('error', (err) => { console.error('REQ_ERR', err); process.exit(1); });
