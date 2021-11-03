import { Expression } from './expression'
export class ConditionExpression extends Expression {
  constructor(conditionTerms) {
    super()
    this.conditionTerms = conditionTerms
  }
  accept(visitor) {
    return visitor.visitConditionExpression(this)
  }
}