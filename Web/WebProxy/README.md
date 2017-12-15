# WebProxy 

v1.0.0

Introspective Systems, LLC.


---
#### WebProxy

The WebProxy Entity is the Apex and only Entity of the WebProxy Module.

This Module should be deployed browser-side and is used to communicate with Modules on the server.


---

### Module Definition Parameters

Parameters are defined in the module definition and stored in the Par attribute 
of the Entity's _this_ attribute.

One Pars must be set in the module definition, and it is required. 

- `{"Link" : "string"}`  - where string is to be replaced with the name of the module this WebProxy is
proxying. This string must match the key in the ApexList of the WebViewer module.

An example of how this looks in the module definition of a config.json
``` json
{
  "Module": "xGraph.Web.WebProxy",
  "Source": "xGraph",
  "Par": {
    "Link": "Server"
  }
}
```

---

### Output Commands

None


---

### Input Commands
The Input Commands are all the commands that 2DView can
receive.

Set objects in the 2DView stage

Example: 

```json
{
  "Cmd": "DrawObjects",
  "Objects": [
    {
      id: idx,
      geometry: {
        id: "geom",
        name: "Circle",
        arguments: [5, 5, 3]
      },
      fill: {
        id: "fill",
        color: 0xFFFFFF,
        alpha: 1
      },
      tint: 0xFFFFFF * Math.random(),
      position: {
        x: this.Vlt.View.Renderer.width * Math.random(),
        y: this.Vlt.View.Renderer.height * Math.random()
      },
      scale: {
        x: 20 * Math.random(),
        y: 20 * Math.random()
      },
      responseHandler: {
        Cmd: "EvokeExample",
        Handler: this.Par.Pid
      }
    }
  ]
}
```

Get a base64 string of the current canvas

Example:

```json
{
 "Cmd": "ImageCapture"
}
```

Return the canvas of the 2DView module
Example:

```json
{
 "Cmd": "GetCanvas"
}
```

Send an example evoke message

Example:
```json
{
 "Cmd": "EvokeExample",
  "id": "String",
  "mouse": {
   "x": "Integer",
   "y": "Integer"
  }
}
```