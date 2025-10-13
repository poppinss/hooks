/*
 * @poppinss/hooks
 *
 * (c) Poppinss
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { debuglog } from 'node:util'
import { type HookHandler, type CleanupHandler, type HookHandlerProvider } from './types.js'

const debug = debuglog('poppinss:hooks')

/**
 * Runner allows running a set of specific hook handlers for a given
 * event. You can grab the instance of the runner using the "hook.runner" method.
 *
 * ```ts
 * const hooks = new Hooks()
 *
 * await hooks.runner('saving').run()
 * ```
 */
export class Runner<HookArgs extends any[], CleanUpArgs extends any[]> {
  /**
   * A collection of registered hook handlers
   */
  #hookHandlers: Set<
    HookHandler<HookArgs, CleanUpArgs> | HookHandlerProvider<HookArgs, CleanUpArgs>
  >

  /**
   * Cleanup handlers should always be an array of functions. Using a set will
   * discard duplicates and it is very much possible for two hooks to return
   * a shared cleanup handler.
   */
  #cleanupHandlers: CleanupHandler<CleanUpArgs>[] = []

  /**
   * State to perform the cleanup
   */
  #state: 'idle' | 'cleanup_pending' | 'cleanup_initiated' | 'cleanup_completed' = 'idle'

  /**
   * A collection of handlers to ignore when executed them
   */
  #handlersToIgnore: string[] = []

  /**
   * Whether or not to skip all the hooks
   */
  #skipAllHooks: boolean = false

  /**
   * Find if cleanup is pending or not
   *
   * @example
   * ```ts
   * const runner = hooks.runner('saving')
   * await runner.run()
   *
   * if (runner.isCleanupPending) {
   *   await runner.cleanup()
   * }
   * ```
   */
  get isCleanupPending() {
    return this.#state === 'cleanup_pending'
  }

  /**
   * Create a new Runner instance
   *
   * @param action - The name of the event/action this runner handles
   * @param hookHandlers - Optional set of hook handlers to initialize with
   *
   * @example
   * ```ts
   * const runner = new Runner('saving', new Set([handler1, handler2]))
   * ```
   */
  constructor(
    public action: string,
    hookHandlers?: Set<
      HookHandler<HookArgs, CleanUpArgs> | HookHandlerProvider<HookArgs, CleanUpArgs>
    >
  ) {
    this.#hookHandlers = hookHandlers || new Set()
  }

  /**
   * Filter to check if we should run the handler
   *
   * @param handlerName - The name of the handler to check
   */
  #filter(handlerName: string): boolean {
    return !this.#handlersToIgnore.includes(handlerName)
  }

  /**
   * Ignore specific or all hook handlers. Calling this
   * method multiple times will result in overwriting
   * the existing state.
   *
   * @param handlersToIgnore - Array of handler names to ignore, or undefined to skip all hooks
   *
   * @example
   * ```ts
   * // Skip specific handlers
   * runner.without(['hashPassword', 'validateEmail']).run()
   *
   * // Skip all handlers
   * runner.without().run()
   * ```
   */
  without(handlersToIgnore?: string[]): this {
    if (!handlersToIgnore) {
      debug('skipping all hooks')
      this.#skipAllHooks = true
    } else {
      this.#skipAllHooks = false
      debug('skipping %O hooks', handlersToIgnore)
      this.#handlersToIgnore = handlersToIgnore
    }

    return this
  }

  /**
   * Executing hooks
   *
   * @param reverse - Whether to execute handlers in reverse order
   * @param data - Arguments to pass to the hook handlers
   */
  async #exec(reverse: boolean, data: HookArgs) {
    if (this.#state !== 'idle') {
      return
    }

    this.#state = 'cleanup_pending'
    if (this.#skipAllHooks) {
      return
    }

    debug('running hooks')

    const handlers = reverse ? Array.from(this.#hookHandlers).reverse() : this.#hookHandlers
    for (let handler of handlers) {
      if (this.#filter(handler.name)) {
        if (handler.name) {
          debug('running hook %s', handler.name)
        }

        const result = await (typeof handler === 'function'
          ? handler(...data)
          : handler.handle(this.action, ...data))

        if (typeof result === 'function') {
          if (handler.name) {
            debug('cleanup scheduled by %s hook', handler.name)
          }
          this.#cleanupHandlers.push(result)
        }
      }
    }
  }

  /**
   * Execute handlers
   *
   * @param data - Arguments to pass to the hook handlers
   *
   * @example
   * ```ts
   * const runner = hooks.runner('saving')
   * await runner.run(user, { email: 'new@example.com' })
   * ```
   */
  async run(...data: HookArgs): Promise<void> {
    return this.#exec(false, data)
  }

  /**
   * Execute handlers in reverse order
   *
   * @param data - Arguments to pass to the hook handlers
   *
   * @example
   * ```ts
   * const runner = hooks.runner('deleting')
   * await runner.runReverse(user)
   * ```
   */
  async runReverse(...data: HookArgs): Promise<void> {
    return this.#exec(true, data)
  }

  /**
   * Execute cleanup actions
   *
   * @param data - Arguments to pass to the cleanup handlers
   *
   * @example
   * ```ts
   * const runner = hooks.runner('saving')
   * await runner.run(user)
   *
   * // Later, cleanup any resources
   * await runner.cleanup(user)
   * ```
   */
  async cleanup(...data: CleanUpArgs) {
    if (!this.isCleanupPending) {
      return
    }

    this.#state = 'cleanup_initiated'
    debug('performing cleanup')

    let startIndex = this.#cleanupHandlers.length
    while (startIndex--) {
      await this.#cleanupHandlers[startIndex](...data)
    }

    this.#state = 'cleanup_completed'
    this.#cleanupHandlers = []
  }
}
