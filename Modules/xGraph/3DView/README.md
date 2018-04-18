### 3DView

v1.0.0

Introspective Systems, LLC.


---
#### 3DView

The 3DView Module adds and renders a Three.js scene on the div provided by the Viewify 
class (which is referenced in `this.Vlt.div`). Currently only Three.js primitives 
and generative object3D models can be added to the scene and rendered.

---

#### Module Definition Parameters

Parameters passed in the module definition and stored in the `Par` attribute
of 3DView's `this` attribute, `this.Par`.

##### Parameters
- `"Server" : "xGraphPid"`  - *xGraphPid* is the pid of the Server Module.
- `"Controller": "xGraphPid"`  - *xGraphPid* is the pid of the Module acting as 3DView's controller.
- `"EvokeView": "xGraphModuleAddress"` - *xGraphModuleAddress* is the address of the 
                                            view that will be popped up when evoked.

An example of how this looks in the module definition of a config.json
``` json
{
  "3DView": {
    "Module": "xGraph.3DView",
    "Par": {
      "Controller": "$ControllerProxy",
      "Server": "$ServerProxy"
    }
  }
}
```

---

### Output Commands

The Output Commands are all the command that 3DView can send to other modules.

If included in the Par, the 3DView will send two functions to the Par.Controller module:

`{"Cmd":"Register", "Pid":"xGraphPid"}` -- where xGraphPid is replaced with the pid of the module.

`{"Cmd":"SaveImage", "Image":"String", "Name":"String"}` - where the image is a base64 string containing the string of the image to be saved (a png) and the name is a string containing the number of the image saved.

If included in the Par, the 3DView will send one function to the Par.Server module:

`{"Cmd":"Subscribe", "Pid":"xGraphPid", "Link":"String"}` -- where xGraphPid is replaced with the pid of the module, and the Link is a string that matches the Key of the destination module located in the ApexList of the Server Module.

---

### Input Commands
The Input Commands are all the commands that 3DView can receive.

Set objects in the 3DView stage

Example:

```json
{
  "Cmd": "SetObjects",
  "Objects": [
    {
      id: idx,
      geometry: {
        id: "geom",
        name: "SphereGeometry",
        arguments: [1, 64, 64]
      },
      mesh: {
        id: "mesh",
        name: "MeshPhongMaterial",
        arguments: {
          color: 0xFFFFFF * Math.random()
        }
      },
      position: {
        x: 100 * Math.random(),
        y: 100 * Math.random(),
        z: 100 * Math.random()
      },
      scale: {
        x: 10 * Math.random(),
        y: 10 * Math.random(),
        z: 10 * Math.random()
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

Remove all renderloops from the environment

Example:

```json
{
 "Cmd": "Cleanup",
  "Name": "moduleName",
  "Pid": "xGraphPid"
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
