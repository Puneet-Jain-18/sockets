

	var app = require('http').createServer(handler)
    , io = require('socket.io').listen(app)
    , fs = require('fs')
    , exec = require('child_process').exec
    , util = require('util')
    var Files = {}
  
  app.listen(8080);


	function handler (req, res) {
        fs.readFile(__dirname + '/frontend/index.html',
        function (err, data) {
          if (err) {
            res.writeHead(500);
            return res.end('Error loading index.html');
          }
          res.writeHead(200);
          res.end(data);
        });
      }





      io.sockets.on('connection', function (socket) {
        console.log ("Connection Made")
        socket.on('Start', function (data) { //data contains the variables that we passed through in the html file
            console.log("REached Socket Start");
            var Name = data['Name'];
            console.log(data['Name'],data['Size'])
			Files[Name] = {  //Create a new Entry in The Files Variable
				FileSize : data['Size'],
				Data	 : "",
				Downloaded : 0
			}
			var Place = 0;
			try{
				var Stat = fs.statSync('Temp/' +  Name);
				if(Stat.isFile())
				{
					Files[Name]['Downloaded'] = Stat.size;
					Place = Stat.size / 1024000;
				}
			}
	  		catch(er){} //It's a New File
			fs.open("./Temp/" + Name, "a", 0755, function(err, fd){
				if(err)
				{
					console.log(err);
				}
				else
				{
					Files[Name]['Handler'] = fd; //We store the file handler so we can write to it later
                    console.log("EMITTING FOR MORE DATA",Place);
                    socket.emit('MoreData', { 'Place' : Place, Percent : 0 });
				}
			});
    });
//Upload event triggered everytime a new block of data is read

socket.on('Upload', function (data){
    console.log("UPPPPPPPPPPPPPPPPPPPPPPPPPPPP")
    var Name = data['Name'];
    Files[Name]['Downloaded'] += data['Data'].length;
    Files[Name]['Data'] += data['Data'];
    if(Files[Name]['Downloaded'] >= Files[Name]['FileSize']) //If File is Fully Uploaded
    {
        console.log("COMPLETEEEEE")
        var Place = Files[Name]['Downloaded'] / 1024000;
            //var Percent = (Files[Name]['Downloaded'] / Files[Name]['FileSize']) * 100;
            var inp = fs.createReadStream("Temp/" + Name);
            var out = fs.createWriteStream("Files/" + Name);
           inp.pipe(out);
           inp.on('end',function(){
               fs.unlink("Temp/"+Name,function(){
                   console.log("Removed Temporary Files")
               })
           })
            socket.emit('Done', { 'Place' : Place, 'Percent' :  100});
       
        fs.write(Files[Name]['Handler'], Files[Name]['Data'], null, 'Binary', function(err, Writen){
            //Get Thumbnail Here
        });
    }
    else if(Files[Name]['Data'].length > 10240000){ //If the Data Buffer reaches 10MB
        fs.write(Files[Name]['Handler'], Files[Name]['Data'], null, 'Binary', function(err, Writen){
            Files[Name]['Data'] = ""; //Reset The Buffer
            var Place = Files[Name]['Downloaded'] / 1024000;
            var Percent = (Files[Name]['Downloaded'] / Files[Name]['FileSize']) * 100;
            socket.emit('MoreData', { 'Place' : Place, 'Percent' :  Percent});
        });
    }
    else
    {
        var Place = Files[Name]['Downloaded'] / 1024000;
        console.log(Files[Name]['Downloaded'], Files[Name]['FileSize'])
        var Percent = (Files[Name]['Downloaded'] / Files[Name]['FileSize']) * 100;
        socket.emit('MoreData', { 'Place' : Place, 'Percent' :  Percent});
    }
});

socket.on('Terminate',(data)=>{
    fs.unlink("Temp/" + data['Name'], function () { //This Deletes The Temporary File
        console.log("Temp file deleted from server",data['Name'])
    });
})

    });
   