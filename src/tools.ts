// -*- mode: javascript; js-indent-level: 2 -*-

import * as fs from 'fs'
import * as os from 'os'
import * as core from '@actions/core'
import * as exec from '@actions/exec'

async function haveExecutable(path: string): Promise<boolean> {
  try {
    await fs.promises.access(path, fs.constants.X_OK)
  } catch (err) {
    return false
  }
  return true
}

export async function ensureSnapd(): Promise<void> {
  const haveSnapd = await haveExecutable('/usr/bin/snap')
  if (!haveSnapd) {
    core.info('Installing snapd...')
    await exec.exec('sudo', ['apt-get', 'update', '-q'])
    await exec.exec('sudo', ['apt-get', 'install', '-qy', 'snapd'])
  }
  // The Github worker environment has weird permissions on the root,
  // which trip up snap-confine.
  const root = await fs.promises.stat('/')
  if (root.uid !== 0 || root.gid !== 0) {
    await exec.exec('sudo', ['chown', 'root:root', '/'])
  }
}

export async function ensureLXD(): Promise<void> {
  const haveDebLXD = await haveExecutable('/usr/bin/lxd')
  if (haveDebLXD) {
    core.info('Removing legacy .deb packaged LXD...')
    await exec.exec('sudo', ['apt-get', 'remove', '-qy', 'lxd', 'lxd-client'])
  }
  const haveSnapLXD = await haveExecutable('/snap/bin/lxd')
  if (!haveSnapLXD) {
    core.info('Installing LXD...')
    await exec.exec('sudo', ['snap', 'install', 'lxd'])
    await exec.exec('sudo', ['lxd', 'init', '--auto'])
    await exec.exec('sudo', [
      'usermod',
      '--append',
      '--groups',
      'lxd',
      os.userInfo().username
    ])
  }
}

export async function ensureSnapcraft(): Promise<void> {
  const haveSnapcraft = await haveExecutable('/snap/bin/snapcraft')
  if (!haveSnapcraft) {
    core.info('Installing Snapcraft...')
    await exec.exec('sudo', ['snap', 'install', '--classic', 'snapcraft'])
  }
}
