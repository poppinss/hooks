/*
 * @poppinss/hooks
 *
 * (c) Poppinss
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { run, test } from '@japa/runner'
import { Hooks } from '../src/hooks.js'

test.group('Hook provider runner', () => {
  test('execute event methods from hook providers', async ({ assert }) => {
    const hooks = new Hooks()
    const stack: string[] = []

    class LifecycleManagement {
      save() {
        stack.push('before save')
      }
    }

    hooks.provider(LifecycleManagement)

    const runner = hooks.runner('save')
    await runner.run()

    assert.deepEqual(stack, ['before save'])
  })

  test('each event call should create a fresh instance of hook provider', async ({ assert }) => {
    const hooks = new Hooks()
    const stack: LifecycleManagement[] = []

    class LifecycleManagement {
      save() {
        stack.push(this)
      }

      create() {
        stack.push(this)
      }
    }

    hooks.provider(LifecycleManagement)

    await hooks.runner('save').run()
    await hooks.runner('create').run()

    assert.notStrictEqual(stack[0], stack[1])
    assert.instanceOf(stack[0], LifecycleManagement)
    assert.instanceOf(stack[1], LifecycleManagement)
  })

  test('collect cleanup methods from hook providers', async ({ assert }) => {
    const hooks = new Hooks()
    const stack: string[] = []

    class LifecycleManagement {
      save() {
        stack.push('before save')
        return () => {
          stack.push('cleanup')
        }
      }
    }

    hooks.provider(LifecycleManagement)

    const runner = hooks.runner('save')
    await runner.run()
    await runner.cleanup()

    assert.deepEqual(stack, ['before save', 'cleanup'])
  })

  test('work fine when hook provider does not handle a specific event', async ({ assert }) => {
    const hooks = new Hooks()
    const stack: string[] = []

    class LifecycleManagement {}

    hooks.provider(LifecycleManagement)

    await hooks.runner('save').run()
    assert.deepEqual(stack, [])
  })

  test('use custom provider executor', async ({ assert }) => {
    const hooks = new Hooks()
    let stack: string[] = []

    class LifecycleManagement {
      save(...messages: string[]) {
        stack = stack.concat(messages)
      }
    }

    hooks.provider(LifecycleManagement)

    const runner = hooks.runner('save')
    runner.providerExecutor((provider, event, ...data) => {
      const providerInstance = new provider()
      return providerInstance[event](...data.concat('via executor'))
    })
    await runner.run('before save')

    assert.deepEqual(stack, ['before save', 'via executor'])
  })
})
