# WebProxy

v1.1.0

Introspective Systems, LLC.


---
#### WebProxy

The WebProxy Entity is the Apex and only Entity of the WebProxy Module.

This Module should be deployed browser-side and is used to communicate with Modules on a system running in a server side arrangement.


---

### Module Definition Parameters

Parameters are defined in the module definition and stored in the Par attribute
of the Entity's _this_ attribute.

One Par must be set in the module definition, and it is required.

- `{"Link" : "string"}`  - where string is to be replaced with the name of the module this WebProxy is
proxying. This string must match the key in the ApexList of the WebViewer module.

An example of how this looks in the module definition of a config.json

``` json
{
  "Module": "xGraph.WebProxy",
  "Source": "local",
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

Any - All messages are simply redirected
