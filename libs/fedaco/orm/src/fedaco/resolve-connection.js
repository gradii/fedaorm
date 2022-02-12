/**
 * @license
 *
 * Use of this source code is governed by an MIT-style license
 */
export class ResolveConnection {
  constructor() {
    this.resolvedConnection = new WeakMap()
  }

  resolveConnection(modelStatic, connection = null) {
    return modelStatic.resolver.connection(connection)
  }

  getConnectionResolver(modelStatic) {
    return modelStatic.resolver
  }

  setConnectionResolver(modelStatic, resolver) {
    modelStatic.resolver = resolver
  }

  unsetConnectionResolver(modelStatic) {
    modelStatic.resolver = null
  }
}
