/* Do some fun stuff with Javascript via UDP
   Eventually we will implement the SecretAPI here.  Eventually. */

// Constructor method for the holiday using SecretAPI
// Requires a string 'address' (i.e. IP address 192.168.0.20) or resolvable name (i.e. 'light.local')
//
function Holiday(address) {
  this.address = address;
  console.log("Address set to ", this.address)
  
  this.NUM_GLOBES = 50;
  this.FRAME_SIZE = 160;      // Secret API rame size
  this.FRAME_IGNORE = 10;     // Ignore the first 10 bytes of frame
  socketId = null;         // No socket number just yet

  this.closeSocket = closeSocket;
  this.setglobe = setglobe;
  this.getglobe = getglobe;
  this.render = render;

  var globes = new Uint8Array(160);
  this.globes = globes;
  console.log('Array created');

  // Fill the header of the array with zeroes
  for (i=0; i < this.FRAME_IGNORE; i++) {
    this.globes[i] = 0x00;
  }

  // Create the socket we'll use to communicate with the Holiday
  chrome.socket.create('udp', {},
   function(socketInfo) {           // Callback when creation is complete
      // The socket is created, now we want to connect to the service
      socketId = socketInfo.socketId;
      console.log('socket created ', socketInfo.socketId);
    }
  );
 
  function closeSocket() {
    chrome.socket.destroy(socketId);
    console.log("Socket destroyed");
  }

  function setglobe(globenum, r, g, b) {
    // Sets a globe's color
    if ((globenum < 0) || (globenum >= this.NUM_GLOBES)) {
      return;
    }

    baseptr = this.FRAME_IGNORE + 3*globenum;
    globes[baseptr] = r;
    globes[baseptr+1] = g;
    globes[baseptr+2] = b; 

    return;
  }

  function getglobe() {
    // Sets a globe's color
    if ((globenum < 0) || (globenum >= this.NUM_GLOBES)) {
      return;
    }

    baseptr = this.FRAME_IGNORE + 3*globenum;
    r = globes[baseptr];
    g = globes[baseptr+1];
    b = globes[baseptr+2];
    return [r,g,b];
  }

  function render() {
    //console.log("Holiday.render");
    //var locaddr = this.address;
    var glbs = this.globes;
    var sid = socketId;
    if (sid == null) {
      console.log("No socket abort render");
      return;
    }

    // Connect via the socket
    chrome.socket.connect(socketId, this.address, 9988, function(result) {

       // We are now connected to the socket so send it some data
      chrome.socket.write(socketId, glbs.buffer,
       function(sendInfo) {
         //console.log("wrote " + sendInfo.bytesWritten);
         x = 1;
      });
    });
    return;
  }
}

var krazyglobe = 0;
var krazycolor = 0;
var  timer = null;
var hol = null;

function krazystep() {
  //console.log('krazystep');

  // Like all the best things in life, a state machine.
  // Light the next globe in sequence unless at the end
  // In which case change color and start again.

  // Unset the current krazyglobe
  hol.setglobe(krazyglobe, 0, 0, 0);

  // increment the krazyglobe
  // If end of string, increment krazycolor
  if (++krazyglobe == hol.NUM_GLOBES) {
    krazyglobe = 0;
    krazycolor++;
  }

  switch (krazycolor) {
    case 4:
      krazycolor = 0;
    case 0:
      hol.setglobe(krazyglobe, 0xff, 0x00, 0x00);       // RED
      break;
    case 1:
      hol.setglobe(krazyglobe, 0x00, 0xff, 0x00);       // GREEN
      break;   
    case 2:
      hol.setglobe(krazyglobe, 0x00, 0x00, 0xff);       // GREEN
      break;   
    case 3:
      hol.setglobe(krazyglobe, 0xff, 0xff, 0xff);       // GREEN
      break;   
  }
  hol.render();
}

function doRefresh() {
  $("#thebutton").val('Scanning...');
  refresher();
}

// Start Demo 
function krazyStart() {
  
  console.log("krazyStart");
  hol = new Holiday($('#selector').val())
  $('#krazy').val('Stop Krazy');
  timer = setInterval(krazystep, 65); // run every 65 msec
  return;

}
  
// Stop Demo 
function krazyStop() {
  
  //
  // Insert IoTAS Code
  //
  console.log("krazyStop");
  clearInterval(timer);
  timer = null;
  hol.closeSocket();
  hol = null;
  $('#krazy').val('Go Krazy!');
  return;
  
}

var krazyState = false;

function doKrazy() {
  if (krazyState == false) {
    krazyState = true;
    krazyStart();
  } else {
    krazyState = false;
    krazyStop();
  }
}

// Lordy, this is one of the reasons I hate Javascript
// And it's not Javascript's fault.  It's the DOM.
$( document ).ready( function() {
  console.log("Doing the ready");
  // And here's the stuff we do.
  $("#thebutton").click(function () {
    doRefresh();
  });
  $("#krazy").click(function () {
    doKrazy();
  });
});
