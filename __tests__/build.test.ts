// -*- mode: javascript; js-indent-level: 2 -*-

import * as exec from '@actions/exec'
import * as build from '../src/build'
import * as tools from '../src/tools'

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

  const projectDir = 'project-root'
  const builder = new build.SnapcraftBuilder(projectDir)
  await builder.build()

  expect(ensureSnapd).toHaveBeenCalled()
  expect(ensureLXD).toHaveBeenCalled()
  expect(ensureSnapcraft).toHaveBeenCalled()
  expect(execMock).toHaveBeenCalledWith('sudo', ['snapcraft', '--use-lxd'], {
    cwd: projectDir
  })
})
