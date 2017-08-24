# TestModule
Loads tests from json and sends commands to a specified module. Returns true for each test that matches expected results.
Use by providing a Json file of commands (Add path to TestModule config as Par.TestCases).

TestCases.json Format:

    [
        {
            Dest: <String> Module to send test to
            Command: <Object> Command object to send
            Callback: <Object> Expected return command (Omit if no callback expected)
        }, ...       
    ]

