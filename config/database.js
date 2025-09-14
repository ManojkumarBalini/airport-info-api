const sqlite3 = require('sqlite3').verbose();

// Create and configure SQLite database
const db = new sqlite3.Database('./airports.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
    
    // Enable foreign keys
    db.run('PRAGMA foreign_keys = ON');
    
    // Create tables if they don't exist
    db.serialize(() => {
      // Country table
      db.run(`CREATE TABLE IF NOT EXISTS country (
        id INTEGER PRIMARY KEY,
        name TEXT,
        country_code_two TEXT,
        country_code_three TEXT,
        mobile_code INTEGER,
        continent_id INTEGER
      )`);
      
      // City table (using INTEGER for boolean as SQLite doesn't have BOOLEAN type)
      db.run(`CREATE TABLE IF NOT EXISTS city (
        id INTEGER PRIMARY KEY,
        name TEXT,
        country_id INTEGER,
        is_active INTEGER DEFAULT 1,
        lat REAL,
        long REAL,
        FOREIGN KEY (country_id) REFERENCES country (id)
      )`);
      
      // Airport table
      db.run(`CREATE TABLE IF NOT EXISTS airport (
        id INTEGER PRIMARY KEY,
        icao_code TEXT,
        iata_code TEXT,
        name TEXT,
        type TEXT,
        city_id INTEGER,
        country_id INTEGER,
        continent_id INTEGER,
        latitude_deg REAL,
        longitude_deg REAL,
        elevation_ft INTEGER,
        FOREIGN KEY (city_id) REFERENCES city (id),
        FOREIGN KEY (country_id) REFERENCES country (id)
      )`);
    });
  }
});

module.exports = db;