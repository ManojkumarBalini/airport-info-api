const express = require('express');
const router = express.Router();
const airportController = require('../controllers/airportController');

router.get('/:iata_code', airportController.getAirportByIata);

module.exports = router;