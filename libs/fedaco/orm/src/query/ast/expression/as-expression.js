/**
 * @license
 *
 * Use of this source code is governed by an MIT-style license
 */
import { SqlNode } from '../../sql-node'
export class AsExpression extends SqlNode {
  constructor(name, as) {
    super()
    this.name = name
    this.as = as
  }
  accept(visitor) {
    return visitor.visitAsExpression(this)
  }
}
