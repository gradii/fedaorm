import { SqlNode } from '../../sql-node'
export class ConditionTermExpression extends SqlNode {
  constructor() {
    super()
  }
  accept(visitor) {
    return visitor.visitConditionTermExpression(this)
  }
}