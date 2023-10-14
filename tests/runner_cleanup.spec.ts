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

test.group('Runner Cleanup', () => {
  test('call cleanup functions in reverse', async ({ assert }) => {
    const hooks = new Hooks()
    const stack: string[] = []

    function beforeSave() {
      stack.push('before save')
      return () => {
        stack.push('cleanup save')
      }
    }
    hooks.add('save', beforeSave)

    function beforeSave1() {
      stack.push('before save 1')
      return () => {
        stack.push('cleanup save 1')
      }
    }
    hooks.add('save', beforeSave1)

    const runner = hooks.runner('save')
    await runner.run()
    assert.isTrue(runner.isCleanupPending)

    await runner.cleanup()

    assert.isFalse(runner.isCleanupPending)
    assert.deepEqual(stack, ['before save', 'before save 1', 'cleanup save 1', 'cleanup save'])
  })

  test('call cleanup functions during error', async ({ assert }) => {
    const hooks = new Hooks()
    const stack: string[] = []

    function beforeSave() {
      stack.push('before save')
      return () => {
        stack.push('cleanup save')
      }
    }
    hooks.add('save', beforeSave)

    function beforeSave1() {
      throw new Error('Failed')
    }
    hooks.add('save', beforeSave1)

    const runner = hooks.runner('save')
    await assert.rejects(() => runner.run())
    assert.isTrue(runner.isCleanupPending)
    await runner.cleanup()

    assert.isFalse(runner.isCleanupPending)
    assert.deepEqual(stack, ['before save', 'cleanup save'])
  })

  test('ensure cleanup is idempotent', async ({ assert }) => {
    const hooks = new Hooks()
    const stack: string[] = []

    function beforeSave() {
      stack.push('before save')
      return () => {
        stack.push('cleanup save')
      }
    }
    hooks.add('save', beforeSave)

    function beforeSave1() {
      stack.push('before save 1')
      return () => {
        stack.push('cleanup save 1')
      }
    }
    hooks.add('save', beforeSave1)

    const runner = hooks.runner('save')
    await runner.run()
    assert.isTrue(runner.isCleanupPending)

    await runner.cleanup()
    await runner.cleanup()
    await runner.cleanup()

    assert.isFalse(runner.isCleanupPending)
    assert.deepEqual(stack, ['before save', 'before save 1', 'cleanup save 1', 'cleanup save'])
  })

  test('pass data to cleanup handlers', async ({ assert }) => {
    const hooks = new Hooks()
    const stack: string[] = []

    function beforeSave() {
      stack.push('before save')
      return (message: string) => {
        stack.push(message)
      }
    }
    hooks.add('save', beforeSave)

    function beforeSave1() {
      stack.push('before save 1')
      return (message: string) => {
        stack.push(message)
      }
    }
    hooks.add('save', beforeSave1)

    const runner = hooks.runner('save')
    await runner.run()
    assert.isTrue(runner.isCleanupPending)

    await runner.cleanup('cleanup')

    assert.isFalse(runner.isCleanupPending)
    assert.deepEqual(stack, ['before save', 'before save 1', 'cleanup', 'cleanup'])
  })
})
