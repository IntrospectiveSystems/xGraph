# Mouse 

v1.0.0

Introspective Systems, LLC.


---
#### Mouse

The Mouse entity is the Apex and only entity of the Mouse Module.

The main capability of this entity is to add a mouse (&keydown) listener to the canvas that is provided when the SetDomElement command is called. Currently MouseEnter, MouseLeave, Wheel, LeftMouseDown, RightMouseDown, LeftMouseUp, RightMouseUp, and KeyDown events are captured.

---

### Module Definition Parameters

Parameters are defined in the module definition and stored in the Par attribute 
of the Entities this attribute.
The Parameters that Mouse expects to be defined include.

One Par must be set in the module definition. 

`{"Handler" : "xGraphPid"}`  - where xGraphPid shall be replaced by the pid of the View Module that is the destination of Mouse module DispatchEvent commands.

An example of how this looks in the module definition of a config.json
``` json
{
	"Module": "xGraph.Mouse",
	"Par": {
		"Handler": "xGraphPid"
	}
}
```

---

### Output Commands

The Output Commands are all the commands that Mouse can send to
other modules.

The only message sent from the Mouse module is to Par.Handler and is of the form:

`{ Cmd: "DispatchEvent", info: "Object , mouse: "Object }` -- where info is set as the information about the event (ex. LeftMouseDown), and mouse is set to the current state of the mouse (ex. Mode:"idle", inPanel: true). 

---

### Input Commands
The Input Commands are all the commands that Mouse can
receive.

Set the DOM Element that the mouse will listen on.

Example: 

```json
{
	"Cmd": "SetDomElement",
	"DomElement": this.Vlt.div
}
```
