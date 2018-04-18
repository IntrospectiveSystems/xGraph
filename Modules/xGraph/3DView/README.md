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

Parameters passed from the module definition to the `Par` attribute of 3DView's `this` 
attribute, `this.Par`, when the module is generated.

##### Parameters
- `"Server" : "xGraphPid"`:  *xGraphPid* being the pid of the module acting as a model server, a 
                                module that 3DView expects to receive commands from. Often, 
                                this will be a WebViewer module, or a Proxy module pointing to 
                                the WebViewer module.
- `"Controller": "xGraphPid"`:  *xGraphPid* being the pid of the module acting as a model 
                                    controller, where 3DView will get models, and send and 
                                    receive commands. 
- `"EvokeView": "xGraphModuleDefinition"`:  For the initial 3DView example, *xGraphModuleDefinition* is 
                                            a module definition of the view that will be generated 
                                            and rendered in a Popup view when the EvokeExample is 
                                            received.

Here is an example of a module definition for 3DView.
```json
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

#### Output Commands

The Output Commands are all the command that 3DView can send to other modules.

If a `"Controller"` included in the parameters, the 3DView will send two commands to the module 
referenced in `this.Par.Controller`:

##### `{"Cmd":"Register", "Pid":"xGraphPid"}` 
The `"Register"` command is sent with one attribute, `"Pid"` referencing this module's Pid, 
during the Start phase to enable the controller module to save the 3DView Pid, so 
that the controller can send commands to this 3DView instance. 

##### `{"Cmd":"SaveImage", "Image":"String", "Name":"String"}`
When 3DView receives an `"ImageCapture"` command, the `"SaveImage"` command is sent with two 
attributes: `"Image"` referencing a data URL with the image encoded in a base64 string and 
Name referencing a string containing the index (starting with 1) of the image saved so 
far from this 3DView instance.

If a `"Server"` is included in the parameters, the 3DView will send one command to the module 
referenced in `this.Par.Server`:

##### `{"Cmd":"Subscribe", "Pid":"xGraphPid", "Link":"String"}` 
The `"Subscribe"` command is sent with two attributes: `"Pid"` referencing this module's Pid, and 
`"Link"` is the name of this module, the string 3DView. `"Subscribe"` is sent in the Start phase 
so that the server is able to send commands to this 3DView instance.

---

#### Input Commands
The Input Commands are all the commands that 3DView can receive.


##### SetObjects(com, fun)

When 3DView receives the SetObject command, 3DView takes the models found in the `"Objects"` key, adds 
them to the scene, and renders the scene. 3DView is capable of rendering three.js primitive models, 
as well as generated models.

###### Parameters
- **com** (*required*): The command object.
- **com.Objects** (*required*): An array of model objects that will be added to the scene and rendered. 
- **fun** (*required*): The callback function.

Here is an example of a `"SetObject"` command with a single three.js object.
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


##### ImageCapture(com, fun)

When 3DView receives the ImageCapture command, it get's an image of the canvas in the form of a 
data url, which encodes the picture in a base64 string. Then 3DView sends out a `"SaveImage"` 
command with two attributes: `"Image"` referencing the data url, and `"Name"` referencing the 
index of the data url as captured by this instance of 3DView, and returns the two attributes 
in the callback function.

###### Parameters
- **com** (*required*): The command object.
- **fun** (*required*): The callback function.

###### Returns
- **com.Image**: A data url as a base64 string.
- **com.Name**: The index number of the data url captured by this instance of 3DView.

So if you send 3DView this command:
```json
{
 "Cmd": "ImageCapture"
}
```

It will send out this command to the controller:
```javascript
 let cmd = {};
 cmd.Cmd = "SaveImage";
 cmd.Image = com.Image;
 cmd.Name = com.Name;
 this.send(cmd, this.Par.Controller);
```


##### Cleanup(com, fun)

When 3DView receives the cleanup command, it removes the render loop, and 
the scene will no longer look for updates.

###### Parameters
- **com** (*required*): The command object.
- **fun** (*required*): The callback function.

You can send 3DView the cleanup command: 
```json
{
 "Cmd": "Cleanup"
}
```

##### EvokeExample(com, fun)

EvokeExample is an example of an Evoke handler. When 3DView receives EvokeExample, 
it generates a popup module containing another 3DView module, or the module 
referenced in `this.Par.EvokeView`.

###### Parameters
- **com** (*required*): The command object.
- **com.id** (*required*): The id of the object with this response handler.
- **com.Mouse** (*require*): An object containing and `"x"` and `"y"` key referencing 
                                the x and y position of the mouse.
- **fun**: The callback function.

Send an example evoke message

You can send 3DView the EvokeExample command:
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


