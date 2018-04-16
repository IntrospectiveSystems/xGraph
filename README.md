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
Command Line Interface.


### xGraph Core
The xGraph core architecture handles compiling, instantiating and communication 
between xGraph systems. The xGraph core consists of Genesis and Nexus. Genesis 
handles compilation of xGraph systems, while Nexus handles instantiation of and 
communication between xGraph systems.


### xGraph Command Line Interface (CLI)
The xGraph command line interface accelerates the building and running of xGraph 
Systems. Using the xGraph CLI, you can generate new modules and systems, compile 
systems from a system structure object, and run systems from a system cache. 


#### Getting Started
You can install xGraph using the [npm package manager](https://www.npmjs.com/). 
Because xGraph is developed on the node.js platform, you will have to install 
node.js, and the npm package manager which comes with it. This is easy to do 
from the [node.js homepage](https://nodejs.org/en/). Once you have installed 
node.js and npm, you can install xGraph using the package manager, or [download 
the xGraph core from github](https://github.com/IntrospectiveSystems/xGraph) and 
build the package locally.


##### Install using npm package installer
In your command line tool, use the following command to install xGraph core 
globally using the npm package installer.
```
npm install -g xgraph
```

If you are on a unix machine, you may have to use the `sudo` prefix.
```
sudo npm install -g xgraph
```

##### Install using npm package builder
If you have [cloned the xGraph core from github](https://github.com/IntrospectiveSystems/xGraph), 
you can build and install xGraph locally using the npm package builder. 

In your command line tool, navigate to the root of your xGraph core repository. 
Here, you can enter the following command to build and install xGraph using the 
npm package builder.

```
npm run build
```

If you are on a unix machine, you may have to use the `sudo` prefix.
```
sudo npm run build
```

#### Testing using the npm package tester
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
