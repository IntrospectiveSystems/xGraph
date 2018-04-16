
### Hello World

v1.0

Introspective Systems, LLC.

---
#### Hello!

This is the HelloWorld Module. This module is an example of how
multiple *entities* that communicate inside a *module*.

This *module* has the *entities* **HelloWorld.js** and
**HelloWorld2.js**, both of which communicate messages with the help
of the 'send' function of Nexus.

The **schema.json** tells xGraph how the module is structured internally.


When run in a system, the hello world module waits for text input from
standard in, then repeats what the user typed. The first entity,
HelloWorld, sends a command to the second entity, HelloWorld2, and
HelloWorld2 iterates a value. Finally, the command is returned to the
callback function in HelloWorld.

This is a typical flow for message passing between entities inside a
module. However, a module is usually fully encapsulated, so we are not
usually concerned with the communications between entities in this
document. This is simply an example of how modules work.

---

#### Loading a Module in a System

This module is simple to use. Add the module to a system, run the system,
and you will see xGraph mirror what you say. An example of this can be
found in `ExampleSystems/MultipleEntitiesSingleModule/HelloWorld/` folder for this example.

To add a module to a system, you add the module definition to the system's
structure file. Typically, this file is a `config.json` file. The
`config.json` for our example is found in
`MultipleEntitiesSingleModule/ExampleSystems/HelloWorld/`. Let's take a look:

```
{
    "Sources": {
        "xGraph": "{xGraph}",
        "xGraphTemplates": "{xGraphTemplates}"
    },
    "Modules": {
        "HelloWorld":{
            "Module": "xGraphTemplates:Modules/HelloWorld",
                "Par":{
                }
            }
        }
    }
}
```

The first section, the `"Sources"` key of the JSON object, defines path
variables for module sources. This is where xGraph will look for the
modules, and a path for each key must be provided when the system is run.
These can be module brokers, places that serve modules, or a path to a
local file space where modules are being developed.

The next section, the `"Modules"` key, is the module definitions. Here we
have our HelloWorld module definition:

```
"HelloWorld":{
    "Module": "xGraphTemplates:Modules/HelloWorld",
    "Par":{
        "SomePar": "Hello Mars"
    }
}
```

The `"Module"` key provides the path to the HelloWorld module source. You
will notice this path,
`"xGraphTemplates:Modules/HelloWorld"`,
has the prefix `xGraphTemplates:`. This is a path variable found in the
"Sources" section of the configuration file.

The `"Source"` key is a reference of the path variable that will tell
xGraph where to look for the Module.

The `"Par"` object holds parameter key-value pairs that will be passed to
the HelloWorld module. This module definition has an optional Par,
`"SomePar"`, just as an example. The value of `"SomePar"` will print
when HelloWorld gets the Setup command.

This is everything you need to add the HelloWorld module to a system.
Run the system, and you will see the module at work!

---

### Module Interface

The next section is the API documentation for this module. This
documentation should be built for xGraph users, who are not necessarily
developer. More information on xGraph module documentation requirements
can be found on the xGraph Wiki.

#### Module Definition Parameters

Parameters are defined in the module definition and stored in this.Par.
Some are required, while some may be optional. Below, the Parameters
that HelloWorld expects are defined.

- **Par.SomePar** : HelloWorld will check if this parameter exists on
startup. If it exists, HelloWorld will print the value of SomePar.

---

#### Output Commands

The Output Commands are all the command that HelloWorld can send to
other modules.

***(HelloWorld does not require any parameters to be defined in the
config.json file.)***

---

#### Input Commands
The Input Commands are all the command that HelloWorld can
receive.

##### Start(com, fun)
Start is called when HelloWorld is first generated. Start sets up a
listener for standard in. When text is received, the console repeats
the input and sends a message to the other entity. This entity
increments a value, and returns it to the first entity, where the value
is printed.

###### Parameters
- **com** (*required*): The command object.
- **fun** (*required*): The callback function.
