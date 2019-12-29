// -*- mode: javascript; js-indent-level: 2 -*-

import * as core from '@actions/core'
import {SnapcraftBuilder} from './build'

async function run(): Promise<void> {
  try {
    const path: string = core.getInput('path')
    core.info(`Building Snapcraft project in "${path}"...`)

    const builder = new SnapcraftBuilder(path)
    await builder.build()
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
