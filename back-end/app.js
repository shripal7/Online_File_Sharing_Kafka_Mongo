var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var passport = require('passport');
var cors = require('cors');
require('./routes/passport')(passport);
var kafka = require('./routes/kafka/client');
var routes = require('./routes/index');
var handler = require('./routes/handler');
var mongoSessionURL = "mongodb://localhost:27017/sessions";
var expressSessions = require("express-session");
var mongoStore = require("connect-mongo/es5")(expressSessions);
const util = require('util');
var Busboy= require('busboy');
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(passport.initialize());

app.use(logger('dev'));

var corsOptions = {
    origin: 'http://localhost:3000',
    credentials: true,
}
app.use(cors(corsOptions))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(expressSessions({
    secret: "CMPE273_passport",
    resave: false,
    //Forces the session to be saved back to the session store, even if the session was never modified during the request
    saveUninitialized: false, //force to save uninitialized session to db.
    //A session is uninitialized when it is new but not modified.
    duration: 60 * 60 * 1000,
    activeDuration: 5 * 60 * 1000,
    store: new mongoStore({
        url: mongoSessionURL
    })
}));
app.use(passport.initialize());

app.use('/', routes);
app.use('/users', handler);


app.post('/getDetails',function(req,res){
    kafka.make_request('login_topic',{type:"getdetails",username:req.body.username}, function(err,results){
        if(err){
            res.status(500).send({message:"Internal Server error"});
        }
        else
        {
            if(results.code == 200){

                res.status(201).json(results.value);
            }
            else {
                res.status(400).send({message:"Bad request"});
            }
        }
    });

})


app.post('/doLogin', function(req, res) {
	console.log("Inside Do Login");
	var username=req.body.username;
	var password=req.body.password;
	kafka.make_request('login_topic',{type:"login",username:username,password:password}, function(err,results){
                console.log(req.body);
                console.log(results);
                if(err){
                    res.status(500).send({message:"Internal Server error"});
                }
                else
                {
                    if(results.code == 200){
                    	res.status(201).send(results.value);
                    }
                    else{
                        res.status(400).send({message:"Bad request"});
                    }
                }
            });

      
    });




app.post('/getupload', function(req,res) {
	var busboy = new Busboy({ headers: req.headers });

	busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
	      console.log('File [' + fieldname + ']: filename: ' + filename + ', encoding: ' + encoding + ', mimetype: ' + mimetype);
	      var data1="";
	      file.on('data', function(data) {
	    	  data1=data;
	      });
	      file.on('end', function() {
	      });
	      console.log(data1);
	    });
		req.pipe(busboy);
	
kafka.make_request('login_topic',{type:"uploader",file:req.body.name}, function(err,results){
        
        if(err){
            res.status(500).send({message:"Internal Server error"});
        }
        else
        {
            if(results.code == 200){
            	res.status(201).json(results.value);
            }
            else {
            	res.status(401).json({status:401,message:"In uploading file"});
            }
        }
    });


  
});

module.exports = app;
