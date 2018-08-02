# Nexus

[![npm](https://img.shields.io/npm/v/xgraph.svg?style=for-the-badge)](https://www.npmjs.com/package/xgraph)

Introspective Systems, LLC.

---
## Nexus.js

The Nexus.js script file is the kernel for an xGraph System. When initiated
through the xgraph command line tool (xgraph x, xgraph r, or xgraph d), the 
script will instantiate an xGraph System from an xGraph cache directory. If 
a cache doesn't exists in the directory Genesis.js (the compiler script) must
be leveraged to build a cache directory before Nexus proceeds with the startup process.

See xgraph -help for more explanation about the compiling and running options.

## Getting Started

Install xgraph through npm: `npm install -g xgraph` (sudo may be necessary on linux).

or 

Clone the xGraph Git repository for access to the Nexus.js source code. Once 
downloaded, `npm install -g .` will install the xgraph command line tool globally.

## Contributing

Please read [CONTRIBUTING.md](../bin/CONTRIBUTING.md) for details on our code of
conduct, and the process for submitting pull requests to us.

## Versioning

We use [SemVer](http://semver.org/) for versioning.
