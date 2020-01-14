// -*- mode: javascript; js-indent-level: 2 -*-

import * as path from 'path'
import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as tools from './tools'
// Importing as an ECMAScript Module blocks access to fs.promises:
//   https://github.com/nodejs/node/issues/21014
import fs = require('fs') // eslint-disable-line @typescript-eslint/no-require-imports

export class SnapcraftBuilder {
  projectRoot: string

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot
  }

  async build(): Promise<void> {
    core.startGroup('Installing Snapcraft plus dependencies')
    await tools.ensureSnapd()
    await tools.ensureLXD()
    await tools.ensureSnapcraft()
    core.endGroup()
    await exec.exec(
      'sudo',
      ['env', 'SNAPCRAFT_BUILD_ENVIRONMENT=lxd', 'snapcraft'],
      {
        cwd: this.projectRoot
      }
    )
  }

  // This wrapper is for the benefit of the tests, due to the crazy
  // typing of fs.promises.readdir()
  async _readdir(dir: string): Promise<string[]> {
    return await fs.promises.readdir(dir)
  }

  async outputSnap(): Promise<string> {
    const files = await this._readdir(this.projectRoot)
    const snaps = files.filter(name => name.endsWith('.snap'))

    if (snaps.length === 0) {
      throw new Error('No snap files produced by build')
    }
    if (snaps.length > 1) {
      core.warning(`Multiple snaps found in ${this.projectRoot}`)
    }
    return path.join(this.projectRoot, snaps[0])
  }
}
