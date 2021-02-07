/*
 * @poppinss/hooks
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { ApplicationContract, IocResolverLookupNode } from '@ioc:Adonis/Core/Application'

type HooksHandler = (...args: any[]) => void | Promise<void>

/**
 * Exposes the API to register before/after lifecycle hooks for a given action
 * with option to resolve handlers from the IoC container.
 *
 * The hooks class doesn't provide autocomplete for actions and the arguments
 * the handler will receive, since we expect this class to be used internally
 * for user facing objects.
 */
export class Hooks {
  private hooks: {
    before: Map<string, Set<HooksHandler | IocResolverLookupNode<any>>>
    after: Map<string, Set<HooksHandler | IocResolverLookupNode<any>>>
  } = {
    before: new Map(),
    after: new Map(),
  }

  constructor(private resolver?: ReturnType<ApplicationContract['container']['getResolver']>) {}

  /**
   * Raise exceptins when resolver is not defined
   */
  private ensureResolver() {
    if (!this.resolver) {
      throw new Error('IoC container resolver is required to register string based hooks handlers')
    }
  }

  /**
   * Resolves the hook handler using the resolver when it is defined as string
   * or returns the function reference back
   */
  private resolveHandler(
    handler: HooksHandler | string
  ): HooksHandler | IocResolverLookupNode<any> {
    if (typeof handler === 'string') {
      this.ensureResolver()
      return this.resolver!.resolve(handler)
    }

    return handler
  }

  /**
   * Returns handlers set for a given action or undefined
   */
  private getActionHandlers(lifecycle: 'before' | 'after', action: string) {
    return this.hooks[lifecycle].get(action)
  }

  /**
   * Adds the resolved handler to the actions set
   */
  private addResolvedHandler(
    lifecycle: 'before' | 'after',
    action: string,
    handler: HooksHandler | IocResolverLookupNode<any>
  ) {
    const handlers = this.getActionHandlers(lifecycle, action)

    if (handlers) {
      handlers.add(handler)
    } else {
      this.hooks[lifecycle].set(action, new Set([handler]))
    }
  }

  /**
   * Returns a boolean whether a handler has been already registered or not
   */
  public has(
    lifecycle: 'before' | 'after',
    action: string,
    handler: HooksHandler | string
  ): boolean {
    const handlers = this.getActionHandlers(lifecycle, action)
    if (!handlers) {
      return false
    }

    return handlers.has(this.resolveHandler(handler))
  }

  /**
   * Register hook handler for a given event and lifecycle
   */
  public add(lifecycle: 'before' | 'after', action: string, handler: HooksHandler | string): this {
    this.addResolvedHandler(lifecycle, action, this.resolveHandler(handler))
    return this
  }

  /**
   * Remove a pre-registered handler
   */
  public remove(
    lifecycle: 'before' | 'after',
    action: string,
    handler: HooksHandler | string
  ): void {
    const handlers = this.getActionHandlers(lifecycle, action)
    if (!handlers) {
      return
    }

    handlers.delete(this.resolveHandler(handler))
  }

  /**
   * Remove all handlers for a given action or lifecycle. If action is not
   * defined, then all actions for that given lifecycle are removed
   */
  public clear(lifecycle: 'before' | 'after', action?: string): void {
    if (!action) {
      this.hooks[lifecycle].clear()
      return
    }

    this.hooks[lifecycle].delete(action)
  }

  /**
   * Merges hooks of a given hook instance. To merge from more than
   * one instance, you can call the merge method for multiple times
   */
  public merge(hooks: Hooks) {
    hooks.hooks.before.forEach((actionHooks, action) => {
      actionHooks.forEach((handler) => {
        this.addResolvedHandler('before', action, handler)
      })
    })

    hooks.hooks.after.forEach((actionHooks, action) => {
      actionHooks.forEach((handler) => {
        this.addResolvedHandler('after', action, handler)
      })
    })
  }

  /**
   * Executes the hook handler for a given action and lifecycle
   */
  public async exec(lifecycle: 'before' | 'after', action: string, ...data: any[]): Promise<void> {
    const handlers = this.getActionHandlers(lifecycle, action)
    if (!handlers) {
      return
    }

    for (let handler of handlers) {
      if (typeof handler === 'function') {
        await handler(...data)
      } else {
        await this.resolver!.call(handler, undefined, data)
      }
    }
  }
}
