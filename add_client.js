const http = require('http');

const req = http.request({
  hostname: 'localhost',
  port: 8080,
  path: '/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
}, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const token = JSON.parse(data).token;
    console.log("Token: ", token);
    const apiReq = http.request({
      hostname: 'localhost',
      port: 8080,
      path: '/api/clients',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }, apiRes => {
       console.log('Client Created: ' + apiRes.statusCode);
    });
    apiReq.write(JSON.stringify({
      name: "Villupuram Logistics",
      email: "villupuram@fems.com",
      password: "client123",
      address: "Villupuram",
      latitude: 11.9390,
      longitude: 79.4861
    }));
    apiReq.end();
  });
});
req.write(JSON.stringify({email: 'admin@fems.com', password: 'admin123'}));
req.end();
