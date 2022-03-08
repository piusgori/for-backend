require('dotenv');
const bodyParser = require('body-parser');
const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth');
const shopRoutes = require('./routes/shop');
const multer = require('multer');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const fs = require('fs');
const https = require('https');

const mongoUrl = process.env.MONGO_DB;
const app = express();


app.use(bodyParser.json());
app.use('/photographyImageSections', express.static(path.join(__dirname, 'public', 'photographyImageSections')));

const fileStorage = multer.diskStorage({destination: ((req, file, cb) => {cb(null, path.join(__dirname, 'public', 'photographyImageSections'))}), filename: ((req, file, cb) => {cb(null, file.originalname)})})
const fileFilter = (req, file, cb) => {
    if(file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg'){
        cb(null, true);
    } else{
        cb(null, false);
    } 
}
const upload = multer({storage: fileStorage, fileFilter: fileFilter}).single('image');



app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
})

// const privateKey = fs.readFileSync('piusserver.key');
// const certificate = fs.readFileSync('piusserver.csr');

const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), {flags: 'a'})

app.use(upload);
app.use(helmet());
app.use(compression());
app.use(morgan('combined', {stream: accessLogStream}));

app.use(authRoutes);
app.use(shopRoutes);

app.use((error, req, res, next) => {
    const status = error.statusCode || 500;
    const errorMessage = error.errorMessage;
    res.status(status).json({message: "there is some error", errorMessage: errorMessage});
})

mongoose.connect(mongoUrl).then(result => {
    app.listen(process.env.PORT || 8000);
})