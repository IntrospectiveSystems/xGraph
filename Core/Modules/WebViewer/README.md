# WebViewer 

v1.0.0

Introspective Systems, LLC.

---
## WebViewer.js

The WebViewer entity is the Apex and only entity of the WebViewer Module.
This entity requires its Setup and Start functions to be invoked during the same stage of Nexus startup.

The main functionality of this entity is to start up an http server and, on connection, a webserver for 
interfacing a brower-side xGraph System to one another xGraph System. Communication between these two 
Systems is done by the ServerProxy Module (server side) and the WebProxy on the browser. Both of these 
Modules interface with WebViewer programatically.


## How To Use

The Module definition to use this module is:

``` json
"Server": {
	"Module": "{...pathToModule}.WebViewer",
	"Source": "{..sourceReference}",
	"Par": {
		"ApexList": {},
		"Port": 8080,
		"Url": "{path component}",
		"HTML": "@file: index.html",
		"{path component}": "@system: browser.json"
	}
}
```

- **Required:** The Url is the reference for the HTML file. (Limits the get requests to the one defined in Par.Url). 
- **Required:** The HTML par references the HTML file to serve up.  
- **Required:** {path component} is the name of the Configuration file is used. Make sure this matches your Par.Url. 
-  _Optional:_ The ApexList is the set of key value pairs of Server Side modules that Browser side modules can communicate with. This Par is optional if no Browser Module to Server Module communications are necessary.
- _Optional:_ The Port is the TCP Port that the Server will listen on. This defaults to 8080. 
