// -*- mode: javascript; js-indent-level: 2 -*-

import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import * as process from 'process'
import * as exec from '@actions/exec'
import * as build from '../src/build'
import * as tools from '../src/tools'

afterEach(() => {
  jest.restoreAllMocks()
})

test('SnapcraftBuilder expands tilde in project root', () => {
  let builder = new build.SnapcraftBuilder({
    projectRoot: '~',
    includeBuildInfo: true,
    snapcraftChannel: 'stable',
    snapcraftArgs: '',
    uaToken: ''
  })
  expect(builder.projectRoot).toBe(os.homedir())

  builder = new build.SnapcraftBuilder({
    projectRoot: '~/foo/bar',
    includeBuildInfo: true,
    snapcraftChannel: 'stable',
    snapcraftArgs: '',
    uaToken: ''
  })
  expect(builder.projectRoot).toBe(path.join(os.homedir(), 'foo/bar'))
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
    .mockImplementation(async (channel): Promise<void> => {})
  const execMock = jest
    .spyOn(exec, 'exec')
    .mockImplementation(
      async (program: string, args?: string[]): Promise<number> => {
        return 0
      }
    )
  process.env['GITHUB_REPOSITORY'] = 'user/repo'
  process.env['GITHUB_RUN_ID'] = '42'

  const projectDir = 'project-root'
  const builder = new build.SnapcraftBuilder({
    projectRoot: projectDir,
    includeBuildInfo: true,
    snapcraftChannel: 'stable',
    snapcraftArgs: '',
    uaToken: ''
  })
  await builder.build()

  const user = os.userInfo().username
  expect(ensureSnapd).toHaveBeenCalled()
  expect(ensureLXD).toHaveBeenCalled()
  expect(ensureSnapcraft).toHaveBeenCalled()
  expect(execMock).toHaveBeenCalledWith(
    'sudo',
    ['-u', user, '-E', 'snapcraft'],
    {
      cwd: projectDir,
      env: expect.objectContaining({
        SNAPCRAFT_BUILD_ENVIRONMENT: 'lxd',
        SNAPCRAFT_BUILD_INFO: '1',
        SNAPCRAFT_IMAGE_INFO:
          '{"build_url":"https://github.com/user/repo/actions/runs/42"}'
      })
    }
  )
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
    .mockImplementation(async (channel): Promise<void> => {})
  const execMock = jest
    .spyOn(exec, 'exec')
    .mockImplementation(
      async (program: string, args?: string[]): Promise<number> => {
        return 0
      }
    )

  const builder = new build.SnapcraftBuilder({
    projectRoot: '.',
    includeBuildInfo: false,
    snapcraftChannel: 'stable',
    snapcraftArgs: '',
    uaToken: ''
  })
  await builder.build()

  expect(execMock).toHaveBeenCalledWith('sudo', expect.any(Array), {
    cwd: expect.any(String),
    env: expect.not.objectContaining({
      // No SNAPCRAFT_BUILD_INFO variable
      SNAPCRAFT_BUILD_INFO: expect.anything()
    })
  })
})

test('SnapcraftBuilder.build can set the Snapcraft channel', async () => {
  expect.assertions(1)

  const ensureSnapd = jest
    .spyOn(tools, 'ensureSnapd')
    .mockImplementation(async (): Promise<void> => {})
  const ensureLXD = jest
    .spyOn(tools, 'ensureLXD')
    .mockImplementation(async (): Promise<void> => {})
  const ensureSnapcraft = jest
    .spyOn(tools, 'ensureSnapcraft')
    .mockImplementation(async (channel): Promise<void> => {})
  const execMock = jest
    .spyOn(exec, 'exec')
    .mockImplementation(
      async (program: string, args?: string[]): Promise<number> => {
        return 0
      }
    )

  const builder = new build.SnapcraftBuilder({
    projectRoot: '.',
    includeBuildInfo: false,
    snapcraftChannel: 'edge',
    snapcraftArgs: '',
    uaToken: ''
  })
  await builder.build()

  expect(ensureSnapcraft).toHaveBeenCalledWith('edge')
})

test('SnapcraftBuilder.build can pass additional arguments', async () => {
  expect.assertions(1)

  const ensureSnapd = jest
    .spyOn(tools, 'ensureSnapd')
    .mockImplementation(async (): Promise<void> => {})
  const ensureLXD = jest
    .spyOn(tools, 'ensureLXD')
    .mockImplementation(async (): Promise<void> => {})
  const ensureSnapcraft = jest
    .spyOn(tools, 'ensureSnapcraft')
    .mockImplementation(async (channel): Promise<void> => {})
  const execMock = jest
    .spyOn(exec, 'exec')
    .mockImplementation(
      async (program: string, args?: string[]): Promise<number> => {
        return 0
      }
    )

  const builder = new build.SnapcraftBuilder({
    projectRoot: '.',
    includeBuildInfo: false,
    snapcraftChannel: 'stable',
    snapcraftArgs: '--foo --bar',
    uaToken: ''
  })
  await builder.build()

  const user = os.userInfo().username
  expect(execMock).toHaveBeenCalledWith(
    'sudo',
    ['-u', user, '-E', 'snapcraft', '--foo', '--bar'],
    expect.anything()
  )
})

test('SnapcraftBuilder.build can pass UA token', async () => {
  expect.assertions(1)

  const ensureSnapd = jest
    .spyOn(tools, 'ensureSnapd')
    .mockImplementation(async (): Promise<void> => {})
  const ensureLXD = jest
    .spyOn(tools, 'ensureLXD')
    .mockImplementation(async (): Promise<void> => {})
  const ensureSnapcraft = jest
    .spyOn(tools, 'ensureSnapcraft')
    .mockImplementation(async (channel): Promise<void> => {})
  const execMock = jest
    .spyOn(exec, 'exec')
    .mockImplementation(
      async (program: string, args?: string[]): Promise<number> => {
        return 0
      }
    )

  const builder = new build.SnapcraftBuilder({
    projectRoot: '.',
    includeBuildInfo: false,
    snapcraftChannel: 'stable',
    snapcraftArgs: '',
    uaToken: 'test-ua-token'
  })
  await builder.build()

  const user = os.userInfo().username
  expect(execMock).toHaveBeenCalledWith(
    'sudo',
    ['-u', user, '-E', 'snapcraft', '--ua-token', 'test-ua-token'],
    expect.anything()
  )
})

test('SnapcraftBuilder.outputSnap fails if there are no snaps', async () => {
  expect.assertions(2)

  const projectDir = 'project-root'
  const builder = new build.SnapcraftBuilder({
    projectRoot: projectDir,
    includeBuildInfo: true,
    snapcraftChannel: 'stable',
    snapcraftArgs: '',
    uaToken: ''
  })

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
  const builder = new build.SnapcraftBuilder({
    projectRoot: projectDir,
    includeBuildInfo: true,
    snapcraftChannel: 'stable',
    snapcraftArgs: '',
    uaToken: ''
  })

  const readdir = jest
    .spyOn(builder, '_readdir')
    .mockImplementation(
      async (path: string): Promise<string[]> => ['one.snap', 'two.snap']
    )

  await expect(builder.outputSnap()).resolves.toEqual('project-root/one.snap')
  expect(readdir).toHaveBeenCalled()
})
