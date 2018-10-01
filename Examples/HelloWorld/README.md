### HelloWorld System

---
#### Hello!

This is the HelloWorld system. When run, this system will wait for user
input through the console, echo what the user says and increment a
counter.

For detailed information on xGraph systems, see our [Systems Guide](https://github.com/IntrospectiveSystems/xGraph/wiki/1.2-Systems-Guide).

This system consists of one module, the HelloWorld module. The HelloWorld
module handles the systems functionality. HelloWorld is built to print
a welcome message to the user, wait for user input, repeat what the user
said, and increment a counter.

Before you try to run the HelloWorld system, make sure you have installed
the xgraph command line tool, found in the [bin](../bin) folder,
`.\bin\`.

To run this example using the xgraph CLI, first navigate to the HelloWorld
folder in the Examples directory, `./Examples/HelloWorld/`.  Now you can
this system using the following command

    xgraph x --config ./config.json --xGraph mb://modulebroker.xgraphdev.com

Next you will see several messages as different parts of xGraph are setup
and started.  Eventually you will be greeted with a prompt:

    Welcome to xGraph!

    HelloWorld is Listening... Type Something!

Now, if you type a response, xGraph's HelloWorld module will echo your
message back to you and increment a value

    > Hello!
    [INFO] --xGraph Repeats: [Hello!]
    [VRBS] Spinning up entity xGraph.HelloWorld-HelloWorld2
    [INFO] --HelloWorld2/otherFunction:  
    [INFO] ----Recieved callback from Other, someValue is now:  2 


---
