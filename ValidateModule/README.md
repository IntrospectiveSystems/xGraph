# TestModule
Loads tests from json and sends commands to a specified module. Returns true for each test that matches expected results.
Use by providing a Json file of commands (Add path to TestModule config as Par.TestCases).

for an example look at xGraph/Web/Router/test.json

test.json Format:

{
	"State": {
		"Par": "value.... Required pars (key:value pairs) that allow the module to do it's job
	},
	"Cases": [
			{
				"Command": <Object> Command object to send,
				"SentMessages":[
				{
					"Command": <Object> command to be caught by test.
				}
			]
			"Callback": <Object> Expected return command (Omit if no callback expected)
		}
	]
}
