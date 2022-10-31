/*
 * @poppinss/hooks
 *
 * (c) Poppinss
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { CleanupHandler, HandlerExecutor, HookHandler } from './types.js'

/**
 * The default implementation invokes the handler and pass
 * data to it
 */
const defaultHandlerExecutor: HandlerExecutor = (handler, _, ...data) => handler(...data)

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
  #hookHandlers: Set<HookHandler<HookArgs, CleanUpArgs>>

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
   * A custom handler executor.
   */
  #handlerExecutor: HandlerExecutor = defaultHandlerExecutor

  /**
   * Find if cleanup is pending or not
   */
  get isCleanupPending() {
    return this.#state === 'cleanup_pending'
  }

  constructor(hookHandlers?: Set<HookHandler<HookArgs, CleanUpArgs>>) {
    this.#hookHandlers = hookHandlers || new Set()
  }

  /**
   * Filter to check if we should run the handler
   */
  #filter(handler: HookHandler<HookArgs, CleanUpArgs>): boolean {
    return !this.#handlersToIgnore.includes(handler.name)
  }

  /**
   * Ignore specific or all hook handlers. Calling this
   * method multiple times will result in overwriting
   * the existing state.
   */
  without(handlersToIgnore?: string[]): this {
    if (!handlersToIgnore) {
      this.#skipAllHooks = true
    } else {
      this.#skipAllHooks = false
      this.#handlersToIgnore = handlersToIgnore
    }

    return this
  }

  /**
   * Define a custom executor to execute the hook
   * handler.
   */
  executor(callback: HandlerExecutor): this {
    this.#handlerExecutor = callback
    return this
  }

  /**
   * Execute handlers
   */
  async run(...data: HookArgs): Promise<void> {
    if (this.#state !== 'idle') {
      return
    }

    this.#state = 'cleanup_pending'
    if (this.#skipAllHooks) {
      return
    }

    for (let handler of this.#hookHandlers) {
      if (this.#filter(handler)) {
        const result = await this.#handlerExecutor(handler, false, ...data)

        if (typeof result === 'function') {
          this.#cleanupHandlers.push(result)
        }
      }
    }
  }

  /**
   * Execute cleanup actions
   */
  async cleanup(...data: CleanUpArgs) {
    if (!this.isCleanupPending) {
      return
    }

    this.#state = 'cleanup_initiated'

    let startIndex = this.#cleanupHandlers.length
    while (startIndex--) {
      await this.#handlerExecutor(this.#cleanupHandlers[startIndex], true, ...data)
    }

    this.#state = 'cleanup_completed'
  }
}
