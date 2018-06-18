# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).


## [1.3.0] 
### Added
- Compilation now recognises Bower components required by modules in `@system`
- Entity files can now be written as a simple class without the wrapping JavaScript function
- `npm run qa` will run one iteration of `npm test`, to check for most common errors. It runs considerably
  faster than `npm test` and is preferred for local testing.
- Module Broker can now defined in sources by a URI, `"Example": "mb://domain:port"`
- $Stop as a supported command for module deconstruction. 

### Changed
- Compilation split into 3 phases:
  1. `@system` directives
  2. Other `@` directives
  3. Write cache to disk
- xGraph CLI xgraph generate <module|system> now accepts either a path or a
  string and creates a system or module in the directory provided

## [1.2.1]
### Changed
- Uploaded xgraph to [npm](https://www.npmjs.com/package/xgraph)
- Viewify 4.0 is [here (see documentation)](https://github.com/IntrospectiveSystems/xGraph/wiki/2.4-View-Documentation)!

## [1.2.0]
### Added
- Uploaded xgraph to [npm](https://www.npmjs.com/package/xgraph)
- Viewify 4.0 is [here (see documentation)](https://github.com/IntrospectiveSystems/xGraph/wiki/2.4-View-Documentation)!

## [1.1.1]
### Changed
- Fixed the xTickets example system by including all the modules.
- Updated the xgraph command line interface documentation for clarity.
- altered logging to queue entries to prevent locks when too many messages were
  sent at once

## [1.1.0]
### Added
- Viewify 3.5 is [here (see documentation)](https://github.com/IntrospectiveSystems/xGraph/wiki/2.4-View-Documentation)!
- The command line interface xgraph now features the option
  --allow-add-module.

### Changed
- Bug fix in SQLite - removed Each command as it doesn't work with our architecture.
- Bug fixes and code cleanup in the Proxy module.
- Core modules moved from ./Modules/ to ./Modules/xGraph/
- A system's cache now holds a .zip of each module.
