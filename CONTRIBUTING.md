## Contributing to snapcraft-build-action

This action is written in TypeScript using Github's template action
project as a starting point.  The unit tests can be run locally, and
the repository includes a Github Actions workflow that will invoke the
in-tree version of the action.

After cloning the repository, the dependencies can be installed with:
```bash
$ npm install
```

The TypeScript code in `src/` can be compiled to JavaScript with:
```bash
$ npm run build
```

The tests in `__tests__/` can be run with:
```bash
$ npm test
```

The packed JavaScript actually run by the Github Actions system can be
built with:
```bash
$ npm run pack
```

If you are putting together a pull request, you can run through all
steps including code reformatting and linting with:
```bash
$ npm run all
```
