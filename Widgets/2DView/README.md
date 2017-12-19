# 2DView 

v1.0.0

Introspective Systems, LLC.


---
#### 2DView

The 2DView entity is the Apex and only entity of the 2DView Module. This entity requres its Setup function to be invoked during the Setup phase of Nexus startup as well as its Start function to beinvoked during the Start phase of Nexus startup.

The main capability of this entity is to add and render a Pixi.js stage on the div provided by the Viewify class (the pixi.js stage is stored in this.Vlt.div). Currently only Pixi primitives can be added to the scene/rendered.

---

### Module Definition Parameters

Parameters are defined in the module definition and stored in the Par attribute 
of the Entity's _this_ attribute.

Seven Pars can be set in the module definition, but they are all optional. 

- `{"Server" : "xGraphPid"}`  - where xGraphPid should be replaced by the pid of the Server Module.
- `{"Controller": "xGraphPid"}`  - where xGraphPid should be replaced by the pid of the Module acting as this Modules controller. 
- `{"EvokeView": "xGraphModuleAddress"}`  - where xGraphModuleAddress should be replaced by the address of the view that should be popped up when evoked. 
- `{"Source": "xGraphPid"}` - where xGraphPid is replaced with a reference to a source of data
- `{"DataChannels": [{"Channel": "string","Flow": "Push || other","Handler": "functionString"}]}` - where string is the name of the channel, the data flow is specified by "Flow", functionString should reference the name of the Cmd that the updated data should be sent to when Flow is set to Push.
- `{"Hidden": "boolean"}` - where boolean is set to true or false
- `{"BackgroundColor": "string"}` - where string is set to a hex color string ex. '0xababab"

An example of how this looks in the module definition of a config.json
``` json
{
  "2DView": {
    "Module": "xGraph:Widgets/2DView",
    "Source": "xGraph",
    "Par": {
      "Controller": "$ControllerProxy",
      "Server": "$ServerProxy",
      "EvokeView":"xGraph.Widget.3DView"
    }
  }
}
```

---

### Output Commands

The Output Commands are all the command that 2DView can send to
other modules.

If included in the Par, the 2DView will send two functions to the Par.Controller module:

`{"Cmd":"Register", "Pid":"xGraphPid"}` -- where xGraphPid is replaced with the pid of the module.

`{"Cmd":"SaveImage", "Image":"String", "Name":"String"}` - where the image is a base64 string containing the string of the image to be saved (a png) and the name is a string containing the number of the image saved.

If included in the Par, the 2DView will send one function to the Par.Server module:

`{"Cmd":"Subscribe", "Pid":"xGraphPid", "Link":"String"}` -- where xGraphPid is replaced with the pid of the module, and the Link is a string that matches the Key of the destination module located in the ApexList of the Server Module.

If included in the Par, the 2DView will send one function to the Par.Source module:

`{"Cmd":"GetData", "Pid":"xGraphPid", "DataChannels":[{"Channel": "string","Flow": "Push || other","Handler": "functionString"}]}` -- where xGraphPid is replaced with the pid of the module,  and where string is the name of the channel, the data flow is specified by "Flow", functionString should reference the name of the Cmd that the updated data should be sent to when Flow is set to Push..

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