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

test.group('Runner', () => {
  test('execute hooks handlers', async ({ assert }) => {
    const hooks = new Hooks()
    const stack: string[] = []

    function beforeSave() {
      stack.push('before save')
    }
    hooks.add('save', beforeSave)

    function beforeSave1() {
      stack.push('before save 1')
    }
    hooks.add('save', beforeSave1)

    const runner = hooks.runner('save')
    await runner.run()

    assert.deepEqual(stack, ['before save', 'before save 1'])
  })

  test('ensure runner.run is idempotent', async ({ assert }) => {
    const hooks = new Hooks()
    const stack: string[] = []

    function beforeSave() {
      stack.push('before save')
    }
    hooks.add('save', beforeSave)

    function beforeSave1() {
      stack.push('before save 1')
    }
    hooks.add('save', beforeSave1)

    const runner = hooks.runner('save')
    await runner.run()
    await runner.run()
    await runner.run()
    await runner.run()

    assert.deepEqual(stack, ['before save', 'before save 1'])
  })

  test('execute async hooks in sequence', async ({ assert }) => {
    const hooks = new Hooks()
    const stack: string[] = []

    function beforeSave() {
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          stack.push('before save')
          resolve()
        }, 100)
      })
    }
    hooks.add('save', beforeSave)

    function beforeSave1() {
      stack.push('before save 1')
    }
    hooks.add('save', beforeSave1)

    const runner = hooks.runner('save')
    await runner.run()

    assert.deepEqual(stack, ['before save', 'before save 1'])
  })

  test('execute arrow functions defined as hook handlers', async ({ assert }) => {
    const hooks = new Hooks()
    const stack: string[] = []

    hooks.add('save', () => {
      stack.push('before save')
    })
    hooks.add('save', () => {
      stack.push('before save 1')
    })

    const runner = hooks.runner('save')
    await runner.run()

    assert.deepEqual(stack, ['before save', 'before save 1'])
  })

  test('pass data to hook handlers', async ({ assert }) => {
    const hooks = new Hooks()
    const stack: string[] = []

    hooks.add('save', (message: string) => {
      stack.push(message)
    })
    hooks.add('save', (message: string) => {
      stack.push(message)
    })

    const runner = hooks.runner('save')
    await runner.run('hello world')

    assert.deepEqual(stack, ['hello world', 'hello world'])
  })

  test('filter hooks by name', async ({ assert }) => {
    const hooks = new Hooks()
    const stack: string[] = []

    function beforeSave() {
      stack.push('before save')
    }
    hooks.add('save', beforeSave)

    function beforeSave1() {
      stack.push('before save 1')
    }
    hooks.add('save', beforeSave1)

    const runner = hooks.runner('save')
    await runner.without(['beforeSave1']).run()

    assert.deepEqual(stack, ['before save'])
  })

  test('skip all hooks', async ({ assert }) => {
    const hooks = new Hooks()
    const stack: string[] = []

    function beforeSave() {
      stack.push('before save')
    }
    hooks.add('save', beforeSave)

    function beforeSave1() {
      stack.push('before save 1')
    }
    hooks.add('save', beforeSave1)

    const runner = hooks.runner('save')
    await runner.without().run()

    assert.deepEqual(stack, [])
  })

  test('run object based hooks', async ({ assert }) => {
    const hooks = new Hooks()
    let stack: string[] = []

    function beforeSave(...args: string[]) {
      stack = stack.concat(args)
    }
    hooks.add('save', {
      name: 'beforeSave',
      handle(_, ...args: string[]) {
        return beforeSave(...args.concat(['via executor']))
      },
    })

    function beforeSave1(...args: string[]) {
      stack = stack.concat(args)
    }
    hooks.add('save', {
      name: 'beforeSave1',
      handle(_, ...args: string[]) {
        return beforeSave1(...args.concat(['via executor']))
      },
    })

    const runner = hooks.runner('save')
    await runner.run('before save')

    assert.deepEqual(stack, ['before save', 'via executor', 'before save', 'via executor'])
  })

  test('filter hooks by explicit name', async ({ assert }) => {
    const hooks = new Hooks()
    const stack: string[] = []

    const beforeSave = {
      name: 'models.beforeSave',
      handle() {
        stack.push('before save')
      },
    }
    hooks.add('save', beforeSave)

    const beforeSave1 = {
      name: 'models.beforeSave1',
      handle() {
        stack.push('before save 1')
      },
    }
    hooks.add('save', beforeSave1)

    const runner = hooks.runner('save')
    await runner.without(['models.beforeSave1']).run()

    assert.deepEqual(stack, ['before save'])
  })

  test('work fine when there are no hook handlers', async ({ assert }) => {
    const hooks = new Hooks()
    const stack: string[] = []

    const runner = hooks.runner('save')
    await runner.run()

    assert.deepEqual(stack, [])
  })
})
