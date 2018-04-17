[![Travis branch](https://img.shields.io/travis/IntrospectiveSystems/xGraph/release.svg?style=for-the-badge)](https://travis-ci.org/IntrospectiveSystems/xGraph)
[![npm](https://img.shields.io/npm/v/xgraph.svg?style=for-the-badge)](https://www.npmjs.com/package/xgraph)
[![npm](https://img.shields.io/npm/l/xgraph.svg?style=for-the-badge)](https://github.com/IntrospectiveSystems/xGraph/blob/release/LICENSE.txt)



# xGraph

<p align="center">
  <img src="http://www.introspectivesystems.com/wp-content/uploads/2017/12/post-xGraph-medium-570x350.png" alt="Sublime's custom image"/>
</p>

v1.1.1

Introspective Systems, LLC.

---

The xGraph package comes with two main features: the xGraph core and the xGraph 
Command Line Interface (CLI). The xGraph core architecture handles compiling, 
instantiating and communication between xGraph systems. The xGraph CLI makes it 
easy to interact with xGraph systems. You can easily install xGraph using the 
npm package installer.

#### Getting Started with npm
To install xGraph directly form npm, you will need the [npm package manager](https://www.npmjs.com/). 
Once you have installed npm, you can install xGraph using the package manager.

In your command line tool, use the following command to install xGraph core 
globally using the npm package installer.
```
npm install -g xgraph
```

If you are on a unix operating system, such as macOS or Ubuntu, you may have to use 
the `sudo` prefix.
```
sudo npm install -g xgraph
```

#### Getting Started from Github
If you have [cloned the xGraph core from github](https://github.com/IntrospectiveSystems/xGraph), 
you can install xGraph locally using system-specific installation files, or compile 
native executables using npm build.  

##### Install using system-specific installation files
You will installation files for the major operating systems (Windows, MacOS and Linux) 
in the `.\bin\` directory. To install the xGraph CLI, follow the instructions for your 
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


##### Compile native executables
In your command line tool, navigate to the root of your xGraph core repository. 
Here, you can enter the following command to build the xGraph executable directly.

```
npm run build
```

If you are on a unix operating system, such as macOS or Ubuntu, you may have to use 
the `sudo` prefix.
```
sudo npm run build
```

### Testing using the npm package tester
xGraph core is verified using a number of tests. These tests can easily be run using 
the npm test command. 

In your command line tool, navigate to the root of your xGraph core repository. 
Here, you can enter the following command to run the xGraph core tests using the npm 
package tester.
```
npm test
```
or 
```
npm run test
```


### xGraph Command Line Interface (CLI)
The xGraph command line interface accelerates the building and running of xGraph 
Systems. Using the xGraph CLI, you can generate new modules and systems, compile 
systems from a system structure object, and run systems from a system cache. 

xGraph uses the following API commands, available in the xGraph CLI using `xgraph help`
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
    execute     x|run                   : Run a system from it's cache, or
                                            it's system structure file if
                                            the cache does not exist.
    generate <module|system>    g <m|s> : Generate a new module or system
                                            from a template with the given
                                            name.

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
