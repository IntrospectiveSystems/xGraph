# WebViewer 

v1.0.0

Introspective Systems, LLC.

---
## WebViewer.js
The WebViewer entity is the Apex and only entity of the WebViewer Module.
This entity requires its Setup and Start functions to be invoked durring the same stage of Nexus startup.
The main functionality of this entity is to start up an http server and on connection a webserver for 
interfacing a browers based xGraph System to one that is server based. Communication between these two 
Systems is done by the ServerProxy Module on the server and the WebProxy on the browser. Both of these 
Modules interface with the WebViewer programatically.


## How To Use
The Module definition to use this module is:
"Server": {
	"Module": "{...pathToModule}.WebViewer",
	"Source": "{..sourceReference}",
	"Par": {
		"ApexList": {},
		"Port": 8080,
		"Url": "Paint",
		"HTML": "@file: Paint.html",
		"Paint": "@system: browser.json"
	}
}.
The ApexList is the set of key value pairs of Server Side modules that Browser side modules can communicate 
with. This Par is optional if no Browser Module to Server Module communcations are necessary. Optional.
The Port is the TCP Port that the Server will listen on. This defaults to 8080. Optional.
The Url is the reference for the HTML file. (Limits the get requests to the one defined in Par.Url). Required.
The HTML par references the HTML file to serve up. Required. 
Paint is the name of the Configuration file that's served up make sure this matches your Par.Url. Required.


## License

....
