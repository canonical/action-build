// -*- mode: javascript; js-indent-level: 2 -*-

import * as core from '@actions/core'
import {SnapcraftBuilder} from './build'

async function run(): Promise<void> {
  try {
    const path = core.getInput('path')
    const buildInfo =
      (core.getInput('build-info') || 'true').toUpperCase() === 'TRUE'
    core.info(`Building Snapcraft project in "${path}"...`)
    const snapcraftChannel = core.getInput('snapcraft-channel')
    const snapcraftArgs = core.getInput('snapcraft-args')

    const builder = new SnapcraftBuilder(
      path,
      buildInfo,
      snapcraftChannel,
      snapcraftArgs
    )
    await builder.build()
    const snap = await builder.outputSnap()
    core.setOutput('snap', snap)
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
