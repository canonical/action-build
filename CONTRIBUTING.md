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

## Making Releases

1. Update the version number in `package.json`, commit and push.
2. On the Github website, make a release matching the version number (e.g. `v1.0.0`).
3. Update the `v1` tag to point at the new release revision.
  ```
  git tag -fa v1 -m "Update v1 tag"
  git push origin v1 --force
  ```
