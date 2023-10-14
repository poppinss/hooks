/*
 * @poppinss/hooks
 *
 * (c) Poppinss
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { Runner } from './runner.js'

/**
 * Exporting hooks runner as a type
 */
export { Runner }

/**
 * Shape of the cleanup handler
 */
export type CleanupHandler<Args extends any[]> = (...args: Args) => void | Promise<void>

/**
 * Shape of the hook handler
 */
export type HookHandler<Args extends any[], CleanUpArgs extends any[]> = (
  ...args: Args
) => void | CleanupHandler<CleanUpArgs> | Promise<void> | Promise<CleanupHandler<CleanUpArgs>>

/**
 * Extracts args from a hook handler type
 */
export type ExtractHookHandlerArgs<Handler> = Handler extends HookHandler<infer A, infer B>
  ? [A, B]
  : never

/**
 * Hook represented as an object with handle method
 */
export type HookHandlerProvider<Args extends any[], CleanUpArgs extends any[]> = {
  name: string
  handle(
    event: string,
    ...args: Args
  ): void | CleanupHandler<CleanUpArgs> | Promise<void> | Promise<CleanupHandler<CleanUpArgs>>
}
