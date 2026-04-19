import mysql from 'mysql2';


const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
}).promise()


const getassets = async () => {
 const [rows] = await pool.query('SELECT * FROM Asset'); 
 console.log(rows);
}

const asset = getassets();
console.log(asset);


/*
const express = require('express');
 const app = express();


    app.get('/api', (req, res) => {

        res.json({asset : 'pc', price : '10000 DZD'});
    });

    app.listen(5000, () => {
        console.log('Server is running on port 5000');
    });*/