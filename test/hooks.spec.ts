/*
 * @poppinss/hooks
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import test from 'japa'
import { Ioc } from '@adonisjs/fold'
import { Hooks } from '../src/Hooks'

test.group('Hooks', () => {
	test('add hooks for a given lifecycle', (assert) => {
		const hooks = new Hooks()

		function beforeSave() {}
		hooks.add('before', 'save', beforeSave)

		assert.deepEqual(hooks['hooks'].before.get('save'), new Set([beforeSave]))
	})

	test('execute added hooks in sequence', async (assert) => {
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

		hooks.add('before', 'save', beforeSave)
		hooks.add('before', 'save', beforeSaveOne)

		await hooks.exec('before', 'save', 'foo')
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

		hooks.add('before', 'save', beforeSave)
		hooks.add('before', 'save', beforeSaveOne)

		await hooks.exec('before', 'save', 'foo', 'bar')
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

		hooks.add('before', 'save', beforeSave)
		hooks.add('before', 'save', beforeSaveOne)

		await hooks.exec('before', 'save', ['foo', 'bar'])
		assert.deepEqual(stack, ['foo', 'bar', 'foo', 'bar'])
	})

	test('remove hook handler by reference', async (assert) => {
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

		hooks.add('before', 'save', beforeSave)
		hooks.add('before', 'save', beforeSaveOne)
		hooks.remove('before', 'save', beforeSaveOne)

		await hooks.exec('before', 'save', ['foo', 'bar'])
		assert.deepEqual(stack, ['foo', 'bar'])
	})

	test('clear all hooks for a given action', async (assert) => {
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

		hooks.add('before', 'save', beforeSave)
		hooks.add('before', 'save', beforeSaveOne)
		hooks.clear('before', 'save')

		await hooks.exec('before', 'save', ['foo', 'bar'])
		assert.deepEqual(stack, [])
	})

	test('clear all hooks for a given event', async (assert) => {
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

		hooks.add('before', 'save', beforeSave)
		hooks.add('before', 'save', beforeSaveOne)
		hooks.clear('before')

		await hooks.exec('before', 'save', ['foo', 'bar'])
		assert.deepEqual(stack, [])
	})

	test('find if a hook already exists', async (assert) => {
		const stack: string[] = []
		const hooks = new Hooks()

		function beforeSave(): Promise<void> {
			return new Promise((resolve) => {
				stack.push('one')
				setTimeout(resolve, 100)
			})
		}

		hooks.add('before', 'save', beforeSave)
		assert.isTrue(hooks.has('before', 'save', beforeSave))
	})

	test('merge hooks from one hooks instance', (assert) => {
		const hooks = new Hooks()

		function beforeSave() {}
		hooks.add('before', 'save', beforeSave)

		const hooks1 = new Hooks()
		hooks1.merge(hooks)

		assert.deepEqual(hooks1['hooks'].before, new Map([['save', new Set([beforeSave])]]))
		assert.deepEqual(hooks1['hooks'].after, new Map())
	})

	test('merge hooks over existing hooks', (assert) => {
		const hooks = new Hooks()

		function beforeSave() {}
		hooks.add('before', 'save', beforeSave)

		const hooks1 = new Hooks()

		function beforeCreate() {}
		hooks1.add('before', 'create', beforeCreate)
		hooks1.merge(hooks)

		assert.deepEqual(
			hooks1['hooks'].before,
			new Map([
				['save', new Set([beforeSave])],
				['create', new Set([beforeCreate])],
			])
		)

		assert.deepEqual(hooks['hooks'].before, new Map([['save', new Set([beforeSave])]]))

		assert.deepEqual(hooks1['hooks'].after, new Map())
		assert.deepEqual(hooks['hooks'].after, new Map())
	})
})

test.group('Hooks | Ioc Resolver', () => {
	test('raise error when passing string as a reference with ioc resolver', (assert) => {
		const hooks = new Hooks()

		const fn = () => hooks.add('before', 'save', 'User.beforeSave')
		assert.throw(fn, 'IoC container resolver is required to register string based hooks handlers')
	})

	test('register ioc container references as hooks', async (assert) => {
		const stack: string[] = []

		const ioc = new Ioc()
		ioc.bind('User', () => {
			return {
				save() {
					stack.push(String(stack.length + 1))
				},
			}
		})

		const hooks = new Hooks(ioc.getResolver())

		hooks.add('before', 'save', 'User.save')
		await hooks.exec('before', 'save', 'foo')
		assert.deepEqual(stack, ['1'])
	})

	test('pass one or more arguments to the hook handler', async (assert) => {
		const stack: string[] = []

		const ioc = new Ioc()
		ioc.bind('User', () => {
			return {
				save(arg1, arg2) {
					stack.push(arg1)
					stack.push(arg2)
				},
			}
		})

		const hooks = new Hooks(ioc.getResolver())
		hooks.add('before', 'save', 'User.save')

		await hooks.exec('before', 'save', 'foo', 'bar')
		assert.deepEqual(stack, ['foo', 'bar'])
	})

	test('pass array to hook handler', async (assert) => {
		let stack: string[] = []

		const ioc = new Ioc()
		ioc.bind('User', () => {
			return {
				save(arg1) {
					stack = stack.concat(arg1)
				},
			}
		})

		const hooks = new Hooks(ioc.getResolver())
		hooks.add('before', 'save', 'User.save')

		await hooks.exec('before', 'save', ['foo', 'bar'])
		assert.deepEqual(stack, ['foo', 'bar'])
	})

	test('remove hook handler by reference', async (assert) => {
		let stack: string[] = []
		const ioc = new Ioc()
		ioc.bind('User', () => {
			return {
				save(arg1) {
					stack = stack.concat(arg1)
				},
			}
		})

		const hooks = new Hooks(ioc.getResolver())
		hooks.add('before', 'save', 'User.save')
		hooks.remove('before', 'save', 'User.save')

		await hooks.exec('before', 'save', ['foo', 'bar'])
		assert.deepEqual(stack, [])
	})

	test('find if ioc container reference hook already exists', async (assert) => {
		const stack: string[] = []

		const ioc = new Ioc()
		ioc.bind('User', () => {
			return {
				save() {
					stack.push(String(stack.length + 1))
				},
			}
		})

		const hooks = new Hooks(ioc.getResolver())

		hooks.add('before', 'save', 'User.save')
		assert.isTrue(hooks.has('before', 'save', 'User.save'))
	})

	test('merge hooks from one hooks instance', async (assert) => {
		const stack: string[] = []

		const ioc = new Ioc()
		ioc.bind('User', () => {
			return {
				save() {
					stack.push(String(stack.length + 1))
				},
			}
		})

		const hooks = new Hooks(ioc.getResolver())
		hooks.add('before', 'save', 'User.save')

		const hooks1 = new Hooks(ioc.getResolver())
		hooks1.merge(hooks)

		await hooks1.exec('before', 'save', 'foo')
		await hooks.exec('before', 'save', 'foo')
		assert.deepEqual(stack, ['1', '2'])
	})

	test('merge hooks over existing hooks', async (assert) => {
		const stack: string[] = []

		const ioc = new Ioc()
		ioc.bind('User', () => {
			return {
				save() {
					stack.push(String(stack.length + 1))
				},
			}
		})

		const hooks = new Hooks(ioc.getResolver())
		hooks.add('before', 'save', 'User.save')

		const hooks1 = new Hooks(ioc.getResolver())
		hooks1.add('before', 'create', 'User.save')
		hooks1.merge(hooks)

		await hooks1.exec('before', 'save', 'foo')
		await hooks1.exec('before', 'create', 'foo')

		await hooks.exec('before', 'save', 'foo')
		await hooks.exec('before', 'create', 'foo')
		assert.deepEqual(stack, ['1', '2', '3'])
	})
})
