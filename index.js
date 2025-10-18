const express = require('express');
const app = express();
const PORT = Number(process.env.PORT) || 8000;
const ideasRoute = require('./Routes/ideasRoute');
app.use(express.json());
app.use(express.urlencoded({ extended: true })); 

app.use('/', ideasRoute);

app.listen(PORT, '0.0.0.0', ()=>{
    console.log(`Listening on port ${PORT}`)
})