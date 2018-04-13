# ChooseEpsilonGreedy

v1.0.0

Introspective Systems, LLC.


---
#### ChooseEpsilonGreedy

The ChooseEpsilonGreedy entity is the Apex and only entity of the ChooseEpsilonGreedy Module. This entity requires the Setup function invoked during the Setup phase of Nexus startup. As well as its Start function invoked during the Start phase of Nexus startup.

The main capability of this entity is to provide a ChooseEpsilonGreedy.js optimizatyion technique to some environment provided by the `Par.Environment` module. 

---

### Module Definition Parameters

Parameters are defined in the module definition and stored in the `Par` attribute
of ChooseEpsilonGreedy's `this` attribute, `this.Par`.

These parameters can be set in the module definition.
- "InitialEstimate" : "number"  - for choosing an optimal value this par sets all to be equal to the given number. (enables more robust exploration)
- "Environment" : "xGraphPid" - the pid of the environment being optimized on.
- "Chart" : "xGraphPid" - the pid of the module that will display or store visualization data.
- "BackendServer" : "xGraphPid" - the pid of the module that stores learned weights. 
- "Epsilon" : "number" - the rate at which exploration happens. (0.2 -> we explore randomly 20% of the time)
- "Stepms" : "number" - the time between actions to enable better realtime visualizations


An example of how this looks in the module definition of a browser.json
``` json
"AI": {
  "Module": "xGraph.ChooseEpsilonGreedy",
  "Source": "local",
  "Par": {
    "InitialEstimates": 5,
    "Environment": "$Environment",
    "Chart": "$Chart",
    "BackendServer": "$Backend",
    "Epsilon": 0.05,
    "Stepms": 20
  }
}
```

---

### Output Commands

The Output Commands are all the commands that ChooseEpsilonGreedy can send to other modules.

The ChooseEpsilonGreedy will send two functions to the Par.BackendServer module:

`{
  "par": "BackendServer",
  "Command": [
    {
      "Cmd": "GetData",
      "required": {
        "Key": "string"
      }
    },
    {
      "Cmd": "SetData",
      "required": {
        "Key": "string",
        "Data": "object"
      }
    }
  ]
},` -- for setting and retrieving data from the data storage module.

The ChooseEpsilonGreedy will send three functions to the Par.Environment module:

{
  "par": "Environment",
  "Command": [
    {
      "Cmd": "Initialize",
      "required": {
        "ID": "string"
      }
    },
    {
      "Cmd": "Play",
      "required": {
        "ID": "string",
        "Index": "number"
      }
    },
    {
      "Cmd": "GetTrueState",
      "required": {
      }
    }
  ]
}  -- for enabling interaction with the environment module.

The ChooseEpsilonGreedy will send three functions to the Par.Chart module:

{
  "par": "Chart",
  "Command": [
    {
      "Cmd": "AddData",
      "required": {
        "Channel": "string",
        "Data": "object"
      }
    }
  ]
}-- for realtime update of the chart module.

---

### Input Commands
The Input Commands are no input commands that ChooseEpsilonGreedy can receive.



