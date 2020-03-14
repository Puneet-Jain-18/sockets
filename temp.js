window.addEventListener("load", Ready); 
	
	function Ready(){ 
		if(window.File && window.FileReader){ //These are the relevant HTML5 objects that we are going to use 
			document.getElementById('UploadButton').addEventListener('click', StartUpload);  
			document.getElementById('FileBox').addEventListener('change', FileChosen);
		}
		else
		{
			document.getElementById('UploadArea').innerHTML = "Your Browser Doesn't Support The File API Please Update Your Browser";
		}
	}
	
	var SelectedFile;
	function FileChosen(evnt) {
		SelectedFile = evnt.target.files[0];
		document.getElementById('NameBox').value = SelectedFile.name;
	}
	var socket = io.connect('http://localhost:8080');
	var FReader;
	var Name;
	function StartUpload(){
		//console.log("StartUpload called",document.getElementById('FileBox').value)
		if(document.getElementById('FileBox').value != "")
		{
			FReader = new FileReader();
			Name = document.getElementById('NameBox').value;
			var Content = '<div id="ProgressContainer"><div id="ProgressBar"></div></div><span id="percent">0%</span>';
			Content += "<span id='Uploaded'> - <span id='MB'>0</span>/" + Math.round(SelectedFile.size / 1048576) + "MB</span>";
			
			document.getElementById('UploadArea2').innerHTML = Content;
			console.log(Content);
			FReader.onload = function(evnt){
				socket.emit('Upload', { 'Name' : Name, Data : evnt.target.result });
			}
			
			socket.emit('Start', { 'Name' : Name, 'Size' : SelectedFile.size });
		}
		else
		{
			alert("Please Select A File");
		}
	}
	document.getElementById('restartButton').addEventListener('click',()=>{
		socket.disconnect();
		socket.connect();
	} );
	document.getElementById('terminateButton').addEventListener('click',()=>{
		socket.emit('Terminate',{'Name' : Name})
		document.getElementById('UploadArea2').innerHTML = "File Transfer Terminated Successfully.";
	} );
	
	document.getElementById('resumeButton').addEventListener('click',StartUpload );
	
	socket.on('MoreData', function (data){
		console.log("REached More Dataaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
		UpdateBar(data['Percent']);
		var Place = data['Place'] * 1024000; //The Next Blocks Starting Position
		var NewFile; //The Variable that will hold the new Block of Data
		if(SelectedFile.webkitSlice) 
			NewFile = SelectedFile.slice(Place, Place + Math.min(1024000, (SelectedFile.size-Place)));
		else
			NewFile = SelectedFile.slice(Place, Place + Math.min(1024000, (SelectedFile.size-Place)));
		FReader.readAsBinaryString(NewFile);
		console.log(data['Percent']);
	});
	
	function UpdateBar(percent){
		document.getElementById('ProgressBar').style.width = percent + '%';
		document.getElementById('percent').innerHTML = (Math.round(percent*100)/100) + '%';
		var MBDone = Math.round(((percent/100.0) * SelectedFile.size) / 1048576);
		document.getElementById('MB').innerHTML = MBDone;
	}
	
	
	var Path = "http://localhost/";
	
	socket.on('Done', function (data){
		UpdateBar(data['Percent']);
		var Content = "File Successfully Uploaded !!"
		document.getElementById('UploadArea').innerHTML = Content;
		document.getElementById('Restart').addEventListener('click', Refresh);
	});
	function Refresh(){
		location.reload(true);
	}