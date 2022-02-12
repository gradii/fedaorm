/**
 * @license
 *
 * Use of this source code is governed by an MIT-style license
 */
import {
  isAnyEmpty,
  isArray,
  isBlank,
  isNumber,
  isString,
} from '@gradii/check-type'
import { snakeCase } from '../../helper/str'
import {
  createTableColumn,
  raw,
  rawSqlBindings,
} from '../../query-builder/ast-factory'
import { MorphTo } from '../relations/morph-to'
import { Relation } from '../relations/relation'
export function mixinQueriesRelationShips(base) {
  return class _Self extends base {
    has(relation, operator = '>=', count = 1, conjunction = 'and', callback) {
      if (isString(relation)) {
        if (relation.includes('.')) {
          return this._hasNested(
            relation,
            operator,
            count,
            conjunction,
            callback
          )
        }
        const ins = this._getRelationWithoutConstraints(relation)
        if (isBlank(ins)) {
          throw new Error(`the relation [${relation}] can't acquired. try to define a relation like
@HasManyColumn()
public readonly ${relation};
`)
        }
        relation = ins
      }
      if (relation instanceof MorphTo) {
        return this.hasMorph(
          relation,
          ['*'],
          operator,
          count,
          conjunction,
          callback
        )
      }
      const method = this._canUseExistsForExistenceCheck(operator, count)
        ? 'getRelationExistenceQuery'
        : 'getRelationExistenceCountQuery'
      const hasQuery = relation[method](
        relation.getRelated().newQueryWithoutRelationships(),
        this
      )
      if (callback) {
        hasQuery.callScope(callback)
      }
      return this._addHasWhere(hasQuery, relation, operator, count, conjunction)
    }

    _hasNested(
      relations,
      operator = '>=',
      count = 1,
      conjunction = 'and',
      callback = null
    ) {
      const splitRelations = relations.split('.')
      const doesntHave = operator === '<' && count === 1
      if (doesntHave) {
        operator = '>='
        count = 1
      }
      const closure = (q) => {
        splitRelations.length > 1
          ? q.whereHas(splitRelations.shift(), closure)
          : q.has(splitRelations.shift(), operator, count, 'and', callback)
      }
      return this.has(
        splitRelations.shift(),
        doesntHave ? '<' : '>=',
        1,
        conjunction,
        closure
      )
    }

    orHas(relation, operator = '>=', count = 1) {
      return this.has(relation, operator, count, 'or')
    }

    doesntHave(relation, conjunction = 'and', callback = null) {
      return this.has(relation, '<', 1, conjunction, callback)
    }

    orDoesntHave(relation) {
      return this.doesntHave(relation, 'or')
    }

    whereHas(relation, callback = null, operator = '>=', count = 1) {
      return this.has(relation, operator, count, 'and', callback)
    }

    orWhereHas(relation, callback = null, operator = '>=', count = 1) {
      return this.has(relation, operator, count, 'or', callback)
    }

    whereDoesntHave(relation, callback = null) {
      return this.doesntHave(relation, 'and', callback)
    }

    orWhereDoesntHave(relation, callback = null) {
      return this.doesntHave(relation, 'or', callback)
    }

    hasMorph(
      relation,
      types,
      operator = '>=',
      count = 1,
      conjunction = 'and',
      callback = null
    ) {
      if (isString(relation)) {
        relation = this._getRelationWithoutConstraints(relation)
      }

      if (types.length === 1 && types[0] === '*') {
        types = this.model
          .newModelQuery()
          .distinct()
          .pluck(relation.getMorphType())
          .filter()
          .all()
      }
      const morphedTypes = types.map((type) => {
        var _a
        return (_a = Relation.getMorphedModel(type)) !== null && _a !== void 0
          ? _a
          : type
      })
      return this.where(
        (query) => {
          for (const type of morphedTypes) {
            query.orWhere((q) => {
              const belongsTo = this._getBelongsToRelation(relation, type)
              if (callback) {
                callback = (__q) => {
                  return callback(__q, type)
                }
              }
              q.where(
                this.qualifyColumn(relation.getMorphType()),
                '=',
                new type().getMorphClass()
              ).whereHas(belongsTo, callback, operator, count)
            })
          }
        },
        null,
        null,
        conjunction
      )
    }

    _getBelongsToRelation(relation, type) {
      const belongsTo = Relation.noConstraints(() => {
        return this.model.belongsTo(
          type,
          relation.getForeignKeyName(),
          relation.getOwnerKeyName()
        )
      })
      belongsTo.getQuery().mergeConstraintsFrom(relation.getQuery())
      return belongsTo
    }

    orHasMorph(relation, types, operator = '>=', count = 1) {
      return this.hasMorph(relation, types, operator, count, 'or')
    }

    doesntHaveMorph(relation, types, conjunction = 'and', callback = null) {
      return this.hasMorph(relation, types, '<', 1, conjunction, callback)
    }

    orDoesntHaveMorph(relation, types) {
      return this.doesntHaveMorph(relation, types, 'or')
    }

    whereHasMorph(
      relation,
      types,
      callback = null,
      operator = '>=',
      count = 1
    ) {
      return this.hasMorph(relation, types, operator, count, 'and', callback)
    }

    orWhereHasMorph(
      relation,
      types,
      callback = null,
      operator = '>=',
      count = 1
    ) {
      return this.hasMorph(relation, types, operator, count, 'or', callback)
    }

    whereDoesntHaveMorph(relation, types, callback = null) {
      return this.doesntHaveMorph(relation, types, 'and', callback)
    }

    orWhereDoesntHaveMorph(relation, types, callback = null) {
      return this.doesntHaveMorph(relation, types, 'or', callback)
    }

    withAggregate(relations, column, func = null) {
      if (isAnyEmpty(relations)) {
        return this
      }
      if (!this.getQuery()._columns.length) {
        this.getQuery().select(createTableColumn(this.getQuery()._from, '*'))
      }
      relations = isArray(relations) ? relations : [relations]
      let name, constraints
      for ([name, constraints] of Object.entries(
        this._parseWithRelations(relations)
      )) {
        const segments = name.split(' ')
        let alias
        if (segments.length === 3 && segments[1].toLowerCase() === 'as') {
          ;[name, alias] = [segments[0], segments[2]]
        }
        const relation = this._getRelationWithoutConstraints(name)
        let expression
        if (func) {
          let hashedColumn
          if (
            this.getModel()._connection ===
              relation.getQuery().getModel()._connection &&
            this.getModel().getTable() ===
              relation.getQuery().getModel().getTable()
          ) {
            hashedColumn = `${relation.getRelationCountHash(false)}.${column}`
          } else {
            hashedColumn = column
          }
          const wrappedColumn = this.getQuery()
            .getGrammar()
            .wrap(
              column === '*'
                ? column
                : relation.getRelated().qualifyColumn(hashedColumn)
            )
          expression =
            func === 'exists' ? wrappedColumn : `${func}(${wrappedColumn})`
        } else {
          expression = column
        }
        const query = relation.getRelationExistenceQuery(
          relation.getRelated().newQuery(),
          this,
          raw(expression)
        )
        query.callScope(constraints)
        const queryBuilder = query
          .mergeConstraintsFrom(relation.getQuery())
          .toBase()
        queryBuilder._orders = []
        queryBuilder._bindings['order'] = []
        if (queryBuilder._columns.length > 1) {
          queryBuilder._columns = [queryBuilder._columns[0]]
          queryBuilder._bindings['select'] = []
        }
        alias =
          alias !== null && alias !== void 0
            ? alias
            : snakeCase(
                `${name} ${func} ${column}`.replace(/^[0-9A-Za-z]\s+_/u, '')
              )
        if (func === 'exists') {
          const sql = query.toSql()
          this.selectRaw(
            `exists(${sql.result}) as ${this.getQuery()._grammar.wrap(alias)}`,
            sql.bindings
          ).withCasts({ [alias]: 'boolean' })
        } else {
          this.selectSub(func ? queryBuilder : queryBuilder.limit(1), alias)
        }
      }
      return this
    }
    withCount(relations) {
      return this.withAggregate(
        isArray(relations) ? relations : [...arguments],
        '*',
        'count'
      )
    }

    withMax(relation, column) {
      return this.withAggregate(relation, column, 'max')
    }

    withMin(relation, column) {
      return this.withAggregate(relation, column, 'min')
    }

    withSum(relation, column) {
      return this.withAggregate(relation, column, 'sum')
    }

    withAvg(relation, column) {
      return this.withAggregate(relation, column, 'avg')
    }

    withExists(relation) {
      return this.withAggregate(relation, '*', 'exists')
    }

    _addHasWhere(hasQuery, relation, operator, count, conjunction) {
      hasQuery.mergeConstraintsFrom(relation.getQuery())
      return this._canUseExistsForExistenceCheck(operator, count)
        ? this.addWhereExistsQuery(
            hasQuery.toBase(),
            conjunction,
            operator === '<' && count === 1
          )
        : this._addWhereCountQuery(
            hasQuery.toBase(),
            operator,
            count,
            conjunction
          )
    }

    mergeConstraintsFrom(from) {
      var _a
      const whereBindings =
        (_a = from.getQuery().getRawBindings()['where']) !== null &&
        _a !== void 0
          ? _a
          : []
      const fb = this.withoutGlobalScopes(from.removedScopes())
      fb.getQuery().mergeWheres(from.getQuery()._wheres, whereBindings)
      return fb
    }

    _addWhereCountQuery(
      query,
      operator = '>=',
      count = 1,
      conjunction = 'and'
    ) {
      const sql = query.toSql()
      const bindings = query.getBindings()
      return this.whereColumn(
        rawSqlBindings('(' + sql + ')', bindings),
        operator,
        isNumber(count) ? raw(count) : count,
        conjunction
      )
    }

    _getRelationWithoutConstraints(relation) {
      return Relation.noConstraints(() => {
        return this.getModel().newRelation(relation)
      })
    }

    _canUseExistsForExistenceCheck(operator, count) {
      return (operator === '>=' || operator === '<') && count === 1
    }
  }
}
