const http = require('http');

const allClientsData = [];

// Generate 35 clients for nearby Pondicherry (Base Lat: 11.9416, Lon: 79.8083)
for (let i = 1; i <= 35; i++) {
  const lat = 11.9416 + (Math.random() - 0.5) * 0.1;
  const lon = 79.8083 + (Math.random() - 0.5) * 0.1;
  allClientsData.push({
    name: "Pondy Client " + i,
    email: "pondy.client" + i + "@fems.com",
    password: "client123",
    lat: lat,
    longitude: lon,
    latitude: lat,
    address: "Pondicherry Region " + i,
    phone: "98765432" + (i % 100).toString().padStart(2, '0')
  });
}

// Generate 25 clients in Tamil Nadu (5 clusters of 5)
const tnCities = [
  { lat: 13.0827, lon: 80.2707 }, // Chennai
  { lat: 11.0168, lon: 76.9558 }, // Coimbatore
  { lat: 9.9252, lon: 78.1198 },  // Madurai
  { lat: 10.7905, lon: 78.7047 }, // Trichy
  { lat: 11.6643, lon: 78.1460 }  // Salem
];
const cityNames = ["Chennai", "Coimbatore", "Madurai", "Trichy", "Salem"];

let tnCounter = 1;
for (let c = 0; c < tnCities.length; c++) {
  for (let i = 1; i <= 5; i++) {
    const lat = tnCities[c].lat + (Math.random() - 0.5) * 0.1;
    const lon = tnCities[c].lon + (Math.random() - 0.5) * 0.1;
    allClientsData.push({
      name: cityNames[c] + " Client " + i,
      email: cityNames[c].toLowerCase() + ".client" + i + "@fems.com",
      password: "client123",
      latitude: lat,
      longitude: lon,
      address: cityNames[c] + " Region " + i + ", Tamil Nadu",
      phone: "87654321" + (tnCounter % 100).toString().padStart(2, '0')
    });
    tnCounter++;
  }
}

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
    try {
      const parsedData = JSON.parse(data);
      if (!parsedData.token) {
        console.error("Login failed:", parsedData);
        return;
      }
      const token = parsedData.token;
      console.log(`Logged in as Admin. Adding ${allClientsData.length} new clients...`);
      
      let index = 0;
      function addNextClient() {
        if (index >= allClientsData.length) {
          console.log("All clients successfully processed.");
          return;
        }
        const client = allClientsData[index];
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
           console.log(`Client ${client.name} Created: ${apiRes.statusCode}`);
           index++;
           addNextClient();
        });
        
        apiReq.on('error', err => {
            console.error(`Error adding ${client.name}:`, err.message);
            index++;
            addNextClient();
        });

        apiReq.write(JSON.stringify(client));
        apiReq.end();
      }
      
      addNextClient();
    } catch (e) {
      console.error("Error parsing login response:", e);
    }
  });
});

req.on('error', err => {
    console.error("Could not connect to backend server. Make sure it is running. Error:", err.message);
});

req.write(JSON.stringify({email: 'admin@fems.com', password: 'admin123'}));
req.end();
