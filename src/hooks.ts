/*
 * @poppinss/hooks
 *
 * (c) Poppinss
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Runner } from './runner.js'
import { HookHandler, HookProvider } from './types.js'

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
export class Hooks<Events extends Record<string, [any[], any[]]>> {
  /**
   * A collection of registered hooks
   */
  #hooks: {
    [Event in keyof Events]: Map<Event, Set<HookHandler<Events[Event][0], Events[Event][1]>>>
  }[keyof Events] = new Map()

  /**
   * Collection of hook providers.
   * Hook provider are classes with methods as the event name
   */
  #hookProviders: Set<HookProvider> = new Set()

  /**
   * Get access to all the registered hooks. The return value is
   * a map of the event name and a set of handlers.
   */
  all() {
    return this.#hooks
  }

  /**
   * Get access to all the registered providers. The return value is
   * a set of providers
   */
  providers() {
    return this.#hookProviders
  }

  /**
   * Find if a handler for a given event exists.
   */
  has<Event extends keyof Events>(
    event: Event,
    handler: HookHandler<Events[Event][0], Events[Event][1]>
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
  add<Event extends keyof Events>(
    event: Event,
    handler: HookHandler<Events[Event][0], Events[Event][1]>
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
  remove<Event extends keyof Events>(
    event: Event,
    handler: HookHandler<Events[Event][0], Events[Event][1]>
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
  clear(event?: keyof Events): void {
    if (!event) {
      this.#hooks.clear()
      return
    }

    this.#hooks.delete(event)
  }

  /**
   * Register a custom hook provider. Adding the same provider twice will
   * result in a noop.
   */
  provider(provider: HookProvider): this {
    this.#hookProviders.add(provider)
    return this
  }

  /**
   * Find if a given provider has already been registered or not
   */
  hasProvider(provider: HookProvider): boolean {
    return this.#hookProviders.has(provider)
  }

  /**
   * Remove provider
   */
  removeProvider(provider: HookProvider): boolean {
    return this.#hookProviders.delete(provider)
  }

  /**
   * Merge hooks from an existing hooks instance.
   */
  merge(hooks: Hooks<Events>) {
    hooks.all().forEach((actionHooks, action) => {
      actionHooks.forEach((handler) => {
        this.add(action, handler)
      })
    })

    hooks.providers().forEach((provider) => {
      this.provider(provider)
    })
  }

  /**
   * Returns an instance of the runner to run hooks
   */
  runner<Event extends Extract<keyof Events, string>>(
    action: Event
  ): Runner<Events[Event][0], Events[Event][1]> {
    return new Runner(action, this.#hookProviders, this.#hooks.get(action))
  }
}
