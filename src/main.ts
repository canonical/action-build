// -*- mode: javascript; js-indent-level: 2 -*-

import * as core from '@actions/core'
import {SnapcraftBuilder} from './build'

async function run(): Promise<void> {
  try {
    const path = core.getInput('path')
    const buildInfo =
      (core.getInput('build-info') || 'true').toUpperCase() === 'TRUE'
    core.info(`Building Snapcraft project in "${path}"...`)

    const builder = new SnapcraftBuilder(path, buildInfo)
    await builder.build()
    const snap = await builder.outputSnap()
    core.setOutput('snap', snap)
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
