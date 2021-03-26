



# xGraph

[![Travis branch](https://img.shields.io/travis/IntrospectiveSystems/xGraph/release.svg?style=for-the-badge)](https://travis-ci.org/IntrospectiveSystems/xGraph)
[![Greenkeeper badge](https://img.shields.io/badge/Greenkeeper-Enabled-brightgreen.svg?style=for-the-badge)](https://greenkeeper.io/)
[![npm](https://img.shields.io/npm/v/xgraph.svg?style=for-the-badge)](https://www.npmjs.com/package/xgraph)
[![npm](https://img.shields.io/npm/l/xgraph.svg?style=for-the-badge)](https://github.com/IntrospectiveSystems/xGraph/blob/release/LICENSE.txt)

<p align="center">
  <img src="http://www.introspectivesystems.com/wp-content/uploads/2017/12/post-xGraph-medium-570x350.png"/>
</p>

Introspective Systems, LLC.
https://introspectivesystems.github.io/

---

The xGraph package comes with two main features: the xGraph core and the xGraph 
Command Line Interface (CLI). The xGraph core architecture handles compiling, 
starting and communicating between xGraph systems. The xGraph CLI makes it 
easy to interact with xGraph systems. You can easily install xGraph using the 
npm package installer.

#### Getting Started with npm
To install xGraph directly form npm, you will need the [node package manager](https://www.npmjs.com/). 
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
  help         h                    : Displays this help screen.

  compile      c                    : Generates a cache from a system
                                      structure file (config.json).

  deploy       d                    : Run a system from the cache.

  reset        r                    : Run a system from system structure
                                      file, resetting the system's cache.

  execute      x                    : Run a system from the cache or compile
                                      and run the system if the cache does
                                      not exist.

  generate <module|system>  g <m|s> : Generate a new module or system
                                      from a template with the given
                                      name.

Options:
  --cwd                             : Sets the current working directory
                                      for the command.
  --config                          : Specifies a system's structure file.
  --cache                           : Specifies a system's cache directory.
  --allow-add-module                : Enable a module to add new modules
                                      in memory to the Module cache.
  --loglevelsilent      --silent    : Block all logs from appearing in the
                                      console window. Logs will still be
                                      printed to the log file.
  --loglevelverbose     --verbose   : Allows verbose logs to be printed to
                                      the console window.
  --logleveldebug                   : Allows the verbose logs and the debug
                                      logs to be printed to the console window.

Examples:
  Compile the system (config.json) in the current directory.
      xgraph compile

  Deploy a module from a system structure file.
      xgraph deploy --config ./ExampleSystems/HelloWorld/config.json

  Reset a system in a different working directory with an external source.
      xgraph reset --cwd ./MultipleSystemsTemplate/Systems/Plexus/ --xGraph ../xGraph

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
