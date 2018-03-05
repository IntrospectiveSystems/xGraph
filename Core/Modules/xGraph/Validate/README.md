### Validate

v1.0.0

Introspective Systems, LLC.


---
#### Validate

Validate is a module that runs tests on other modules. The tests for a
module are described in a test.json file, which should be included with
each module. Validate generates the module being tested, and then
perform the tests that are laid out it the test.json file.

---

#### How To Use Validate

To test a module using Validate, you need to supply Validate with a list
of tests in the form of a JSON object. These tests should be included in
a test.json file in each module. Next we will look at how to build a
test.json for a module.

The JSON object of the test.json for any module has 2 main sections:
`State` and `Cases`.

State references a json object that defines the parameters, (`this.Par`),
that must be defined to run the module or perform the tests given.

Cases references an array of test cases. Each test case must have the
`"Command"` key defined. This key references the JSON object that is the
message the that will be sent to the module being tested. The module must
accept this command for the test to pass.

The test case can also have a `"SentMessages"` key, a `"Response"` key,
or both.

`"SentMessages"` references an array of messages that should be sent
when the module being tested receives the test command. The command object
in the "SendMessages" array and the command object as sent must match exactly.

`"Response"` references an object that is expected to be returned from
the original command.

Setup and Start test cases (if they exist) must be in order as the first
2 test cases in the `"Cases"` array. If only one of these exist, then it
must come as the first test in the array.

Three special string values are important to know.

- `"xGraphSelfPid"` is the pid of the Module apex being tested.
- `"xGraphTesterPid"` is the pid of Validate (this module, the
                        module performing the test).
- `"*"` is a wildcard available to test for a key without defining the
        value. The wildcard can only be used in the Response object.

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
To Check for array length and values  use

```json
{
	"Response": {
		"Documents": {
			"0": {
				"String": "Beta",
				"Null": null,
				"Number": 6
			},
			"length": 1
		}
	}
}
```


---

#### Module Definition Parameters

Parameters are defined in the module definition and stored in the Par attribute 
of the Entities this attribute.

Validate requires two parameters must be defined in the module definition.

- `{"TestModule":"xGraphModuleAddress"}`: Where xGraphModuleAddress is
                                        the xGraph module that will be tested.
- `{"TestJson":"@file String"}`: Where String is the path of the test.json
                                    containing the tests.

The following is an example of how this looks in the module definition.
Note that the module being tested, defined by the xGraphModuleAddress,
also needs to be included in the array of deferred modules so that
it's code is compiled.

``` json
{
	"Module": "xGraph.Validate",
	"Source": "xGraph",
	"Par": {
		"TestModule": "xGraphModuleAddress",
		"TestJson": "@file: {PathTo}test.json"
	}
}
```

---

### Output Commands
The Output Commands are all of the commands that Validate can send.

*(Validate does not send any commands.)*

---

### Input Commands
The Input Commands are all of the commands that Plexus can receive.

*(Validate does not send any commands.)*
