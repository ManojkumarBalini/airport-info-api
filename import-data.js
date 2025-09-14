const csv = require('csv-parser');
const fs = require('fs');
const db = require('./config/database');

console.log('Starting data import...');

// We'll store the data in memory first to handle relationships
const airports = [];
const cities = new Map();
const countries = new Map();

// Function to insert data in batches
function insertInBatches(table, columns, data, batchSize = 100) {
  return new Promise((resolve, reject) => {
    let processed = 0;
    
    function processBatch() {
      const batch = data.slice(processed, processed + batchSize);
      if (batch.length === 0) {
        resolve();
        return;
      }
      
      const placeholders = batch.map(() => `(${columns.map(() => '?').join(', ')})`).join(',');
      const flatValues = batch.flatMap(item => columns.map(col => item[col]));
      
      const sql = `INSERT OR IGNORE INTO ${table} (${columns.join(', ')}) VALUES ${placeholders}`;
      
      db.run(sql, flatValues, function(err) {
        if (err) {
          reject(err);
          return;
        }
        
        console.log(`Inserted ${this.changes} records into ${table}`);
        processed += batch.length;
        processBatch(); // Process next batch
      });
    }
    
    processBatch();
  });
}

fs.createReadStream('airport.csv')
  .pipe(csv())
  .on('data', (row) => {
    // Extract airport data
    const airport = {
      id: parseInt(row.id),
      icao_code: row.icao_code,
      iata_code: row.iata_code,
      name: row.name,
      type: row.type,
      city_id: parseInt(row.city_id),
      country_id: parseInt(row.country_id),
      continent_id: parseInt(row.continent_id),
      latitude_deg: parseFloat(row.latitude_deg),
      longitude_deg: parseFloat(row.longitude_deg),
      elevation_ft: row.elevation_ft ? parseInt(row.elevation_ft) : null
    };
    airports.push(airport);
    
    // Extract city data
    if (!cities.has(row.city_id)) {
      cities.set(row.city_id, {
        id: parseInt(row.city_id),
        name: `City ${row.city_id}`, // Placeholder name
        country_id: parseInt(row.country_id),
        is_active: 1, // SQLite uses 1 for true
        lat: parseFloat(row.latitude_deg),
        long: parseFloat(row.longitude_deg)
      });
    }
    
    // Extract country data
    if (!countries.has(row.country_id)) {
      countries.set(row.country_id, {
        id: parseInt(row.country_id),
        name: `Country ${row.country_id}`, // Placeholder name
        country_code_two: 'XX', // Placeholder
        country_code_three: 'XXX', // Placeholder
        mobile_code: 0, // Placeholder
        continent_id: parseInt(row.continent_id)
      });
    }
  })
  .on('end', () => {
    console.log('CSV file processed. Importing to database...');
    
    // Convert maps to arrays
    const countryValues = Array.from(countries.values());
    const cityValues = Array.from(cities.values());
    
    // Import data in batches
    Promise.all([
      insertInBatches('country', ['id', 'name', 'country_code_two', 'country_code_three', 'mobile_code', 'continent_id'], countryValues),
      insertInBatches('city', ['id', 'name', 'country_id', 'is_active', 'lat', 'long'], cityValues)
    ])
    .then(() => {
      // After countries and cities are imported, import airports
      return insertInBatches('airport', 
        ['id', 'icao_code', 'iata_code', 'name', 'type', 'city_id', 'country_id', 'continent_id', 'latitude_deg', 'longitude_deg', 'elevation_ft'], 
        airports
      );
    })
    .then(() => {
      console.log('Data import completed successfully!');
    })
    .catch(err => {
      console.error('Error during import:', err);
    });
  });