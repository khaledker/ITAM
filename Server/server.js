import mysql from 'mysql2';


const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'mahdi',
    database: 'itam',
}).promise()



 const [rows] = await pool.query('SELECT * FROM Asset'); 
 console.log(rows);



/*
const express = require('express');
 const app = express();


    app.get('/api', (req, res) => {

        res.json({asset : 'pc', price : '10000 DZD'});
    });

    app.listen(5000, () => {
        console.log('Server is running on port 5000');
    });*/