require('dotenv').config();
const https = require('https');
const { URLSearchParams } = require('url');
const cloudinary = require('cloudinary').v2;
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

const timestamp = Math.floor(Date.now() / 1000);
const signature = cloudinary.utils.api_sign_request({ timestamp }, process.env.CLOUD_API_SECRET);

const params = new URLSearchParams();
params.append('file', 'https://res.cloudinary.com/demo/image/upload/sample.jpg');
params.append('api_key', process.env.CLOUD_API_KEY);
params.append('timestamp', timestamp);
params.append('signature', signature);
params.append('folder', 'wanderlusr_test');

const options = {
  hostname: 'api.cloudinary.com',
  path: `/v1_1/${process.env.CLOUD_NAME}/image/upload`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(params.toString()),
  },
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('STATUS', res.statusCode);
    console.error('HEADERS', res.headers);
    console.error('BODY', data);
    process.exit(res.statusCode === 200 ? 0 : 1);
  });
});

req.on('error', (err) => {
  console.error('ERR', err);
  process.exit(1);
});
req.write(params.toString());
req.end();
