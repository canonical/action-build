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

On success, the action will set the `snap` output parameter to the
path of the built snap.  This can be used to save it as an artifact of
the workflow:

```yaml
...
    - uses: snapcore/action-build@v1
      id: snapcraft
    - uses: actions/upload-artifact@v2
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

The action can also be chained with
[`snapcore/action-publish@v1`](https://github.com/snapcore/action-publish)
to automatically publish builds to the Snap Store.


## Action inputs

### `path`

If your Snapcraft project is not located in the root of the workspace,
you can specify an alternative location via the `path` input
parameter:

```yaml
...
    - uses: snapcore/action-build@v1
      with:
        path: path-to-snapcraft-project
```

### `build-info`

By default, the action will tell Snapcraft to include information
about the build in the resulting snap, in the form of the
`snap/snapcraft.yaml` and `snap/manifest.yaml` files.  Among other
things, these are used by the Snap Store's automatic security
vulnerability scanner to check whether your snap includes files from
vulnerable versions of Ubuntu packages.

This can be turned off by setting the `build-info` parameter to
`false`.

### `snapcraft-channel`

By default, the action will install Snapcraft from the stable
channel.  If your project relies on a feature not found in the stable
version of Snapcraft, then the `snapcraft-channel` parameter can be
used to select a different channel.

### `snapcraft-args`

The `snapcraft-args` parameter can be used to pass additional
arguments to Snapcraft.  This is primarily intended to allow the use
of experimental features by passing `--enable-experimental-*`
arguments to Snapcraft.

### `ua-token`

The `ua-token` parameter can be used to tell Snapcraft to attach an Ubuntu
Advantage (UA) token inside the build environment. Snapcraft will ensure
the token is detached before exiting, but be warned that it is possible
some failures may prevent detaching (e.g. aborted jobs).

In order to make the UA token available to the workflow, it should be stored
as a repository secret:

1. choose the "Settings" tab.
2. choose "Secrets" from the menu on the left.
3. click "Add a new secret".
4. set the name to `UA_TOKEN` (or whatever is referenced in the workflow),
   and paste the UA token as the value.

Note that repository secrets are not available to workflows triggered
by pull requests to public repositories.

An example workflow with UA token stored as secret `UA_TOKEN`:

```yaml
...
    - uses: snapcore/action-build@v1
      with:
        ua-token: ${{ secrets.UA_TOKEN }}
```
