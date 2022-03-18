// -*- mode: javascript; js-indent-level: 2 -*-

import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import * as process from 'process'
import * as tools from './tools'

interface ImageInfo {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  'build-request-id'?: string
  // eslint-disable-next-line @typescript-eslint/naming-convention
  'build-request-timestamp'?: string
  // eslint-disable-next-line @typescript-eslint/naming-convention
  build_url?: string
}

function expandHome(p: string): string {
  if (p === '~' || p.startsWith('~/')) {
    p = os.homedir() + p.slice(1)
  }
  return p
}

interface SnapcraftBuilderOptions {
  projectRoot: string
  includeBuildInfo: boolean
  snapcraftChannel: string
  snapcraftArgs: string
  uaToken: string
}

export class SnapcraftBuilder {
  projectRoot: string
  includeBuildInfo: boolean
  snapcraftChannel: string
  snapcraftArgs: string
  uaToken: string

  constructor(options: SnapcraftBuilderOptions) {
    this.projectRoot = expandHome(options.projectRoot)
    this.includeBuildInfo = options.includeBuildInfo
    this.snapcraftChannel = options.snapcraftChannel
    this.snapcraftArgs = options.snapcraftArgs
    this.uaToken = options.uaToken
  }

  async build(): Promise<void> {
    core.startGroup('Installing Snapcraft plus dependencies')
    await tools.ensureSnapd()
    await tools.ensureLXD()
    await tools.ensureSnapcraft(this.snapcraftChannel)
    core.endGroup()

    const imageInfo: ImageInfo = {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      build_url: `https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
    }
    // Copy and update environment to pass to snapcraft
    const env: {[key: string]: string} = {}
    Object.assign(env, process.env)
    env['SNAPCRAFT_BUILD_ENVIRONMENT'] = 'lxd'
    env['SNAPCRAFT_IMAGE_INFO'] = JSON.stringify(imageInfo)
    if (this.includeBuildInfo) {
      env['SNAPCRAFT_BUILD_INFO'] = '1'
    }

    let snapcraft = 'snapcraft'
    if (this.snapcraftArgs) {
      snapcraft = `${snapcraft} ${this.snapcraftArgs}`
    }
    if (this.uaToken) {
      snapcraft = `${snapcraft} --ua-token ${this.uaToken}`
    }

    await exec.exec('sg', ['lxd', '-c', snapcraft], {
      cwd: this.projectRoot,
      env
    })
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
