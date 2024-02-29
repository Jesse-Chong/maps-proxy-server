DROP DATABASE IF EXISTS maps_places;

CREATE DATABASE maps_places;

\c maps_places;

CREATE TABLE places (
  place_id VARCHAR(1000) PRIMARY KEY,
  name VARCHAR(255),
  formatted_address VARCHAR(1000),
  formatted_phone_number VARCHAR(20),
  rating FLOAT,
  website VARCHAR(255),
  opening_hours JSONB,
  photo_reference VARCHAR(1000), -- Store the reference to the primary photo
  photo_url VARCHAR(1000),       -- Store the URL to the primary photo
  latitude FLOAT,               -- Store the latitude of the location
  longitude FLOAT
);