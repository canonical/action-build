// -*- mode: javascript; js-indent-level: 2 -*-

import * as core from '@actions/core'
import {SnapcraftBuilder} from './build'

async function run(): Promise<void> {
  try {
    const projectRoot = core.getInput('path')
    const includeBuildInfo =
      (core.getInput('build-info') || 'true').toUpperCase() === 'TRUE'
    core.info(`Building Snapcraft project in "${projectRoot}"...`)
    const snapcraftChannel = core.getInput('snapcraft-channel')
    const snapcraftArgs = core.getInput('snapcraft-args')
    const uaToken = core.getInput('ua-token')
    const maxParallelBuildCount = core.getInput('max-parallel-build-count')

    const builder = new SnapcraftBuilder({
      projectRoot,
      includeBuildInfo,
      snapcraftChannel,
      snapcraftArgs,
      uaToken,
      maxParallelBuildCount
    })
    await builder.build()
    const snap = await builder.outputSnap()
    core.setOutput('snap', snap)
  } catch (error) {
    core.setFailed((error as Error)?.message)
  }
}

run()
