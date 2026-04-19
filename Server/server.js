import express from 'express';
import mysql from 'mysql2';
import dotenv from 'dotenv';
dotenv.config();    
import { getassets } from './database.js';



const app = express();



app.get('/assets', async (req, res) => {
    const assets = await getassets();
    res.send(assets);
});




app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});


app.listen(3000, () => {
  console.log('Server is running on port 3000');
});