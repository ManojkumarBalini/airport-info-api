const db = require('../config/database');

class Airport {
  static findByIata(iataCode, callback) {
    const sql = `
      SELECT 
        a.*,
        c.id as city_id,
        c.name as city_name,
        c.lat as city_lat,
        c.long as city_long,
        c.is_active as city_is_active,
        co.id as country_id,
        co.name as country_name,
        co.country_code_two,
        co.country_code_three,
        co.mobile_code,
        co.continent_id as country_continent_id
      FROM airport a
      LEFT JOIN city c ON a.city_id = c.id
      LEFT JOIN country co ON c.country_id = co.id
      WHERE a.iata_code = ?
    `;
    
    db.get(sql, [iataCode.toUpperCase()], (err, row) => {
      if (err) {
        return callback(err);
      }
      callback(null, row);
    });
  }
}

module.exports = Airport;