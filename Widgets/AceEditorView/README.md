# AceEditorview 

v1.0.0

Introspective Systems, LLC.


---
#### AceEditorView

The AceEditorView entity is the Apex and only entity of the AceEditorView Module. This entity requres its Setup function invoked during the Setup phase of Nexus startup.

The main capability of this entity is to add and render an Ace Editor Session to the div of the Module. 

---

### Module Definition Parameters

Parameters are defined in the module definition and stored in the Par attribute 
of the Entities this attribute.
Some are required, while some are optional. Below are the Parameters
that AceEditorView expects to be defined.

Two Pars can be set in the module definition, but they are all optional. 

- `"Controller": "xGraphPid"`  - where xGraphPid should be replaced by the pid of the Module acting as this Modules controller. 
- `"EvokeView": "xGraphModuleAddress"`  - where xGraphModuleAddress should be replaced by the address of the view that should be popped up when evoked. 

An example of how this looks in the module definition of a config.json
``` json
{
  "AceEditorView": {
    "Module": "xGraph:Widgets/AceEditorView",
    "Source": "xGraph",
    "Par": {
      "Controller": "$ControllerProxy",
      "AutoSave": true
    }
  }
}
```

---

### Output Commands

The Output Commands are all the commands that AceEditorView can send to other modules.

If included in the Par, the AceEditorView will send two functions to the Par.Controller module:

`{"Cmd":"Save", "Data":"String"}` - where Data is the string of the text.

---

### Input Commands
The Input Commands are all the commands that AceEditorView can receive.

Utilizing the [Ace API](https://ace.c9.io/#about=&nav=api)

Examples: 

Returns the string of text currently highlighted.
```json
{
  "Cmd":"getCopyText"
}
```

Sets the current document text to `value` at `cursorPos`
```json
{ 
  "Cmd": "setValue", 
  "Arguments": ["value", cursorPos] }
```

