/*
 * @poppinss/hooks
 *
 * (c) Poppinss
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

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
 * Hook represented as an object with handle method
 */
export type HookHandlerProvider<Args extends any[], CleanUpArgs extends any[]> = {
  name: string
  handle(
    event: string,
    ...args: Args
  ): void | CleanupHandler<CleanUpArgs> | Promise<void> | Promise<CleanupHandler<CleanUpArgs>>
}
