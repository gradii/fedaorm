import { SqlNode } from '../../sql-node';

export class JsonPathColumn extends SqlNode {
  constructor(columns, jsonPaths) {
    super();
    this.columns = columns;
    this.jsonPaths = jsonPaths;
  }

  accept(visitor) {
    return visitor.visitJsonPathColumn(this);
  }
}
