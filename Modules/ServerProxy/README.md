# ServerProxy 

v1.0.0

Introspective Systems, LLC.


---
#### ServerProxy

The ServerProxy Entity is the Apex and only Entity of the ServerProxy Module.

This Module should be deployed server-side and is used to communicate with Modules on the browser.


---

### Module Definition Parameters

Parameters are defined in the module definition and stored in the Par attribute 
of the Entity's _this_ attribute.

Two Pars must be set in the module definition, and they are both required. 

- `{"Link" : "string"}`  - where string is to be replaced with the name of the module this ServerProxy is
proxying. This string must match the subscription key that the browser module subscribed with.

- `{"Server" : "xGraphModuleReference"}`  - where xGraphModuleReference is to be replaced with the $ reference
of the Server module.

An example of how this looks in the module definition of a config.json

``` json
{
  "Module":"xGraph.Web.ServerProxy",
  "Source":"xGraph",
  "Par":{
    "Link": "3DView",
    "Server":"$Server"
  }
}
```

---

### Output Commands

None


---

### Input Commands

Any - All messages are simply redirected