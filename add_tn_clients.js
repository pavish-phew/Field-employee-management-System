const http = require('http');

const pondyPrefixes = ["Oceanic", "Auroville", "Heritage", "Bay", "Coral", "White Town", "Promenade", "Serenity", "Coromandel", "Marina", "French Quarter", "Lighthouse", "Botanical", "Ousteri", "Chitra"];
const tnPrefixes = ["Southern", "Madras", "Kongu", "Chola", "Pandiya", "Deccan", "Eastern", "Apex", "Prime", "Global", "Sterling", "Pioneer", "Trinity", "Zenith", "Vertex"];
const suffixes = ["Enterprises", "Tech Solutions", "Logistics Pvt Ltd", "Trading Co.", "Industries", "Group", "Services", "Exports", "Innovations", "Ventures", "Corporation", "Holdings", "Associates", "Dynamics", "Systems"];

const pondyAreas = ["White Town, Puducherry", "Auroville, Puducherry", "Lawspet, Puducherry", "Reddiarpalayam, Puducherry", "Muthialpet, Puducherry", "Ariyankuppam, Puducherry", "Villianur, Puducherry", "Kalapet, Puducherry"];

const tnAreas = [
  ["Anna Salai, Chennai", "T Nagar, Chennai", "OMR IT Expr, Chennai", "Adyar, Chennai", "Velachery, Chennai"],
  ["RS Puram, Coimbatore", "Avinashi Road, Coimbatore", "Peelamedu, Coimbatore", "Gandhipuram, Coimbatore", "Saravanampatti, Coimbatore"],
  ["Anna Nagar, Madurai", "KK Nagar, Madurai", "Simmakkal, Madurai", "Kalavasal, Madurai", "Tallakulam, Madurai"],
  ["Cantonment, Trichy", "Thillai Nagar, Trichy", "Srirangam, Trichy", "Woraiyur, Trichy", "TVS Tolgate, Trichy"],
  ["Fairlands, Salem", "Hasthampatti, Salem", "Alagapuram, Salem", "Four Roads, Salem", "Suramangalam, Salem"]
];

const allClientsData = [];

// Generate 35 Professional clients for Pondicherry
for (let i = 0; i < 35; i++) {
  // Safe bounds for Pondicherry to prevent landing in the Bay of Bengal ocean
  // Lat: 11.89 to 11.97, Lon: 79.75 to 79.82
  const lat = 11.89 + Math.random() * 0.08;
  const lon = 79.75 + Math.random() * 0.07;
  
  const name = `${pondyPrefixes[i % pondyPrefixes.length]} ${suffixes[i % suffixes.length]}`;
  const address = pondyAreas[i % pondyAreas.length];

  allClientsData.push({
    name: name,
    email: `contact.pondy${i + 1}@fems.com`,
    password: "client123",
    latitude: lat,
    longitude: lon,
    address: address,
    phone: "98765432" + (i % 100).toString().padStart(2, '0')
  });
}

// Generate 25 Professional clients in Tamil Nadu (5 clusters of 5)
const tnCities = [
  { lat: 13.0827, lon: 80.2707 }, // Chennai
  { lat: 11.0168, lon: 76.9558 }, // Coimbatore
  { lat: 9.9252, lon: 78.1198 },  // Madurai
  { lat: 10.7905, lon: 78.7047 }, // Trichy
  { lat: 11.6643, lon: 78.1460 }  // Salem
];

let tnCounter = 0;
for (let c = 0; c < tnCities.length; c++) {
  for (let i = 0; i < 5; i++) {
    // City bounds
    const lat = tnCities[c].lat + (Math.random() - 0.5) * 0.04;
    const lon = tnCities[c].lon + (Math.random() - 0.5) * 0.04;
    
    const name = `${tnPrefixes[tnCounter % tnPrefixes.length]} ${suffixes[(tnCounter+5) % suffixes.length]}`;
    const address = tnAreas[c][i];

    allClientsData.push({
      name: name,
      email: `contact.tn${tnCounter + 1}@fems.com`,
      password: "client123",
      latitude: lat,
      longitude: lon,
      address: address,
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
      console.log(`Logged in as Admin. Adding ${allClientsData.length} new professional clients...`);
      
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
