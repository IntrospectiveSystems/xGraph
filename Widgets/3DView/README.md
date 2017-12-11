# 3Dview 

v1.0.0

Introspective Systems, LLC.


---
#### 3DView

The 3DView entity is the Apex and only entity of the 3DView Module. This entity requres its Setup function invoked during the Setup phase of Nexus startup. As well as its Start function invoked during the Start phase of Nexus startup.

The main capability of this entity is to add and render a Three.js scene on the div provided by the Viewify class (its stored in this.Vlt.div). Currently only Three.js primitives and generative object3D models can be added to the scene/reneered.

---

### API Documentation

The next section is the API documentation for this module.

---

### Module Definition Parameters

Parameters are defined in the module definition and stored in the Par attribute 
of the Entities this attribute.
Some are required, while some are optional. Below, the Parameters
that 3DView expects to be defined.

Three Pars can be set in the module definition, but they are all optional. 
"Server" : "xGraphPid"  - where xGraphPid should be replaced by the pid of the Server Module.
"Controller": "xGraphPid"  - where xGraphPid should be replaced by the pid of the Module acting as this Modules controller. 
"EvokeView": "xGraphModuleAddress"  - where xGraphModuleAddress should be replaced by the address of the view that should be popped up when evoked. 

An example of how this looks in the module definition of a config.json
"3DView": {
 "Module": "xGraph:Widgets/3DView",
 "Source": "xGraph",
 "Par": {
  "Controller": "$ControllerProxy",
  "Server": "$ServerProxy"
 }
}


---

### Output Commands

The Output Commands are all the command that 3DView can send to
other modules.

If included in the Par, the 3DView will send 2 functions to the Par.Controller module:
{"Cmd":"Register", "Pid":"xGraphPid"} -- where xGraphPid is replaced with the pid of the module
{"Cmd":"SaveImage", "Image":"String", "Name":"String"} - where the image is a base64 string containing the string of the image to be saved (a png) and the name is a string containing the number of the image saved.

If included in the Par, the 3DView will send 1 function to the Par.Server module:
{"Cmd":"Subscribe", "Pid":"xGraphPid", "Link":"String"} -- where xGraphPid is replaced with the pid of the module, and the Link is a string that matches the Key of the destination module located in the ApexList of the Server Module.

---

### Input Commands
The Input Commands are all the commands that 3DView can
receive.

Set objects in the 3DView stage

Example: 
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


Get a base64 string of the current canvas

Example:
{
 "Cmd": "ImageCapture"
}


Remove all renderloops from the environment

Example:
{
 "Cmd": "Cleanup",
  "Name": "moduleName",
  "Pid": "xGraphPid"
}

Send an example evoke message

Example:
{
 "Cmd": "EvokeExample",
  "id": "String",
  "mouse": {
   "x": "Integer",
   "y": "Integer"
  }
}