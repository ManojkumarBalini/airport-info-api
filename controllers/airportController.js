const Airport = require('../models/Airport');

exports.getAirportByIata = (req, res) => {
  const iataCode = req.params.iata_code;
  
  // Validate IATA code format (2-3 uppercase letters)
  if (!/^[A-Z]{2,3}$/i.test(iataCode)) {
    return res.status(400).json({ 
      error: "Invalid IATA code format. Must be 2-3 letters." 
    });
  }
  
  Airport.findByIata(iataCode, (err, airport) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: "Internal server error" });
    }
    
    if (!airport) {
      return res.status(404).json({ error: "Airport not found" });
    }
    
    // Format response according to specification
    const response = {
      airport: {
        id: airport.id,
        icao_code: airport.icao_code,
        iata_code: airport.iata_code,
        name: airport.name,
        type: airport.type,
        latitude_deg: airport.latitude_deg,
        longitude_deg: airport.longitude_deg,
        elevation_ft: airport.elevation_ft,
        address: {
          city: {
            id: airport.city_id,
            name: airport.city_name,
            country_id: airport.country_id,
            is_active: airport.city_is_active === 1, // Convert to boolean
            lat: airport.city_lat,
            long: airport.city_long
          },
          country: airport.country_id ? {
            id: airport.country_id,
            name: airport.country_name,
            country_code_two: airport.country_code_two,
            country_code_three: airport.country_code_three,
            mobile_code: airport.mobile_code,
            continent_id: airport.country_continent_id
          } : null
        }
      }
    };
    
    res.json(response);
  });
};