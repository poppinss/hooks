/*
 * @poppinss/hooks
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

import { IocResolverContract, IocResolverLookupNode } from '@adonisjs/fold'

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
  private _hooks: {
    before: Map<string, Set<HooksHandler | IocResolverLookupNode>>,
    after: Map<string, Set<HooksHandler | IocResolverLookupNode>>,
  } = {
    before: new Map(),
    after: new Map(),
  }

  constructor (private _resolver?: IocResolverContract) {
  }

  /**
   * Resolves the hook handler using the resolver when it is defined as string
   * or returns the function reference back
   */
  private _resolveHandler (handler: HooksHandler | string): HooksHandler | IocResolverLookupNode {
    if (typeof (handler) === 'string' && !this._resolver) {
      throw new Error('Cannot register string based hooks handlers without ioc resolver')
    }

    if (typeof (handler) === 'string') {
      return this._resolver!.resolve(handler)
    }

    return handler
  }

  /**
   * Register hook handler for a given event and lifecycle
   */
  public add (lifecycle: 'before' | 'after', action: string, handler: HooksHandler | string): this {
    const handlers = this._hooks[lifecycle].get(action)
    const resolvedHandler = this._resolveHandler(handler)

    if (handlers) {
      handlers.add(resolvedHandler)
    } else {
      this._hooks[lifecycle].set(action, new Set([resolvedHandler]))
    }

    return this
  }

  /**
   * Remove a pre-registered handler
   */
  public remove (lifecycle: 'before' | 'after', action: string, handler: HooksHandler | string): void {
    const handlers = this._hooks[lifecycle].get(action)
    if (!handlers) {
      return
    }

    const resolvedHandler = this._resolveHandler(handler)
    handlers.delete(resolvedHandler)
  }

  /**
   * Remove a pre-registered handler
   */
  public clear (lifecycle: 'before' | 'after', action?: string): void {
    if (!action) {
      this._hooks[lifecycle].clear()
      return
    }

    this._hooks[lifecycle].delete(action)
  }

  /**
   * Executes the hook handler for a given action and lifecycle
   */
  public async exec (lifecycle: 'before' | 'after', action: string, ...data: any[]): Promise<void> {
    const handlers = this._hooks[lifecycle].get(action)
    if (!handlers) {
      return
    }

    for (let handler of handlers) {
      if (typeof (handler) === 'function') {
        await handler(...data)
      } else {
        await this._resolver!.call(handler, undefined, data)
      }
    }
  }
}
