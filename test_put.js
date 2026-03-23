import http from 'http';

const data = JSON.stringify({
  authorId: 9,
  content: 'testing edit from node!'
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/social/1',
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log('STATUS:', res.statusCode, 'BODY:', body));
});
req.write(data);
req.end();
