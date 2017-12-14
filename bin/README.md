# xgraph  

v1.0.0

Introspective Systems, LLC.

---
## xGraph Executable
The xGraph command line tool accelerates the building and running of xGraph
Systems.

---
### Getting Started

Download the system dependent installer from the Introspective Systems website.

##### On Windows:
You will have to add the xgraph path variable to your systems environment
variable. This can be done for a single session through the command line,
or you can set the environment variable permanently through windows settings.

The xgraph path variable is ``` {path to...}ProgramFiles/xGraph```.
Append this to your your Environmental Path Variable ($PATH).

To add the xgraph path variable to your system environment variable, go
to "My Computer" > "Properties" > "Advanced" > "Environment Variables" > "Path"
and add it to the list.

##### On Linux or Mac:
Simply unpack the installation file (.tar or .gz) and restart your terminal
session.

---
## API
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

Examples:
    Compile the system in the current directory.
        xgraph compile

    Deploy a module from a system structure file.
        xgraph deploy --config .\ExampleSystems\HelloWorld\config.json

    Reset a system in a different working directory with an external source.
        xgraph reset --cwd .\MultipleSystemsTemplate\Systems\Plexus\ --xGraph ..\xGraph --xGraphTemplates ..\..\xGraphTemplates

    Generate a new module called MyFirstModule.
        xgraph generate module MyFirstModule
```


---
## Contributing

Please read [CONTRIBUTING.md] (add link .....) for details on our code of 
conduct, and the process for submitting pull requests to us.

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available,
 see the [tags on this repository] (tags link ....). 


## License

....
