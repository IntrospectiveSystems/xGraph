# xGraph
Stable: [![Build Status](https://travis-ci.org/IntrospectiveSystems/xGraph.svg?branch=release)](https://travis-ci.org/IntrospectiveSystems/xGraph)

Nightly: [![Build Status](https://travis-ci.org/IntrospectiveSystems/xGraph.svg?branch=develop)](https://travis-ci.org/IntrospectiveSystems/xGraph)

<p align="center">
  <img src="http://www.introspectivesystems.com/wp-content/uploads/2017/12/post-xGraph-medium-570x350.png" alt="Sublime's custom image"/>
</p>


v1.1.1

Introspective Systems, LLC.

---
### xGraph Executable
The xGraph command line interface accelerates the building and running
of xGraph Systems.

---
#### Getting Started
You will find all the necessary installation files in the `.\bin\`
directory. To install the xgraph CLI, follow the instructions for your
operating system found below.

##### For Windows:
You can use the `xgraph.msi` file to install the xgraph CLI. Simply double
click the file and the installer will run.

Additionally, you will have to add the xgraph path variable to your
systems environment variable. This can be done for a single session
through the command line, or you can set the environment variable
permanently through windows settings.

The xgraph path variable is ``` {path to...}ProgramFiles/xGraph```.
Append this to your your Environmental Path Variable ($PATH).

To add the xgraph path variable to your system environment variable, go
to "My Computer" > "Properties" > "Advanced" > "Environment Variables" > "Path"
and add it to the list.

##### For Mac:
You can use the `xGraph.dmg` file to install the xgraph CLI. Simply double
click the file and the installer will walk you through the installation
process.

Because the package is unsigned, you may have to allow the installation
of unsigned packages in the security control panel.

##### For Linux:
Simply unpack the installation file (.tar or .gz) and restart your terminal
session.



---
### API
```
Compile and Run xGraph systems with a few simple commands.

Unless otherwise specified, commands will look in the current working
directory for a config.json file or cache directory, depending on the
command.

If the system includes local module sources, these must be listed after
the command and options, [--source directory ...].

xGraph

Usage: xgraph [command] [options] [--source directory ...]

Command:
    help        h                       : Displays this help screen.
    compile     c                       : Generates a cache from a system
                                            structure file.
    deploy      d                       : Run a system from it's cache.
    reset       r                       : Run a system from system structure
                                            file, resetting the system's cache.
    generate <module|system>    g <m|s> : Generate a new module or system
                                            from a template with the given
                                            name.

    execute     x run                   : Run a system from it's cache, or
                                            it's system structure file if
                                            the cache does not exist.

Options:
    --cwd                               : Sets the current working directory
                                            for the command.
    --config                            : Specifies a system's structure file.
	--cache                             : Specifies a system's cache directory.
	--allow-add-module                  : Enable a module to add new modules
    		                                in memory to the Module cache.

Examples:
    Compile the system in the current directory.
        xgraph compile

    Deploy a module from a system structure file.
        xgraph deploy --config ./ExampleSystems/HelloWorld/config.json

    Reset a system in a different working directory with an external source.
        xgraph reset --cwd ./MultipleSystemsTemplate/Systems/Plexus/ --xGraph ../xGraph --xGraphTemplates ../../xGraphTemplates

    Generate a new module called MyFirstModule.
        xgraph generate module MyFirstModule
```


---
### Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of
conduct, and the process for submitting pull requests to us.

### Versioning

We use [SemVer](http://semver.org/) for versioning.


### License
This software is licensesd under the [GNU AFFERO GENERAL PUBLIC LICENSE Version 3](https://www.gnu.org/licenses/agpl-3.0.html).  
Please contact us at sales@introspectivesystems.com if you are interested in pursuing one of our Enterprise licenses.
