# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [1.4.6]
- Instancing
- Logging
- Immutability

## [1.4.5]
### Changed
- Fixed genesis error reporting 'undefined' sometimes
- Fixed addModule not calling callback.

## [1.4.1]
### Changed 
- Follow a recursion strategy for including subsystems via the @system directive

##[1.4.0]
### Added
- basic broker cli functionality: server, add
- Proper Error handling for undefined references 

## [1.3.7]
### Changed
- Added support for version specification from brokers
within subsystems (@system directives)
- update deleteEntity to use CacheInterface
- saving a non-apex entity before it's apex will automatically save the apex
- logger now limited to 80 characters
- better error reporting for errored connections to module brokers

## [1.3.5]
### Changed
- update save and add module to CacheInterface

## [1.3.4]
### Changed
- fixed a bug in module source mismatches

## [1.3.3]
### Changed
- Genesis no longer breaks on bower installs

## [1.3.2]
### Changed
- Updated npm dependencies
- Fixed flag catching in CLI

### Added 
- Default logging levels set as flags ex. `--silent` (all levels print to xgraph.log)
  0. Defaults to:
    0. e - on
    1. w - on
    3. d - off
    4. i - on 
    5. v - off
  1. `loglevelsilent` or `silent` - turns off all logging
  2. `logleveldebug` - turns on all logging
  3. `loglevelverbose` or `verbose` - turns on verbose

## [1.3.1]
### Changed
- Updated npm dependencies

## [1.3.0] 
### Added
- Compilation now recognises Bower components required by modules in `@system`
- Entity files can now be written as a simple class without the wrapping JavaScript function
- `npm run qa` will run one iteration of `npm test`, to check for most common errors. It runs considerably
  faster than `npm test` and is preferred for local testing.
- Module Broker can now defined in sources by a URI, `"Example": "mb://domain:port"`
- $Stop as a supported command for module deconstruction. 

### Removed
- Modules have been removed from the core repository and now live in the xGraph module broker.

### Changed
- Compilation split into 3 phases:
  1. `@system` directives
  2. Other `@` directives
  3. Write cache to disk
- xGraph CLI xgraph generate <module|system> now accepts either a path or a string and creates a 
system or module in the directory provided.

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
