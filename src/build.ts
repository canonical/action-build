// -*- mode: javascript; js-indent-level: 2 -*-

import * as exec from '@actions/exec'
import * as tools from './tools'

export class SnapcraftBuilder {
  path: string

  constructor(path: string) {
    this.path = path
  }

  async build(): Promise<void> {
    await tools.ensureSnapd()
    await tools.ensureLXD()
    await tools.ensureSnapcraft()
    await exec.exec('sudo', ['snapcraft', '--use-lxd'], {cwd: this.path})
  }
}
