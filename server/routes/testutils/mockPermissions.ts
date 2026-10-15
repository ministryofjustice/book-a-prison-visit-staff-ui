import { PrisonerPermission, prisonerPermissionsGuard } from '@ministryofjustice/hmpps-prison-permissions-lib'

export default function mockPermissions(permissions: Partial<Record<PrisonerPermission, boolean>>) {
  const prisonerPermissionsGuardMock = prisonerPermissionsGuard as jest.MockedFunction<typeof prisonerPermissionsGuard>

  prisonerPermissionsGuardMock.mockImplementation((_service, options) => async (_req, _res, next) => {
    return options.requestDependentOn.some(perm => !permissions[perm])
      ? next(<Error>{ status: 403, name: 'Permission denied', message: '' })
      : next()
  })
}
