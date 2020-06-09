// -*- mode: javascript; js-indent-level: 2 -*-

import * as fs from 'fs'
import * as path from 'path'
import * as process from 'process'
import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as tools from './tools'

interface ImageInfo {
  'build-request-id'?: string
  'build-request-timestamp'?: string
  build_url?: string
}

export class SnapcraftBuilder {
  projectRoot: string
  includeBuildInfo: boolean

  constructor(projectRoot: string, includeBuildInfo: boolean) {
    this.projectRoot = projectRoot
    this.includeBuildInfo = includeBuildInfo
  }

  async build(): Promise<void> {
    core.startGroup('Installing Snapcraft plus dependencies')
    await tools.ensureSnapd()
    await tools.ensureLXD()
    await tools.ensureSnapcraft()
    core.endGroup()

    const imageInfo: ImageInfo = {
      // eslint-disable-next-line @typescript-eslint/camelcase
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

    await exec.exec('sg', ['lxd', '-c', 'snapcraft'], {
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
