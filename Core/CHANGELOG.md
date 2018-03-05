# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

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
- Proxy changed (we are figuring out how)
- Core modules moved from ./Modules/ to ./Modules/xGraph/
- A system's cache now holds a .zip of each module.
