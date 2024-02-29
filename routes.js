const express = require('express');
const router = express.Router();
const axios = require('axios');
require('dotenv').config();
const API_KEY = process.env.GOOGLE_API_KEY;
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
// pool in pg package is a connection pooler that maintains a pool of connections 
// and allows you to reuse them rather than opening a new connection every time 
// you need to interact with the database. 
const { Pool } = require('pg');

const pool = new Pool({
  user: DB_USER,
  host: 'localhost',
  database: 'maps_places',
  password: DB_PASSWORD,
  port: 5432,
});

// Foodbanks route
router.get('/places', async (req, res) => {
  const url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
  try {
    const result = await axios.get(url, {
      params : {
        key: API_KEY,
        ...req.query
      }
    });
    res.json(result.data);
    console.log(result.data);

  } catch (error) {
    res.status(500).json({message: error.message});
  }

});

// backend
router.get('/placeDetails', async (req, res) => {
    const url = 'https://maps.googleapis.com/maps/api/place/details/json';
  
    try {
      const { placeIds } = req.query;
  
      if (!placeIds) {
        return res.status(400).json({ message: 'Missing placeIds parameter' });
      }
  
      // Split placeIds into an array
      const placeIdArray = placeIds.split(',');
  
      // Fetch place details for each placeId
      const placeDetailsArray = await Promise.all(
        placeIdArray.map(async (placeId) => {
          const result = await axios.get(url, {
            params: {
              key: API_KEY,
              placeid: placeId,
            },
          });
          return result.data.result;
        })
      );
  
      // Insert placeDetailsArray into the database
      await insertPlaceDetailsArrayToDatabase(placeDetailsArray);
  
      res.json({ message: 'Place details inserted successfully' });
    } catch (error) {
      console.error('Error fetching and inserting place details:', error);
      res.status(500).json({ message: error.message });
    }
  });

const insertPlaceDetailsArrayToDatabase = async (placeDetailsArray) => {
    const client = await pool.connect();
  
    try {
      for (const placeDetails of placeDetailsArray) {
        // Input validation
        if (!placeDetails || !placeDetails.place_id) {
          console.error('Invalid placeDetails object:', placeDetails);
          continue; // Skip this iteration and move to the next one
        }
  
        console.log('Inserting place:', JSON.stringify(placeDetails, null, 2));
  
        // Extracting the first photo reference (if available)
        const photoReference = placeDetails.photos && placeDetails.photos.length > 0
          ? placeDetails.photos[0].photo_reference
          : null;
  
        // Creating the photo URL
        const photoUrl = photoReference
          ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=200&photoreference=${photoReference}&key=${API_KEY}`
          : null;
  
        const query = `
          INSERT INTO places (
            place_id, 
            name, 
            formatted_address, 
            formatted_phone_number, 
            rating, 
            website, 
            opening_hours, 
            photo_reference, 
            photo_url, 
            latitude, 
            longitude
          ) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `;
  
        await client.query(query, [
          placeDetails.place_id,
          placeDetails.name,
          placeDetails.formatted_address,
          placeDetails.formatted_phone_number || null,
          placeDetails.rating || null,
          placeDetails.website || null,
          placeDetails.opening_hours ? JSON.stringify(placeDetails.opening_hours) : null,
          placeDetails.photos && placeDetails.photos.length > 0 ? placeDetails.photos[0].photo_reference : null,
          photoUrl, // Use the defined photoUrl variable here
          placeDetails.geometry.location.lat,
          placeDetails.geometry.location.lng
        ]);
  
        console.log('PlaceDetails data successfully inserted into the database.');
      }
    } catch (error) {
      console.error('Error inserting placeDetailsArray data into the database:', error.message);
    } finally {
      client.release();
    }
  };

module.exports = router;