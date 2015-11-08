# check-engines [![Build Status](https://secure.travis-ci.org/kruppel/check-engines.svg?branch=master)](https://travis-ci.org/kruppel/check-engines)

Utility to verify that engine versions (node, npm, iojs) satisfy semver
constraints specified in package.json.

## Usage

### CLI

```sh
⫸  check-engines
# Errors will return exit code 1, otherwise 0.
```

### Programmatic

```javascript
var checkEngines = require('check-engines');

checkEngines(function(err) {
  if (err) {
    console.error(err);
  }
});
```

## License

Copyright 2015 Kurt Ruppel

Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this work except in compliance with the License.

You may obtain a copy of the License at
http://www.apache.org/licenses/LICENSE-2.0.

Unless required by applicable law or agreed to in writing, software distributed
under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
CONDITIONS OF ANY KIND, either express or implied. See the License for the
specific language governing permissions and limitations under the License.
