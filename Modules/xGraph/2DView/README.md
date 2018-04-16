### 2DView

v1.0.0

Introspective Systems, LLC.


---
#### 2DView

2DView adds and renders a Pixi.js stage on the `div` provided by the
Viewify class. Currently, only Pixi primitives can be added to the
scene/rendered.

---

#### Module Definition Parameters

Module Definition Parameters are specified in the module definition and
stored in the `Par` key of the Entity's `this` context, `this.Par`.

Seven Parameters can be specified in the module definition, but they are all optional.

- `{"Server" : "xGraphPid"}`: where xGraphPid is the pid of the Server Module.
- `{"Controller": "xGraphPid"}`: where xGraphPid is the pid of the Module
                                    acting as 2DViews controller.
- `{"EvokeView": "xGraphModuleAddress"}`: where xGraphModuleAddress is
                                            the address of the view that
                                            will be popped up when evoked.
- `{"Source": "xGraphPid"}`: where xGraphPid is a reference to a source
                                of data.
- `{"DataChannels": [{"Channel": "string","Flow": "Push || other","Handler": "functionString"}]}`:
                            where `"Channel"` is the channels name, `"Flow"`
                            is the data flow, when Flow is set to Push `"Handler"` is a reference
                            to the the name of the command that the updated
                            data should be sent to.
- `{"Hidden": "boolean"}`: where boolean either true or false
- `{"BackgroundColor": "string"}`: where string is a hex color string (i.e. `"0xababab"`).

An example of how this looks in the module definition of a config.json
``` json
{
  "2DView": {
    "Module": "xGraph.2DView",
    "Par": {
      "Controller": "$ControllerProxy",
      "Server": "$ServerProxy",
      "EvokeView":"xGraph.3DView"
    }
  }
}
```

---

#### Output Commands

The Output Commands are all the command that 2DView can send to
other modules.

If a `"Controller"` is included in the module definition, the 2DView will
send two functions to its Controller module, referenced at `Par.Controller`:

- `{"Cmd":"Register", "Pid":"xGraphPid"}`: where xGraphPid is the pid of 2DView.

- `{"Cmd":"SaveImage", "Image":"String", "Name":"String"}`: where the
            `"Image"` is a base64 string containing the string of the image
            to be saved (a png) and the name is a string containing the
            number of the image saved.

If `"Server"` is included in the module definition, the 2DView will send
one function to the its Server module, referenced at `Par.Server` module:

`{"Cmd":"Subscribe", "Pid":"xGraphPid", "Link":"String"}`: where xGraphPid
        is the pid of the module, and string is a string that matches the
        Key of the module that is the destionation of the command, which is
        located in the ApexList of the Server Module.

If included in the Par, the 2DView will send one function to the Par.Source module:

`{"Cmd":"GetData", "Pid":"xGraphPid", "DataChannels":[{"Channel": "string","Flow": "Push || other","Handler": "functionString"}]}`:
        where xGraphPid is the pid of the module, string is the name of
        the channel, the data flow is specified by "Flow", and functionString
        references the name of the command that the updated data is sent
        to when Flow is set to Push.

---

#### Input Commands
The Input Commands are all the commands that 2DView can receive.

##### DrawObjects
The DrawObjects command sets objects in the 2DView stage.

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


##### ImageCapture
The ImageCapture command gets a base64 string of the current canvas.

Example:

```json
{
 "Cmd": "ImageCapture"
}
```

##### GetCanvas
The GetCanvas command returns the canvas of the 2DView module.

Example:

```json
{
 "Cmd": "GetCanvas"
}
```


##### "EvokeExample"
The EvokeExample command sends an example evoke message.

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
