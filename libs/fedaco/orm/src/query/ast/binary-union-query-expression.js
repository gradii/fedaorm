import { QueryExpression } from './query-expression'
export class BinaryUnionQueryExpression extends QueryExpression {
  constructor(left, right, all) {
    super()
    this.left = left
    this.right = right
    this.all = all
  }
  accept(visitor) {
    return visitor.visitBinaryUnionQueryExpression(this)
  }
}