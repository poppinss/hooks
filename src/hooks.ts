/*
 * @poppinss/hooks
 *
 * (c) Poppinss
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Runner } from './runner.js'
import { HookHandler } from './types.js'

/**
 * Quite simple implementation register lifecycle hooks around specific events.
 *
 * ```ts
 * const hooks = new Hooks()
 *
 * hooks.add('saving', function hashPassword(entity) {
 * })
 * ```
 */
export class Hooks<
  Types extends {
    KnownEvents: string
    HookArgs: any[]
    CleanUpArgs: any[]
  }
> {
  /**
   * A collection of registered hooks
   */
  #hooks: Map<Types['KnownEvents'], Set<HookHandler<Types['HookArgs'], Types['CleanUpArgs']>>> =
    new Map()

  /**
   * Get access to all the registered hooks. The return value is
   * a map of the event name and a set of handlers.
   */
  all() {
    return this.#hooks
  }

  /**
   * Find if a handler for a given event exists.
   */
  has(
    event: Types['KnownEvents'],
    handler: HookHandler<Types['HookArgs'], Types['CleanUpArgs']>
  ): boolean {
    const handlers = this.#hooks.get(event)
    if (!handlers) {
      return false
    }

    return handlers.has(handler)
  }

  /**
   * Add a hook handler for a given event. Adding the same handler twice will
   * result in a noop.
   */
  add(
    event: Types['KnownEvents'],
    handler: HookHandler<Types['HookArgs'], Types['CleanUpArgs']>
  ): this {
    const handlers = this.#hooks.get(event)

    /**
     * Instantiate handlers
     */
    if (!handlers) {
      this.#hooks.set(event, new Set())
    }

    this.#hooks.get(event)!.add(handler)
    return this
  }

  /**
   * Remove hook handler for a given event.
   */
  remove(
    event: Types['KnownEvents'],
    handler: HookHandler<Types['HookArgs'], Types['CleanUpArgs']>
  ): boolean {
    const handlers = this.#hooks.get(event)
    if (!handlers) {
      return false
    }

    return handlers.delete(handler)
  }

  /**
   * Clear all the hooks for a specific event or all the
   * events.
   */
  clear(event?: Types['KnownEvents']): void {
    if (!event) {
      this.#hooks.clear()
      return
    }

    this.#hooks.delete(event)
  }

  /**
   * Merge hooks from an existing hooks instance.
   */
  merge(hooks: Hooks<Types>) {
    hooks.all().forEach((actionHooks, action) => {
      actionHooks.forEach((handler) => {
        this.add(action, handler)
      })
    })
  }

  /**
   * Returns an instance of the runner to run hooks
   */
  runner(action: Types['KnownEvents']): Runner<Types['HookArgs'], Types['CleanUpArgs']> {
    return new Runner(this.#hooks.get(action))
  }
}
