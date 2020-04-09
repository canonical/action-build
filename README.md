<p align="center">
  <a href="https://github.com/snapcore/action-build/actions"><img alt="snapcraft-build-action status" src="https://github.com/snapcore/action-build/workflows/build-test/badge.svg"></a>
</p>

# Snapcraft Build Action

This is a Github Action that can be used to build a
[Snapcraft](https://snapcraft.io) project.  For most projects, the
following workflow should be sufficient:

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - uses: snapcore/action-build@v1
```

This will install and configure LXD and Snapcraft, then invoke
`snapcraft` to build the project.

It assumes that the Snapcraft project is at the root of the
repository.  If this is not the case, then the action can be
configured with the `path` input parameter:

```yaml
...
    - uses: snapcore/action-build@v1
      with:
        path: path-to-snapcraft-project
```

On success, the action will set the `snap` output parameter to the
path of the built snap.  This can be used to save it as an artifact of
the workflow:

```yaml
...
    - uses: snapcore/action-build@v1
      id: snapcraft
    - uses: actions/upload-artifact@v1
      with:
        name: snap
        path: ${{ steps.snapcraft.outputs.snap }}
```

Alternatively, it could be used to perform further testing on the built snap:

```yaml
    - run: |
        sudo snap install --dangerous ${{ steps.snapcraft.outputs.snap }}
        # do something with the snap
```
