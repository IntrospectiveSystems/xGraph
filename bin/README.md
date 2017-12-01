# xgraph  

v1.0.0

Introspective Systems, LLC.

---
## xgraph executable
The xgraph command line tool accelerates the building and running of xGraph 
Systems. 

---
## Getting Started

Download the system dependent installer from the Introspective Systems webpage. 

On Windows: Be sure the {path to...}ProgramFiles/xGraph directory is appended to 
your Environmental Path Variable ($PATH). To append it got to 
"My Computer" > "Properties" > "Advanced" > "Environment Variables" > "Path" and
add it to the list. 

On Linux or Mac: Simply unpack the .tar.gz files and reopen your terminal
window.

---
## API 
xgraph command line tool options
--help      display the help message
--version   display the current xgraph version

--compile   build an xGraph cache directory from an xGraph Configuration
            (config.json) file (Production)
--deploy    start an xGraph System from an xGraph cache directory (Production)
--reset     compile and deploy an xGraph System
--execute   deploy an xGraph System if the cache exists, else compile and deploy

--generate  generate a new module (m) or system (s) from a blank template


Useful command line attributes
--cwd       set the working directory xgraph operation



---
## Contributing

Please read [CONTRIBUTING.md] (add link .....) for details on our code of 
conduct, and the process for submitting pull requests to us.

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available,
 see the [tags on this repository] (tags link ....). 


## License

....
