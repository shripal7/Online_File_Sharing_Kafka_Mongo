var mongo = require("./mongo");
var multer=require('multer');
var session = require('client-sessions');
var shell=require('shelljs');
var bcrypt=require('bcrypt');
var mongoURL = "mongodb://localhost:27017/dropboxShripal";
var rn = require('random-number');
var fs=require('fs');
var path=require('path');
var glob = require('glob');

var options = {
		  min:  0,
		  max:  10001,
		  integer: true
		}
function handle_request(msg, callback){

    var res = {};
    console.log("In handle request:"+ JSON.stringify(msg));
    if(msg.type=='login'){
    		mongo.connect(mongoURL, function(){
    	    console.log('Connected to mongo at: ' + mongoURL);
    	    var coll = mongo.collection('users');


    	    coll.findOne({"email": msg.username}, function(err, user){
    	        if (bcrypt.compareSync(msg.password, user.password)) {
    	            console.log("Data found in database:",user)
    	            session.username = msg.username;
    	            console.log("Session initialized=> session username: ", session.username);
    	            res.code = "200";
        			res.value = {username: session.username,status: 201 };
        			callback(null, res);
    	        } else {
    	          console.log("User Data not found in the database.");
    	          res.code = "401";
      			res.value = {message: "Login failed",status: 401};
      			callback(null, res);
    	        }
    	    });
    	});
    }
    else if(msg.type=='signer'){
    	mongo.connect(mongoURL, function(){
    	      console.log('Connected to mongo at: ' + mongoURL);
    	      var coll = mongo.collection('users');
    	      // generating salt.
    	      var salt = bcrypt.genSaltSync(10);
    	      var hash = bcrypt.hashSync(msg.password, salt);

    	      coll.insert({ firstname: msg.firstname, lastname: msg.lastname, email: msg.email, password: hash}, function(err, users){
    	          if (users) {
    	            console.log("Data inserted into the users collection under dropbox database");
    	            var folder = "././public/uploads/Userfiles/" + msg.email;

    	            fs.mkdir(folder, function (err) {

    	                if (!err) {
    	                    console.log('Folder created');
    	                    res.code = "200";
    	        				res.value = {status: 201 };
    	        				callback(null, res);
    	                }
    	                else {
    	                	console.log('Folder creation failed');
    	                	res.code = "401";
	        				res.value = {status: 401 };
	        				callback(null, res);
    	                }
    	            })

    	          } else {
    	            console.log("error while signing up");
    	         	res.code = "401";
    				res.value = {status: 401 };
    				callback(null, res);
    	          }
    	      });
    	  });
    		
    }
    else if(msg.type=='filelist'){
    	    var userPath = session.username;
    	    console.log(' Get Image=>Username session:', session.username);

    	    var resArr = [];

    	    glob('public/uploads/Userfiles/' + userPath + '/' + '*', function (er, files) {

    	        var userPath = session.username;
    	        var resArr = files.map(function (file) {
    	            var imgJSON = {};
    	            console.log('file:', file);
    	            imgJSON.img = 'uploads/Userfiles/' + userPath + '/' + file.split('/')[4];
    	            console.log('imgJson.img:', imgJSON.img);
    	            imgJSON.cols = 2;
    	            imgJSON.starred=false;
    	            imgJSON.myfileName= file.toString().split('/')[4];
    	            return imgJSON;
    	        });

    	        console.log('resArr:', resArr);
    	        var objSession= session.username;
    	        resObj={resArray: resArr, objectSession: objSession};

    	        console.log('resObj:', resObj);
    	     	res.code="200";
            	res.value=resObj;
            	callback(null, res);
    	    });
    	  
    	
    	 
    	
    }
    else if(msg.type=='logout'){
    		session.username="";
    	    console.log('Session destroyed');
    	    res.code = "200";
			res.value = {message:'Logout Successful'};
			callback(null, res);
    }
    else if(msg.type=='createFolder'){
    	var userPath = session.username;
        console.log('inside create folder: ', userPath);
        console.log('inside create foldername HAI=>', msg.foldername);

        var newFolder = '././public/uploads/Userfiles/' + userPath + '/'+msg.foldername;

        fs.mkdir(newFolder, function (err) {
            if (!err) {
                console.log('Directory created');
                res.code = "200";
    			res.value = {message:'Directory created'};
    			callback(null, res);
            }
            else {
            	res.code = "401";
    			res.value = {message:'Logout Successful'};
    			callback(null, res);
            }
        });
    }
    else if(msg.type=='createSharedFolder'){
    	var userPath = session.username;
    	console.log('inside createSharedfolder: ', userPath);
        console.log('inside createSharedfolder HAI=>', msg.userlist);

        var newSharedFolder = '././public/uploads/Userfiles/' + userPath + '/'+msg.sharedfoldername;

        console.log("newFolder Path :", newSharedFolder);

        console.log("Userlists to share the folder with: ", msg.userlist);

        fs.mkdir(newSharedFolder, function (err) {
            if (!err) {
                console.log('Directory created');
            }
            else {
            		console.log('Unable to create');
            		res.code='401';
            		res.value={message:"not created"};
                callback(null,res);
            }
        });

      var rand = rn(options);
      console.log(rand);

        mongo.connect(mongoURL, function(){
              console.log('Connected to mongo at: ' + mongoURL);
              var coll = mongo.collection('groups');

              coll.insert({ GID: rand, admin: session.username}, function(err, users){
                  if (users) {
                    console.log("Data inserted into the groups collection for group description.");

                  } else {
                    console.log("data insertion error in groups collection.");
                  }
              });
          });


    mongo.connect(mongoURL, function(){
          console.log('Connected to mongo at: ' + mongoURL);
          var coll = mongo.collection('groupDetails');

          coll.insert({ GID: rand, admin: session.username, username: session.username}, function(err, users){
              if (users) {
                console.log("Data inserted into the groups collection for group description.");

              } else {
                console.log("data insertion error in groups collection.");
              }
          });
      });

        console.log("userlists in which we have to create the shared folder are: ", msg.userlist);
        var userlist = msg.userlist;
        userlists = userlist.split(',');

        for(var i=0;i<userlists.length;i++) {
          //usrs.push(userlists[i]);
          var newSharedFolder = '././public/uploads/Userfiles/' + userlists[i] + '/'+msg.sharedfoldername;
          fs.mkdir(newSharedFolder, function (err) {

              if (!err) {
                  console.log('Directory created');
                //  res.status(201).end();
              }
              else {
            	  res.code='401';
          		res.value={message:"not created"};
              callback(null,res);
              }
          });
        }
        console.log("length of userlist array :  ", userlists.length);
        console.log("contents of userlists array:   ", userlists);


      for(var j=0;j<userlists.length;j++) {
        mongo.connect(mongoURL, function(){
              console.log('Connected to mongo at: ' + mongoURL);
              var coll = mongo.collection('groupDetails');

              coll.insert({ GID: rand, admin: session.username, username: JSON.stringify(userlists[j])}, function(err, users){
                  if (users) {
                    console.log("Data inserted into the groups collection for group description.");
                  } else {
                    console.log("data insertion error in groups collection.");
                  }
              });
          });
        }
      res.code='200';
		res.value={message:"directory successfully created"};
  callback(null,res);

    }
    else if(msg.type=='upload'){
    	var userPath = session.username;
    
    	var homeDir='././public/uploads/Userfiles/'+userPath+'/'+msg.filename;
    	fs.writeFile(homeDir,msg.data, function(err) {
    	    if(err) {
    	        return console.log(err);
    	    }

    	    console.log("The file was saved!");
    	}); 
  
        console.log('Req.body=> backend upload file=>', userPath);
        
        res.code="200";
        res.value={message:"File uploaded"};
        callback(null,res);
    }
    else if(msg.type=="uploader"){


        var obj=shell.ls('../');
        console.log(obj);
        mongo.connect(mongoURL, function(){
            console.log('Connected to mongo at: ' + mongoURL);

            var coll = mongo.collection('files');

            coll.find({}).toArray(function(err, user){
                if (user) {
                    filelist=user;
                    console.log(filelist);
                    res.code="200";
                    res.value={status:201,files:msg.file,filelist:JSON.parse(JSON.stringify(filelist)),obj:JSON.parse(JSON.stringify(obj))};
                    callback(null, res);
                } else {
                    res.code = "401";
                    res.value = "Failed Check Session";
                    callback(null, res);
                }
            })


        });


    }
    else if(msg.type=="delete"){
    	 console.log("checking whether path has reached inside deleteFile on back end??", msg.delt);

        var homeDir='././public/';
        fs.unlinkSync(homeDir + msg.delt);

    	 res.code="200";
     res.value={};
     callback(null,res);
    }

    else{
    	
    }
}

exports.handle_request = handle_request;