# WebViewer 

v1.1.1

Introspective Systems, LLC.

---

WebViewer starts up an http server and, on connection, a web server for
interfacing a browser-side xGraph System to another xGraph System.
Communication between these two systems is done by the ServerProxy module
(server side) and the WebProxy on the browser. Both of these modules
interface with WebViewer programmatically.

This entity requires its Setup and Start functions to be invoked when
initialized.

---

### How To Use

The Module definition to use this module is:

``` json
"Server": {
	"Module": "xGraph.WebViewer",
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

- **Required:** The Url is the reference for the HTML file.
                (Limits the get requests to the one defined in Par.Url).
- **Required:** The HTML par references the HTML file to serve up.
- **Required:** {path component} is the name of the configuration file
                used. Make sure this matches your Par.Url.
-  _Optional:_ The ApexList is the set of key value pairs of server Side
                modules that browser side modules can communicate with.
                This Par is optional if no browser module to server
                module communications are necessary.
- _Optional:_ The Port is the TCP Port that the Server will listen on.
                This defaults to 8080.

---

### Module Interface

#### Module Definition Parameters

The following module definition parameters can be sent to WebViewer on
instantiation. WebViewer accepts five module definition parameters, but
some of these are optional.

- **Par.Url** (*require*): The reference for the HTML file.
- **Par.HTML** (*required*): The HTML par references the HTML file to
                                serve up.
- **Par.[Url]** (*required*): With value of Par.Url as a key, this
                            parameter the name of the Configuration file
                            used. Make sure this matches your Par.Url.
- **Par.ApexList** : The set of key value pairs of Server Side modules
                     that Browser side modules can communicate with.
                     This Par is optional if no Browser Module to Server
                     Module communications are necessary.
- **Par.Port** : The TCP Port that the Server will listen on. Defaults
                    to 8080.

#### Output Commands
*(WebViewer does not send any commands.)*


#### Input Commands
WebViewer is capable of handling any incoming command. The commands that
WebViewer receives will be forwarded to the module identified in com.Forward.
For more details see the entry for Broadcast below.

##### Broadcast(com, fun)
Broadcasts to all appropriately subscribed browser side modules. Only
one message is sent per socket (browser xGraph instance) per Broadcast.

###### Parameters
- **com** (*required*): The command object.
- **com.Follow** (*required*): the string which identifies to which
                                modules to broadcast to this is stored
                                as the key of `Vlt.Sockets[idx].User.Publish`
- **fun** (*required*): The callback function.

###### Returns
*None*

