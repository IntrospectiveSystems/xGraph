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

To run this example in your command line make sure you are in the HelloWorld
folder in the Examples directory and have installed your command line tool in
the [bin](../bin) folder. You should then be able to run this system using the
following command

    xgraph x ./config.json --XGraph ../../Modules

You will then see several messages telling you what various components of xGraph
are doing for setup and start phases.  Eventually you will be greeted with a
prompt

    Welcome to xGraph!

    HelloWorld is Listening... Type Something!

If you type a response xGraph's HelloWorld module will echo it back to you and
increment a value

    > Hello!
    [INFO] --xGraph Repeats: [Hello!]
    [VRBS] Spinning up entity xGraph.HelloWorld-HelloWorld2
    [INFO] --HelloWorld2/otherFunction:  
    [INFO] ----Recieved callback from Other, someValue is now:  2 


---
