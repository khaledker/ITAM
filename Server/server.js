 const express = require('express');
 const app = express();


    app.get('/api', (req, res) => {

        res.json({asset : 'pc', price : '10000 DZD'});
    });

    app.listen(5000, () => {
        console.log('Server is running on port 5000');
    });