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
 * The shape of the custom executor function to call hook handlers
 */
export type HandlerExecutor = (
  handler: (...args: any[]) => any,
  isCleanupHandler: boolean,
  ...args: any[]
) => void | Promise<void>

/**
 * Hook provider are classes with methods as the event name
 */
export type HookProvider = new (...args: any[]) => any

/**
 * The shape of the custom executor function to call hook providers
 */
export type ProviderExecutor = (
  Provider: HookProvider,
  event: string,
  ...args: any[]
) => void | Promise<void>
