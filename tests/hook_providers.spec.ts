/*
 * @poppinss/hooks
 *
 * (c) Poppinss
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import { Hooks } from '../src/hooks.js'

test.group('Hook Providers', () => {
  test('register hook provider', ({ assert }) => {
    const hooks = new Hooks()

    class LifecycleManagement {}
    hooks.provider(LifecycleManagement)

    assert.deepEqual(hooks.providers(), new Set([LifecycleManagement]))
    assert.isTrue(hooks.hasProvider(LifecycleManagement))
  })

  test('remove hook provider', ({ assert }) => {
    const hooks = new Hooks()

    class LifecycleManagement {}
    hooks.provider(LifecycleManagement)
    hooks.removeProvider(LifecycleManagement)

    assert.deepEqual(hooks.providers(), new Set())
    assert.isFalse(hooks.hasProvider(LifecycleManagement))
  })

  test('merge hooks providers over existing providers', ({ assert }) => {
    const hooks = new Hooks()
    class LifecycleManagement {}
    hooks.provider(LifecycleManagement)

    const hooks1 = new Hooks()
    class VersionManagement {}
    hooks1.provider(VersionManagement)

    assert.deepEqual(hooks.providers(), new Set([LifecycleManagement]))
    assert.deepEqual(hooks1.providers(), new Set([VersionManagement]))

    hooks1.merge(hooks)

    assert.deepEqual(hooks1.providers(), new Set([VersionManagement, LifecycleManagement]))
  })
})
