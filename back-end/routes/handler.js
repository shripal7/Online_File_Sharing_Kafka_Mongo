var express = require('express');
var passport = require("passport");
var kafka = require('./kafka/client');
var mongoSessionURL = "mongodb://localhost:27017/sessions";
var expressSessions = require("express-session");
var mongoStore = require("connect-mongo/es5")(expressSessions);
var router = express.Router();
var session = require('client-sessions');
var Busboy=require('busboy');
router.use(passport.initialize());

router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});



router.post('/doLogin', function(req, res) {
	console.log("Inside Do Login");
	var username=req.body.username;
	var password=req.body.password;

	 passport.authenticate('login', function(err, user) {
	        if(err) {
                res.status(500).send({message:"Internal Server Error"});
	        }

	        if(!user) {
	            res.status(401).send();
	        }
	        req.session.user = user.username;
	        console.log(req.session.user);
	        console.log("session initilized");
	        return res.status(201).send({status:201,username:username});
	    })(req, res);

    });

router.post('/doSignup', function(req, res) {
	console.log("Inside doSignup");
	var firstname=req.body.firstname;
	var lastname=req.body.lastname;
	var email=req.body.email;
	var password=req.body.password;
	kafka.make_request('login_topic',{type:"signer",firstname:firstname,password:password,lastname:lastname,email:email}, function(err,results){
                console.log(results);
                if(err){
                	res.status(500).send({message:"Internal Server Error"});
                }
                else
                {
                    if(results.code == 200){
                    	res.status(201).send(results.value);
                    }
                    else{
                    	res.status(400).send({message:"Bad Request"});
                    }
                }
            });
        	

    });


router.post('/createFolder', function(req, res) {
	var foldername=req.body.folderName;
	kafka.make_request('login_topic',{type:"createFolder",foldername:foldername}, function(err,results){
                console.log(req.body);
                console.log(results);
                if(err){
                    res.status(500).send({message:"Internal Server Error"});
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

router.post('/createSharedFolder',function(req,res){
	var userlist=req.body.userlist;
	var sharedfoldername=req.body.sharedFolderName;
	console.log("Inside createSharedFolder");
	kafka.make_request('login_topic',{type:"createSharedFolder",sharedfoldername:sharedfoldername,userlist:userlist}, function(err,results){
        console.log(req.body);
        console.log(results);
        if(err){
            res.status(500).send({message:"Internal Server Error"});
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

router.post('/upload',function(req,res){
	console.log("Inside upload");
	var busboy = new Busboy({ headers: req.headers });
	   var data1;
	busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
	      console.log('File [' + fieldname + ']: filename: ' + filename + ', encoding: ' + encoding + ', mimetype: ' + mimetype);
	      file.on('data', function(data) {
	    	  data1+=data;
	       console.log('File [' + fieldname + '] got ' + data.length + ' bytes');
	      });
	      file.on('end', function() {
	    	  console.log(filename);
	    	  var filename1=filename;
	    	  kafka.make_request('login_topic',{type:"upload",filename:filename1,data:data1}, function(err,results){
	    	        console.log(req.body);
	    	        console.log(results);
	    	        if(err){
                        res.status(500).send({message:"Internal Server Error"});
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
	      
	    });
		req.pipe(busboy);
		
	
	
});

router.get('/getImg', function(req, res) {
	kafka.make_request('login_topic',{type:"filelist"}, function(err,results){
                console.log(results);
                if(err){
                    res.status(500).send({message:"Internal Server Error"});
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



router.post('/deleteFile', function(req, res) {
	var delete1=req.body.path_to_delete;
	kafka.make_request('login_topic',{type:"delete",delt:delete1}, function(err,results){
                console.log(req.body);
                console.log(results);
                if(err){
                    res.status(500).send({message:"Internal Server Error"});
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


router.get('/doLogout', function(req, res) {
    kafka.make_request('login_topic',{type:"logout"}, function(err,results){
        console.log("session destroyed");
        if(err){
            res.status(500).send({message:"Internal Server Error"});
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


module.exports = router;