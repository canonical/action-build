// -*- mode: javascript; js-indent-level: 2 -*-

import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import * as exec from '@actions/exec'
import * as tools from '../src/tools'

afterEach(() => {
  jest.restoreAllMocks()
})

test('ensureSnapd installs snapd if needed', async () => {
  expect.assertions(4)

  const accessMock = jest.spyOn(fs.promises, 'access').mockImplementation(
    async (filename: fs.PathLike, mode?: number | undefined): Promise<void> => {
      throw new Error('not found')
    }
  )
  const statMock = jest.spyOn(fs.promises, 'stat').mockImplementation(
    async (filename: fs.PathLike): Promise<fs.Stats> => {
      const s = new fs.Stats()
      s.uid = 0
      s.gid = 0
      return s
    }
  )
  const execMock = jest.spyOn(exec, 'exec').mockImplementation(
    async (program: string, args?: string[]): Promise<number> => {
      return 0
    }
  )

  await tools.ensureSnapd()

  expect(accessMock).toHaveBeenCalled()
  expect(statMock).toHaveBeenCalled()
  expect(execMock).toHaveBeenNthCalledWith(1, 'sudo', [
    'apt-get',
    'update',
    '-q'
  ])
  expect(execMock).toHaveBeenNthCalledWith(2, 'sudo', [
    'apt-get',
    'install',
    '-qy',
    'snapd'
  ])
})

test('ensureSnapd is a no-op if snapd is installed', async () => {
  expect.assertions(3)

  const accessMock = jest
    .spyOn(fs.promises, 'access')
    .mockImplementation(
      async (
        filename: fs.PathLike,
        mode?: number | undefined
      ): Promise<void> => {}
    )
  const statMock = jest.spyOn(fs.promises, 'stat').mockImplementation(
    async (filename: fs.PathLike): Promise<fs.Stats> => {
      const s = new fs.Stats()
      s.uid = 0
      s.gid = 0
      return s
    }
  )
  const execMock = jest.spyOn(exec, 'exec').mockImplementation(
    async (program: string, args?: string[]): Promise<number> => {
      return 0
    }
  )

  await tools.ensureSnapd()

  expect(accessMock).toHaveBeenCalled()
  expect(statMock).toHaveBeenCalled()
  expect(execMock).not.toHaveBeenCalled()
})

test('ensureSnapd fixes permissions on the root directory', async () => {
  expect.assertions(3)

  const accessMock = jest
    .spyOn(fs.promises, 'access')
    .mockImplementation(
      async (
        filename: fs.PathLike,
        mode?: number | undefined
      ): Promise<void> => {}
    )
  const statMock = jest.spyOn(fs.promises, 'stat').mockImplementation(
    async (filename: fs.PathLike): Promise<fs.Stats> => {
      const s = new fs.Stats()
      s.uid = 500
      s.gid = 0
      return s
    }
  )
  const execMock = jest.spyOn(exec, 'exec').mockImplementation(
    async (program: string, args?: string[]): Promise<number> => {
      return 0
    }
  )

  await tools.ensureSnapd()

  expect(accessMock).toHaveBeenCalled()
  expect(statMock).toHaveBeenCalled()
  expect(execMock).toHaveBeenCalledWith('sudo', ['chown', 'root:root', '/'])
})

test('ensureLXD installs the snap version of LXD if needed', async () => {
  expect.assertions(5)

  const accessMock = jest.spyOn(fs.promises, 'access').mockImplementation(
    async (filename: fs.PathLike, mode?: number | undefined): Promise<void> => {
      throw new Error('not found')
    }
  )
  const execMock = jest.spyOn(exec, 'exec').mockImplementation(
    async (program: string, args?: string[]): Promise<number> => {
      return 0
    }
  )

  await tools.ensureLXD()

  expect(execMock).toHaveBeenNthCalledWith(1, 'sudo', [
    'groupadd',
    '--force',
    '--system',
    'lxd'
  ])
  expect(execMock).toHaveBeenNthCalledWith(2, 'sudo', [
    'usermod',
    '--append',
    '--groups',
    'lxd',
    os.userInfo().username
  ])
  expect(accessMock).toHaveBeenCalled()
  expect(execMock).toHaveBeenNthCalledWith(3, 'sudo', [
    'snap',
    'install',
    'lxd'
  ])
  expect(execMock).toHaveBeenNthCalledWith(4, 'sudo', ['lxd', 'init', '--auto'])
})

test('ensureLXD removes the apt version of LXD', async () => {
  expect.assertions(2)

  const accessMock = jest.spyOn(fs.promises, 'access').mockImplementation(
    async (filename: fs.PathLike, mode?: number | undefined): Promise<void> => {
      return
    }
  )
  const execMock = jest.spyOn(exec, 'exec').mockImplementation(
    async (program: string, args?: string[]): Promise<number> => {
      return 0
    }
  )

  await tools.ensureLXD()

  expect(accessMock).toHaveBeenCalled()
  expect(execMock).toHaveBeenNthCalledWith(1, 'sudo', [
    'apt-get',
    'remove',
    '-qy',
    'lxd',
    'lxd-client'
  ])
})

test('ensureLXD still calls "lxd init" if LXD is installed', async () => {
  expect.assertions(5)

  const accessMock = jest.spyOn(fs.promises, 'access').mockImplementation(
    async (filename: fs.PathLike, mode?: number | undefined): Promise<void> => {
      if (filename === '/snap/bin/lxd') {
        return
      }
      throw new Error('not found')
    }
  )
  const execMock = jest.spyOn(exec, 'exec').mockImplementation(
    async (program: string, args?: string[]): Promise<number> => {
      return 0
    }
  )

  await tools.ensureLXD()

  expect(accessMock).toHaveBeenCalled()
  expect(execMock).toHaveBeenNthCalledWith(1, 'sudo', [
    'groupadd',
    '--force',
    '--system',
    'lxd'
  ])
  expect(execMock).toHaveBeenNthCalledWith(2, 'sudo', [
    'usermod',
    '--append',
    '--groups',
    'lxd',
    os.userInfo().username
  ])
  expect(execMock).toHaveBeenNthCalledWith(3, 'sudo', [
    'snap',
    'refresh',
    'lxd'
  ])
  expect(execMock).toHaveBeenNthCalledWith(4, 'sudo', ['lxd', 'init', '--auto'])
})

test('ensureSnapcraft installs Snapcraft if needed', async () => {
  expect.assertions(2)

  const accessMock = jest.spyOn(fs.promises, 'access').mockImplementation(
    async (filename: fs.PathLike, mode?: number | undefined): Promise<void> => {
      throw new Error('not found')
    }
  )
  const execMock = jest.spyOn(exec, 'exec').mockImplementation(
    async (program: string, args?: string[]): Promise<number> => {
      return 0
    }
  )

  await tools.ensureSnapcraft('edge')

  expect(accessMock).toHaveBeenCalled()
  expect(execMock).toHaveBeenNthCalledWith(1, 'sudo', [
    'snap',
    'install',
    '--channel',
    'edge',
    '--classic',
    'snapcraft'
  ])
})

test('ensureSnapcraft refreshes if Snapcraft is installed', async () => {
  expect.assertions(2)

  const accessMock = jest.spyOn(fs.promises, 'access').mockImplementation(
    async (filename: fs.PathLike, mode?: number | undefined): Promise<void> => {
      return
    }
  )
  const execMock = jest.spyOn(exec, 'exec').mockImplementation(
    async (program: string, args?: string[]): Promise<number> => {
      return 0
    }
  )

  await tools.ensureSnapcraft('edge')

  expect(accessMock).toHaveBeenCalled()
  expect(execMock).toHaveBeenNthCalledWith(1, 'sudo', [
    'snap',
    'refresh',
    '--channel',
    'edge',
    '--classic',
    'snapcraft'
  ])
})
