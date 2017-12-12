# Validate 

v1.0.0

Introspective Systems, LLC.


---
#### Validate

The Validate entity is the Apex and only entity of the Validate Module. This entity requres its Start function invoked during the Start phase of Nexus startup.

The main capability of this entity is to GenModule the module being tested and then perform the tests laid out it the test.json file. 

---

### Module Definition Parameters

Parameters are defined in the module definition and stored in the Par attribute 
of the Entities this attribute.

Two Pars must be set in the module definition, they are both required. 

`{"TestModule":"xGraphModuleAddress"}` - where xGraphModuleAddress defines the address of the module to be loaded.

`{"TestJson":"@file String"}` - where String is set to the path of the test.json for this module

An example of how this looks in the module definition of a config.json. Note that the Test Module defined by the xGraphModuleAddress also needs to be in the array of deferred modules so that it's code is loaded during compile. 

``` json
{
	"Module": "xGraph.ValidateModule",
	"Source": "xGraph",
	"Par": {
		"TestModule": "xGraphModuleAddress",
		"TestJson": "@file: {PathTo}test.json"
	}
}
```

---

### Output Commands

None

---

### Input Commands

None

---

### How To

The format of the test.json for any module has 2 main components: the State and the Cases.

State is a json object that defines the pars that must be defined to perform the tests as defined in Cases.

Cases is an array of test cases. Each test case must have the "Command" key defined. This key references the Json object that is the message the module being tested will accept. The test case can also have a "SentMessages" key, a "Response" key, or both. The "SentMessages" key references an array of messages that are expected to be sent from the module being tested. The "Response' key references the expected results from the returned command as was delivered in the callback of the original "Command".

Three specific string values are important to know.

"xGraphSelfPid" is the pid of the Module apex being tested.
"xGraphTesterPid" is the pid of the Validate Module (the module performing the test). 
"*" is available to test for a value but not defining what it is exactly. 

Example:
```json
{
	"State": {
		"Server":"xGraphTesterPid",
		"Table":{
			"Test":"xGraphTesterPid"
		}	
	},
    "Cases": [
		{
			"Command": {
				"Cmd":"Start"
			},
			"SentMessages":[
				{
					"Cmd":"Subscribe", 
					"Pid":"xGraphSelfPid"
				}
			]
		},
		{
			"Command": {
				"Cmd":"Subscribe", 
				"Name":"TestDestination",
				"Pid": "xGraphTesterPid"
			}
		},
		{
			"Command": {
				"Cmd":"Test", 
				"Destination":"TestDestination",
				"Pid": "xGraphTesterPid"
			},
			"Response": {
				"Cmd": "Test",
				"Pid": "*"				
			}
		}
    ]
}
```

