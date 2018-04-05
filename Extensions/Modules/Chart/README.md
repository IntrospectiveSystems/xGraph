# Chart

v1.0.0

Introspective Systems, LLC.


---
#### Chart

The Chart entity is the Apex and only entity of the Chart Module. This entity requires the Setup function invoked during the Setup phase of Nexus startup. As well as its Start function invoked during the Start phase of Nexus startup.

The main capability of this entity is to add and render a Chart.js chart to the div provided by the Viewify class (which is stored stored in `this.Vlt.div`). 

---

### Module Definition Parameters

Parameters are defined in the module definition and stored in the `Par` attribute
of Chart's `this` attribute, `this.Par`.

These parameters can be set in the module definition.
- "Server" : "xGraphPid"  - where xGraphPid should be replaced by the pid of the WebProxy pointing to the server side WebViewer Module.
- "Root" : "boolean" - is this the root of the view in the browser. This describes where the view
will be appended to in the DOM. 

An example of how this looks in the module definition of a browser.json
``` json
"Chart": {
  "Module": "xGraphDev.Extensions.Modules.Chart",
  "Source": "local",
  "Par": {
    "Root": true,
    "Server": "$Server"
  }
}
```

---

### Output Commands

The Output Commands are all the command that Chart can send to other modules.

The Chart will send one function to the Par.Server module:

`{"Cmd":"Subscribe", "Pid":"xGraphPid", "Link":"String"}` -- where xGraphPid is replaced with the pid of the module, and the Link is a string that matches the Key of the destination module located in the ApexList of the Server Module.

---

### Input Commands
The Input Commands are all the commands that Chart can receive.

Set data in the Chart.

Example:

```json
{
  "Cmd": "AddData",
  "Objects": [
    {
      "Channel":"SourceOne",
      "Data": [2,3,4,5]
    }
  ]
}
```


