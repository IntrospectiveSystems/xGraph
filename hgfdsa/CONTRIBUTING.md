# Contributing

We love pull requests from everyone. By participating in this project, you
agree to abide by the Introspective Systems code guidelines.

Fork, then clone the repo:

    https://github.com/IntrospectiveSystems/xGraph.git

Set up your machine:

    Install the xGraph binary and run it.

Make your change. Add tests for your change. Make the tests pass.

Push to your fork and [submit a pull request][pr].

[pr]: https://github.com/IntrospectiveSystems/xGraph/compare/

At this point you're waiting on us. We like to at least comment on pull requests
within three business days (and, typically, one business day). We may suggest
some changes or improvements or alternatives.

Some things that will increase the chance that your pull request is accepted:

* Write tests.
* Follow our style guide (coming soon).
* Write a good commit message.


#### Installing from Github
If you have [cloned the xGraph repository from github](https://github.com/IntrospectiveSystems/xGraph), 
you can install xGraph using npm.  

##### Install using npm 
From your command line, navigate to the xGraph repository and run `npm install -g .` will install xgraph globally. This will install xgraph from the current
branch of the repository (`sudo` may be required by permissions if on unix systems).

### Testing using the npm package tester
xGraph core is verified using a number of tests. These tests can easily be run using 
the `npm test` command for a comprehensive test, or the `npm run qc` command for a faster test 
that tests common xgraph functionality. 

In your command line tool, navigate to the root of your xGraph core repository. 
Use the following command to run the common tests.
```
npm run qc
```

Or you can enter the either of the following command to run the comprehensive xGraph core tests.
```
npm test
```
or 
```
npm run test
```

