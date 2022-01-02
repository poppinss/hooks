/*
 * @poppinss/hooks
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { CleanupHandler, HooksHandler } from '../Contracts'

/**
 * Runner to execute hooks and cleanup actions
 */
export class Runner {
  private cleanupActions: Set<CleanupHandler> = new Set()
  constructor(private hooksHandlers?: Set<HooksHandler>, private withoutHooks?: string[]) {}

  /**
   * Find if cleanup call is pending or not
   */
  public isCleanupPending = true

  private shouldRunHandler(handler: HooksHandler): boolean {
    return this.withoutHooks ? !this.withoutHooks.includes(handler.name) : true
  }

  /**
   * Run hooks
   */
  public async run(...data: any[]): Promise<void> {
    if (!this.hooksHandlers) {
      return
    }

    this.isCleanupPending = true
    for (let handler of this.hooksHandlers) {
      if (this.shouldRunHandler(handler)) {
        const cleanupAction = await handler(...data)
        typeof cleanupAction === 'function' && this.cleanupActions.add(cleanupAction)
      }
    }
  }

  /**
   * Execute cleanup actions
   */
  public async cleanup(...data: any[]) {
    this.isCleanupPending = false
    for (let action of this.cleanupActions) {
      await action(...data)
    }
  }
}
