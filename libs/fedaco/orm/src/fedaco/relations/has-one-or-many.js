/**
 * @license
 *
 * Use of this source code is governed by an MIT-style license
 */
import { __awaiter } from 'tslib'
import { isBlank } from '@gradii/check-type'
import { last, tap } from 'ramda'
import { mixinInteractsWithDictionary } from './concerns/interacts-with-dictionary'
import { Relation } from './relation'
export class HasOneOrMany extends mixinInteractsWithDictionary(Relation) {
  constructor(query, parent, foreignKey, localKey) {
    super(query, parent)
    this._localKey = localKey
    this._foreignKey = foreignKey
    this.addConstraints()
  }

  make(attributes = {}) {
    return tap((instance) => {
      this._setForeignAttributesForCreate(instance)
    }, this._related.newInstance(attributes))
  }

  makeMany(records) {
    const instances = this._related.newCollection()
    for (const record of records) {
      instances.push(this.make(record))
    }
    return instances
  }

  addConstraints() {
    if (this.constructor.constraints) {
      const query = this._getRelationQuery()
      query.where(this._foreignKey, '=', this.getParentKey())
      query.whereNotNull(this._foreignKey)
    }
  }

  addEagerConstraints(models) {
    const whereIn = this._whereInMethod(this._parent, this._localKey)
    this._getRelationQuery()[whereIn](
      this._foreignKey,
      this.getKeys(models, this._localKey)
    )
  }

  matchOne(models, results, relation) {
    return this.matchOneOrMany(models, results, relation, 'one')
  }

  matchMany(models, results, relation) {
    return this.matchOneOrMany(models, results, relation, 'many')
  }

  matchOneOrMany(models, results, relation, type) {
    const dictionary = this.buildDictionary(results)
    for (const model of models) {
      const key = this._getDictionaryKey(model.getAttribute(this._localKey))
      if (dictionary[key] !== undefined) {
        model.setRelation(
          relation,
          this.getRelationValue(dictionary, key, type)
        )
      }
    }
    return models
  }

  getRelationValue(dictionary, key, type) {
    const value = dictionary[key]
    return type === 'one' ? value[0] : this._related.newCollection(value)
  }

  buildDictionary(results) {
    const foreign = this.getForeignKeyName()
    return results.reduce((prev, result) => {
      const key = this._getDictionaryKey(result.getAttribute(foreign))
      if (!prev[key]) {
        prev[key] = []
      }
      prev[key].push(result)
      return prev
    }, {})
  }

  findOrNew(id, columns = ['*']) {
    return __awaiter(this, void 0, void 0, function* () {
      let instance = yield this.find(id, columns)
      if (isBlank(instance)) {
        instance = this._related.newInstance()
        this._setForeignAttributesForCreate(instance)
      }
      return instance
    })
  }

  firstOrNew(attributes = {}, values = {}) {
    return __awaiter(this, void 0, void 0, function* () {
      let instance = yield this.where(attributes).first()
      if (isBlank(instance)) {
        instance = this._related.newInstance(
          Object.assign(Object.assign({}, attributes), values)
        )
        this._setForeignAttributesForCreate(instance)
      }
      return instance
    })
  }

  firstOrCreate(attributes = {}, values = {}) {
    return __awaiter(this, void 0, void 0, function* () {
      let instance = yield this.where(attributes).first()
      if (isBlank(instance)) {
        instance = yield this.create(
          Object.assign(Object.assign({}, attributes), values)
        )
      }
      return instance
    })
  }

  updateOrCreate(attributes, values = {}) {
    return __awaiter(this, void 0, void 0, function* () {
      const instance = yield this.firstOrNew(attributes)
      yield instance.fill(values)
      yield instance.save()
      return instance
    })
  }

  save(model) {
    return __awaiter(this, void 0, void 0, function* () {
      this._setForeignAttributesForCreate(model)
      return (yield model.save()) ? model : false
    })
  }

  saveMany(models) {
    return __awaiter(this, void 0, void 0, function* () {
      for (const model of models) {
        yield this.save(model)
      }
      return models
    })
  }

  create(attributes = {}) {
    return __awaiter(this, void 0, void 0, function* () {
      const instance = this._related.newInstance(attributes)
      this._setForeignAttributesForCreate(instance)
      yield instance.save()
      return instance
    })
  }

  createMany(records) {
    return __awaiter(this, void 0, void 0, function* () {
      const instances = this._related.newCollection()
      for (const record of records) {
        instances.push(yield this.create(record))
      }
      return instances
    })
  }

  _setForeignAttributesForCreate(model) {
    model.setAttribute(this.getForeignKeyName(), this.getParentKey())
  }

  getRelationExistenceQuery(query, parentQuery, columns = ['*']) {
    if (query.getModel().getTable() == parentQuery.getModel().getTable()) {
      return this.getRelationExistenceQueryForSelfRelation(
        query,
        parentQuery,
        columns
      )
    }
    return super.getRelationExistenceQuery(query, parentQuery, columns)
  }

  getRelationExistenceQueryForSelfRelation(
    query,
    parentQuery,
    columns = ['*']
  ) {
    const hash = this.getRelationCountHash()
    query.from(`${query.getModel().getTable()} as ${hash}`)
    query.getModel().setTable(hash)
    return query
      .select(columns)
      .whereColumn(
        this.getQualifiedParentKeyName(),
        '=',
        `${hash}.${this.getForeignKeyName()}`
      )
  }

  getExistenceCompareKey() {
    return this.getQualifiedForeignKeyName()
  }

  getParentKey() {
    return this._parent.getAttribute(this._localKey)
  }

  getQualifiedParentKeyName() {
    return this._parent.qualifyColumn(this._localKey)
  }

  getForeignKeyName() {
    const segments = this.getQualifiedForeignKeyName().split('.')
    return last(segments)
  }

  getQualifiedForeignKeyName() {
    return this._foreignKey
  }

  getLocalKeyName() {
    return this._localKey
  }
}
