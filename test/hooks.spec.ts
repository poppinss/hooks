/*
 * @poppinss/hooks
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import test from 'japa'
import { Hooks } from '../src/Hooks'

test.group('Manage hooks', () => {
  test('add hooks for a given action', (assert) => {
    const hooks = new Hooks()

    function beforeSave() {}
    hooks.add('save', beforeSave)

    assert.deepEqual(hooks.all(), new Map([['save', new Set([beforeSave])]]))
    assert.isTrue(hooks.has('save', beforeSave))
  })

  test('remove hook', (assert) => {
    const hooks = new Hooks()

    function beforeSave() {}
    hooks.add('save', beforeSave)

    assert.deepEqual(hooks.all(), new Map([['save', new Set([beforeSave])]]))
    assert.isTrue(hooks.has('save', beforeSave))

    hooks.remove('save', beforeSave)

    assert.isFalse(hooks.has('save', beforeSave))
    assert.deepEqual(hooks.all(), new Map([['save', new Set()]]))
  })

  test('remove all hooks', (assert) => {
    const hooks = new Hooks()

    function beforeSave() {}
    hooks.add('save', beforeSave)

    assert.deepEqual(hooks.all(), new Map([['save', new Set([beforeSave])]]))
    assert.isTrue(hooks.has('save', beforeSave))

    hooks.clear('save')

    assert.isFalse(hooks.has('save', beforeSave))
    assert.deepEqual(hooks.all(), new Map([]))

    hooks.clear()
    assert.deepEqual(hooks.all(), new Map([]))
  })

  test('merge hooks from one hooks instance', (assert) => {
    const hooks = new Hooks()

    function beforeSave() {}
    hooks.add('save', beforeSave)

    const hooks1 = new Hooks()
    hooks1.merge(hooks)

    assert.deepEqual(hooks.all(), new Map([['save', new Set([beforeSave])]]))
    assert.deepEqual(hooks1.all(), new Map([['save', new Set([beforeSave])]]))
  })

  test('merge hooks over existing hooks', (assert) => {
    const hooks = new Hooks()

    function beforeSave() {}
    hooks.add('save', beforeSave)

    const hooks1 = new Hooks()

    function beforeCreate() {}
    hooks1.add('create', beforeCreate)
    hooks1.merge(hooks)

    assert.deepEqual(hooks.all(), new Map([['save', new Set([beforeSave])]]))
    assert.deepEqual(
      hooks1.all(),
      new Map([
        ['create', new Set([beforeCreate])],
        ['save', new Set([beforeSave])],
      ])
    )
  })
})

test.group('Run hooks', () => {
  test('run added hooks in sequence', async (assert) => {
    const stack: string[] = []
    const hooks = new Hooks()

    function beforeSave(): Promise<void> {
      return new Promise((resolve) => {
        stack.push('one')
        setTimeout(resolve, 100)
      })
    }

    function beforeSaveOne() {
      stack.push('two')
    }

    hooks.add('save', beforeSave)
    hooks.add('save', beforeSaveOne)

    await hooks.runner('save').run()
    assert.deepEqual(stack, ['one', 'two'])
  })

  test('run anonymous functions as hooks', async (assert) => {
    const stack: string[] = []
    const hooks = new Hooks()

    hooks.add('save', () => {
      return new Promise((resolve) => {
        stack.push('one')
        setTimeout(resolve, 100)
      })
    })

    hooks.add('save', () => {
      stack.push('two')
    })

    await hooks.runner('save').run()
    assert.deepEqual(stack, ['one', 'two'])
  })

  test('pass one or more arguments to the hook handler', async (assert) => {
    const stack: string[] = []
    const hooks = new Hooks()

    function beforeSave(arg1, arg2): Promise<void> {
      return new Promise((resolve) => {
        stack.push(arg1)
        stack.push(arg2)
        setTimeout(resolve, 100)
      })
    }

    function beforeSaveOne(arg1, arg2) {
      stack.push(arg1)
      stack.push(arg2)
    }

    hooks.add('save', beforeSave)
    hooks.add('save', beforeSaveOne)

    await hooks.runner('save').run('foo', 'bar')
    assert.deepEqual(stack, ['foo', 'bar', 'foo', 'bar'])
  })

  test('pass array to hook handler', async (assert) => {
    let stack: string[] = []
    const hooks = new Hooks()

    function beforeSave(arg1): Promise<void> {
      return new Promise((resolve) => {
        stack = stack.concat(arg1)
        setTimeout(resolve, 100)
      })
    }

    function beforeSaveOne(arg1) {
      stack = stack.concat(arg1)
    }

    hooks.add('save', beforeSave)
    hooks.add('save', beforeSaveOne)

    await hooks.runner('save').run(['foo', 'bar'])
    assert.deepEqual(stack, ['foo', 'bar', 'foo', 'bar'])
  })

  test('run without specific hooks', async (assert) => {
    const stack: string[] = []
    const hooks = new Hooks()

    function beforeSave(): Promise<void> {
      return new Promise((resolve) => {
        stack.push('one')
        setTimeout(resolve, 100)
      })
    }

    function beforeSaveOne() {
      stack.push('two')
    }

    hooks.add('save', beforeSave)
    hooks.add('save', beforeSaveOne)

    await hooks.runner('save', ['beforeSaveOne']).run()
    assert.deepEqual(stack, ['one'])
  })

  test('run cleanup functions', async (assert) => {
    const stack: string[] = []
    const hooks = new Hooks()

    hooks.add('save', () => {
      stack.push('one')
      return async () => {
        stack.push('four')
      }
    })

    hooks.add('save', () => {
      stack.push('two')
      return async () => {
        stack.push('three')
      }
    })

    const runner = hooks.runner('save')
    await runner.run()
    await runner.cleanup()
    assert.deepEqual(stack, ['one', 'two', 'three', 'four'])
  })

  test('run cleanup functions even when there is a failure', async (assert) => {
    assert.plan(2)

    const stack: string[] = []
    const hooks = new Hooks()

    hooks.add('save', () => {
      stack.push('one')
      return () => {
        stack.push('three')
      }
    })

    hooks.add('save', () => {
      throw new Error('boom')
    })

    const runner = hooks.runner('save')
    try {
      await runner.run()
    } catch (error) {
      assert.equal(error.message, 'boom')
    }

    await runner.cleanup()
    assert.deepEqual(stack, ['one', 'three'])
  })
})
