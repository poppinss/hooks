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

test.group('Hooks', () => {
  test('add hook for a given event', ({ assert }) => {
    const hooks = new Hooks()

    function beforeSave() {}
    hooks.add('save', beforeSave)

    assert.deepEqual(hooks.all(), new Map([['save', new Set([beforeSave])]]))
    assert.isTrue(hooks.has('save', beforeSave))
  })

  test('add multiple hooks for a given event', ({ assert }) => {
    const hooks = new Hooks()

    function beforeSave() {}
    hooks.add('save', beforeSave)

    function beforeSave1() {}
    hooks.add('save', beforeSave1)

    assert.deepEqual(hooks.all(), new Map([['save', new Set([beforeSave, beforeSave1])]]))
    assert.isTrue(hooks.has('save', beforeSave))
    assert.isTrue(hooks.has('save', beforeSave1))
  })

  test('attempt to remove hook handler without registering it', ({ assert }) => {
    const hooks = new Hooks()

    function beforeSave() {}
    hooks.remove('save', beforeSave)
    assert.deepEqual(hooks.all(), new Map([]))
  })

  test('remove a specific hook handler', ({ assert }) => {
    const hooks = new Hooks()

    function beforeSave() {}
    hooks.add('save', beforeSave)

    function beforeSave1() {}
    hooks.add('save', beforeSave1)

    assert.deepEqual(hooks.all(), new Map([['save', new Set([beforeSave, beforeSave1])]]))
    assert.isTrue(hooks.has('save', beforeSave))
    assert.isTrue(hooks.has('save', beforeSave1))

    hooks.remove('save', beforeSave)

    assert.isFalse(hooks.has('save', beforeSave))
    assert.isTrue(hooks.has('save', beforeSave1))
    assert.deepEqual(hooks.all(), new Map([['save', new Set([beforeSave1])]]))
  })

  test('clear hook handlers for a specific event', ({ assert }) => {
    const hooks = new Hooks()

    function beforeSave() {}
    hooks.add('save', beforeSave)

    function beforeSave1() {}
    hooks.add('save', beforeSave1)

    assert.deepEqual(hooks.all(), new Map([['save', new Set([beforeSave, beforeSave1])]]))
    assert.isTrue(hooks.has('save', beforeSave))
    assert.isTrue(hooks.has('save', beforeSave1))

    hooks.clear('save')

    assert.isFalse(hooks.has('save', beforeSave))
    assert.isFalse(hooks.has('save', beforeSave1))
    assert.deepEqual(hooks.all(), new Map([]))
  })

  test('clear hook handlers for all events', ({ assert }) => {
    const hooks = new Hooks()

    function beforeSave() {}
    hooks.add('save', beforeSave)

    function beforeCreate() {}
    hooks.add('create', beforeCreate)

    assert.deepEqual(
      hooks.all(),
      new Map([
        ['save', new Set([beforeSave])],
        ['create', new Set([beforeCreate])],
      ])
    )

    assert.isTrue(hooks.has('save', beforeSave))
    assert.isTrue(hooks.has('create', beforeCreate))

    hooks.clear()

    assert.isFalse(hooks.has('save', beforeSave))
    assert.isFalse(hooks.has('create', beforeCreate))
    assert.deepEqual(hooks.all(), new Map([]))
  })

  test('merge hooks from one hooks instance', ({ assert }) => {
    const hooks = new Hooks()

    function beforeSave() {}
    hooks.add('save', beforeSave)

    const hooks1 = new Hooks()
    hooks1.merge(hooks)

    assert.deepEqual(hooks.all(), new Map([['save', new Set([beforeSave])]]))
    assert.deepEqual(hooks1.all(), new Map([['save', new Set([beforeSave])]]))
  })

  test('merge hooks over existing hooks', ({ assert }) => {
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

  test('assert hook handler types', () => {
    const hooks = new Hooks<{
      save: [[string, number], []]
    }>()

    // @ts-expect-error
    hooks.add('save', (_: string, __: string) => {})

    // @ts-expect-error
    hooks.add('create', () => {})
  })
})
