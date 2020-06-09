// -*- mode: javascript; js-indent-level: 2 -*-

import fs = require('fs')
import * as process from 'process'
import * as exec from '@actions/exec'
import * as build from '../src/build'
import * as tools from '../src/tools'

afterEach(() => {
  jest.restoreAllMocks()
})

test('SnapcraftBuilder.build runs a snap build', async () => {
  expect.assertions(4)

  const ensureSnapd = jest
    .spyOn(tools, 'ensureSnapd')
    .mockImplementation(async (): Promise<void> => {})
  const ensureLXD = jest
    .spyOn(tools, 'ensureLXD')
    .mockImplementation(async (): Promise<void> => {})
  const ensureSnapcraft = jest
    .spyOn(tools, 'ensureSnapcraft')
    .mockImplementation(async (): Promise<void> => {})
  const execMock = jest.spyOn(exec, 'exec').mockImplementation(
    async (program: string, args?: string[]): Promise<number> => {
      return 0
    }
  )
  process.env['GITHUB_REPOSITORY'] = 'user/repo'
  process.env['GITHUB_RUN_ID'] = '42'

  const projectDir = 'project-root'
  const builder = new build.SnapcraftBuilder(projectDir, true)
  await builder.build()

  expect(ensureSnapd).toHaveBeenCalled()
  expect(ensureLXD).toHaveBeenCalled()
  expect(ensureSnapcraft).toHaveBeenCalled()
  expect(execMock).toHaveBeenCalledWith('sg', ['lxd', '-c', 'snapcraft'], {
    cwd: projectDir,
    env: expect.objectContaining({
      SNAPCRAFT_BUILD_ENVIRONMENT: 'lxd',
      SNAPCRAFT_BUILD_INFO: '1',
      SNAPCRAFT_IMAGE_INFO:
        '{"build_url":"https://github.com/user/repo/actions/runs/42"}'
    })
  })
})

test('SnapcraftBuilder.build can disable build info', async () => {
  expect.assertions(1)

  const ensureSnapd = jest
    .spyOn(tools, 'ensureSnapd')
    .mockImplementation(async (): Promise<void> => {})
  const ensureLXD = jest
    .spyOn(tools, 'ensureLXD')
    .mockImplementation(async (): Promise<void> => {})
  const ensureSnapcraft = jest
    .spyOn(tools, 'ensureSnapcraft')
    .mockImplementation(async (): Promise<void> => {})
  const execMock = jest.spyOn(exec, 'exec').mockImplementation(
    async (program: string, args?: string[]): Promise<number> => {
      return 0
    }
  )

  const builder = new build.SnapcraftBuilder('.', false)
  await builder.build()

  expect(execMock).toHaveBeenCalledWith('sg', expect.any(Array), {
    cwd: expect.any(String),
    env: expect.not.objectContaining({
      // No SNAPCRAFT_BUILD_INFO variable
      SNAPCRAFT_BUILD_INFO: expect.anything()
    })
  })
})

test('SnapcraftBuilder.outputSnap fails if there are no snaps', async () => {
  expect.assertions(2)

  const projectDir = 'project-root'
  const builder = new build.SnapcraftBuilder(projectDir, true)

  const readdir = jest
    .spyOn(builder, '_readdir')
    .mockImplementation(
      async (path: string): Promise<string[]> => ['not-a-snap']
    )

  await expect(builder.outputSnap()).rejects.toThrow(
    'No snap files produced by build'
  )
  expect(readdir).toHaveBeenCalled()
})

test('SnapcraftBuilder.outputSnap returns the first snap', async () => {
  expect.assertions(2)

  const projectDir = 'project-root'
  const builder = new build.SnapcraftBuilder(projectDir, true)

  const readdir = jest
    .spyOn(builder, '_readdir')
    .mockImplementation(
      async (path: string): Promise<string[]> => ['one.snap', 'two.snap']
    )

  await expect(builder.outputSnap()).resolves.toEqual('project-root/one.snap')
  expect(readdir).toHaveBeenCalled()
})
