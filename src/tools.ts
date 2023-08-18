// -*- mode: javascript; js-indent-level: 2 -*-

import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as fs from 'fs'
import * as os from 'os'

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

export async function ensureLXDNetwork(): Promise<void> {
  const mobyPackages: string[] = [
    'moby-buildx',
    'moby-engine',
    'moby-cli',
    'moby-compose',
    'moby-containerd',
    'moby-runc'
  ]
  const installedPackages: string[] = []
  const options = {silent: true, ignoreReturnCode: true}
  for (const mobyPackage of mobyPackages) {
    if ((await exec.exec('dpkg', ['-l', mobyPackage], options)) === 0) {
      installedPackages.push(mobyPackage)
    }
  }
  core.info(
    `Installed docker related packages might interfere with LXD networking: ${installedPackages}`
  )
  // Removing docker is the best option, but some pipelines depend on it.
  // https://linuxcontainers.org/lxd/docs/master/howto/network_bridge_firewalld/#prevent-issues-with-lxd-and-docker
  // https://github.com/canonical/lxd-cloud/blob/f20a64a8af42485440dcbfd370faf14137d2f349/test/includes/lxd.sh#L13-L23
  await exec.exec('sudo', ['iptables', '-P', 'FORWARD', 'ACCEPT'])
}

export async function ensureLXD(): Promise<void> {
  const haveDebLXD = await haveExecutable('/usr/bin/lxd')
  if (haveDebLXD) {
    core.info('Removing legacy .deb packaged LXD...')
    await exec.exec('sudo', ['apt-get', 'remove', '-qy', 'lxd', 'lxd-client'])
  }

  core.info(`Ensuring ${os.userInfo().username} is in the lxd group...`)
  await exec.exec('sudo', ['groupadd', '--force', '--system', 'lxd'])
  await exec.exec('sudo', [
    'usermod',
    '--append',
    '--groups',
    'lxd',
    os.userInfo().username
  ])

  // Ensure that the "lxd" group exists
  const haveSnapLXD = await haveExecutable('/snap/bin/lxd')
  core.info('Installing LXD...')
  if (haveSnapLXD) {
    try {
      await exec.exec('sudo', ['snap', 'refresh', 'lxd'])
    } catch (err) {
      core.info('LXD could not be refreshed...')
    }
  } else {
    await exec.exec('sudo', ['snap', 'install', 'lxd'])
  }
  core.info('Initialising LXD...')
  await exec.exec('sudo', ['lxd', 'init', '--auto'])
  await ensureLXDNetwork()
}

export async function ensureSnapcraft(channel: string): Promise<void> {
  const haveSnapcraft = await haveExecutable('/snap/bin/snapcraft')
  core.info('Installing Snapcraft...')
  await exec.exec('sudo', [
    'snap',
    haveSnapcraft ? 'refresh' : 'install',
    '--channel',
    channel,
    '--classic',
    'snapcraft'
  ])
}
