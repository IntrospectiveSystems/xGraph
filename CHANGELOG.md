# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).


## [1.3.0] [Unreleased]
### Added
- Compilation now recognises Bower components required by modules in `@system`
- Entity fiels can now be written as a class, with methods mirroring the
  messages the entity accepts

### Changed
- Compilation split into 3 phases:
  1. `@system` directives
  2. Other `@` directives
  3. Write cache to disk

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
