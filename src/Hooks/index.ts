/*
 * @poppinss/hooks
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Runner } from '../Runner'
import { HooksHandler } from '../Contracts'

/**
 * Exposes the API for registering hooks for a given lifecycle action.
 *
 * @example
 * const hooks = new Hooks()
 * hooks.add('onCreate', function () {
 *  doSomething
 * })
 */
export class Hooks {
  /**
   * Pre-resolved registered hooks
   */
  private hooks: Map<string, Set<HooksHandler>> = new Map()

  /**
   * Add handler to the actions map
   */
  private addHandler(action: string, handler: HooksHandler) {
    const handlers = this.hooks.get(action)
    if (!handlers) {
      this.hooks.set(action, new Set())
    }

    this.hooks.get(action)!.add(handler)
  }

  /**
   * Returns a map of registered hooks
   */
  public all() {
    return this.hooks
  }

  /**
   * Returns true when a handler has already been registered
   */
  public has(action: string, handler: HooksHandler): boolean {
    const handlers = this.hooks.get(action)
    if (!handlers) {
      return false
    }

    return handlers.has(handler)
  }

  /**
   * Register handler for a given action
   */
  public add(action: string, handler: HooksHandler): this {
    this.addHandler(action, handler)
    return this
  }

  /**
   * Remove a pre-registered handler
   */
  public remove(action: string, handler: HooksHandler): void {
    const handlers = this.hooks.get(action)
    if (!handlers) {
      return
    }

    handlers.delete(handler)
  }

  /**
   * Remove all handlers for a given action. If action is not
   * defined, then all actions are removed.
   */
  public clear(action?: string): void {
    if (!action) {
      this.hooks.clear()
      return
    }

    this.hooks.delete(action)
  }

  /**
   * Merge pre-resolved hooks from an existing
   * hooks instance
   */
  public merge(hooks: Hooks) {
    hooks.all().forEach((actionHooks, action) => {
      actionHooks.forEach((handler) => {
        this.add(action, handler)
      })
    })
  }

  /**
   * Returns an instance of hooks runner. Optionally, a few hooks can be disabled.
   */
  public runner(action: string, withoutHooks?: string[]): Runner {
    return new Runner(this.hooks.get(action), withoutHooks)
  }
}
