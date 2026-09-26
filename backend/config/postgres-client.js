const { pool } = require('./database');

const IDENTIFIER = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
const RELATIONS = {
  'colleges:students': { local: 'id', foreign: 'college_id', many: true },
  'exams:questions': { local: 'id', foreign: 'exam_id', many: true },
  'exams:exam_questions': { local: 'id', foreign: 'exam_id', many: true },
  'exams:exam_assignments': { local: 'id', foreign: 'exam_id', many: true },
  'exams:exam_students': { local: 'id', foreign: 'exam_id', many: true },
  'exams:exam_sessions': { local: 'id', foreign: 'exam_id', many: true },
  'exams:answers': { local: 'id', foreign: 'exam_id', many: true },
  'exams:violations': { local: 'id', foreign: 'exam_id', many: true },
  'exams:results': { local: 'id', foreign: 'exam_id', many: true },
  'students:exam_assignments': { local: 'id', foreign: 'student_id', many: true },
  'students:exam_students': { local: 'id', foreign: 'student_id', many: true },
  'students:exam_sessions': { local: 'id', foreign: 'student_id', many: true },
  'students:answers': { local: 'id', foreign: 'student_id', many: true },
  'students:violations': { local: 'id', foreign: 'student_id', many: true },
  'students:results': { local: 'id', foreign: 'student_id', many: true },
  'exam_sessions:students': { local: 'student_id', foreign: 'id', many: false },
  'exam_sessions:exams': { local: 'exam_id', foreign: 'id', many: false },
  'answers:students': { local: 'student_id', foreign: 'id', many: false },
  'answers:questions': { local: 'question_id', foreign: 'id', many: false },
  'answers:exam_sessions': { local: 'session_id', foreign: 'id', many: false },
  'exam_assignments:students': { local: 'student_id', foreign: 'id', many: false },
  'exam_assignments:exams': { local: 'exam_id', foreign: 'id', many: false },
  'exam_students:students': { local: 'student_id', foreign: 'id', many: false },
  'exam_students:exams': { local: 'exam_id', foreign: 'id', many: false },
  'questions:exams': { local: 'exam_id', foreign: 'id', many: false },
  'exam_questions:exams': { local: 'exam_id', foreign: 'id', many: false },
  'student_question_sets:students': { local: 'student_id', foreign: 'id', many: false },
  'student_question_sets:exams': { local: 'exam_id', foreign: 'id', many: false },
  'violations:students': { local: 'student_id', foreign: 'id', many: false },
  'violations:exams': { local: 'exam_id', foreign: 'id', many: false },
  'violations:exam_sessions': { local: 'session_id', foreign: 'id', many: false },
  'results:students': { local: 'student_id', foreign: 'id', many: false },
  'results:exams': { local: 'exam_id', foreign: 'id', many: false },
  'results:exam_sessions': { local: 'session_id', foreign: 'id', many: false },
  'subscriptions:colleges': { local: 'college_id', foreign: 'id', many: false },
};

const quoteIdentifier = (value) => {
  if (!IDENTIFIER.test(value)) throw new Error(`Invalid SQL identifier: ${value}`);
  return `"${value}"`;
};

const splitSelection = (value) => {
  const parts = [];
  let depth = 0;
  let current = '';
  for (const character of value) {
    if (character === ',' && depth === 0) {
      if (current.trim()) parts.push(current.trim());
      current = '';
      continue;
    }
    if (character === '(') depth += 1;
    if (character === ')') depth -= 1;
    current += character;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
};

const parseSelection = (columns = '*') => splitSelection(columns.replace(/\s+/g, ' ')).map((entry) => {
  const relation = entry.match(/^([\w]+:)?([\w]+)(?:!inner)?\((.*)\)$/);
  if (relation) {
    const alias = (relation[1] || '').replace(':', '') || relation[2];
    return {
      kind: 'relation',
      alias,
      table: relation[2],
      inner: entry.includes('!inner'),
      columns: relation[3].trim(),
    };
  }

  const [column, alias] = entry.split(':').map((part) => part.trim());
  if (column === '*') return { kind: 'all' };
  quoteIdentifier(column);
  if (alias) quoteIdentifier(alias);
  return { kind: 'column', column, alias };
});

const operatorSql = {
  eq: '=',
  neq: '<>',
  gt: '>',
  gte: '>=',
  lt: '<',
  lte: '<=',
  like: 'LIKE',
  ilike: 'ILIKE',
};

class PostgresQueryBuilder {
  constructor(table) {
    this.table = table;
    quoteIdentifier(table);
    this.action = 'select';
    this.selection = '*';
    this.filters = [];
    this.orders = [];
    this.maxRows = null;
    this.offset = 0;
    this.countMode = null;
    this.head = false;
    this.singleMode = null;
    this.payload = null;
    this.conflictColumns = null;
    this.returning = false;
    this.promise = null;
  }

  select(columns = '*', options = {}) {
    this.selection = columns || '*';
    this.returning = this.action !== 'select';
    if (options.count) this.countMode = options.count;
    if (options.head) this.head = true;
    return this;
  }

  insert(payload) {
    this.action = 'insert';
    this.payload = payload;
    return this;
  }

  update(payload) {
    this.action = 'update';
    this.payload = payload;
    return this;
  }

  delete() {
    this.action = 'delete';
    return this;
  }

  upsert(payload, options = {}) {
    this.action = 'upsert';
    this.payload = payload;
    this.conflictColumns = options.onConflict || null;
    return this;
  }

  eq(column, value) { return this.addFilter(column, 'eq', value); }
  neq(column, value) { return this.addFilter(column, 'neq', value); }
  gt(column, value) { return this.addFilter(column, 'gt', value); }
  gte(column, value) { return this.addFilter(column, 'gte', value); }
  lt(column, value) { return this.addFilter(column, 'lt', value); }
  lte(column, value) { return this.addFilter(column, 'lte', value); }
  like(column, value) { return this.addFilter(column, 'like', value); }
  ilike(column, value) { return this.addFilter(column, 'ilike', value); }
  is(column, value) { return this.addFilter(column, 'is', value); }
  in(column, values) { return this.addFilter(column, 'in', values); }

  not(column, operator, value) {
    return this.addFilter(column, `not_${operator}`, value);
  }

  filter(column, operator, value) {
    return this.addFilter(column, operator, value);
  }

  addFilter(column, operator, value) {
    quoteIdentifier(column);
    this.filters.push({ column, operator, value });
    return this;
  }

  or(expression) {
    this.filters.push({ operator: 'or', expression });
    return this;
  }

  order(column, options = {}) {
    quoteIdentifier(column);
    this.orders.push({ column, ascending: options.ascending !== false, nullsFirst: options.nullsFirst });
    return this;
  }

  limit(value) {
    this.maxRows = Math.max(0, Number.parseInt(value, 10));
    return this;
  }

  range(from, to) {
    this.offset = Math.max(0, Number.parseInt(from, 10));
    this.maxRows = Math.max(0, Number.parseInt(to, 10) - this.offset + 1);
    return this;
  }

  single() {
    this.singleMode = 'single';
    return this;
  }

  maybeSingle() {
    this.singleMode = 'maybeSingle';
    return this;
  }

  buildWhere(params, alias = this.table) {
    const clauses = [];
    for (const filter of this.filters) {
      if (filter.operator === 'or') {
        const alternatives = splitSelection(filter.expression).map((part) => {
          const match = part.match(/^([\w]+)\.(eq|neq|gt|gte|lt|lte|like|ilike|is)\.(.*)$/);
          if (!match) throw new Error(`Unsupported OR filter: ${part}`);
          return this.buildCondition(params, alias, match[1], match[2], match[3] === 'null' ? null : match[3]);
        });
        clauses.push(`(${alternatives.join(' OR ')})`);
      } else {
        clauses.push(this.buildCondition(params, alias, filter.column, filter.operator, filter.value));
      }
    }
    return clauses.length ? ` WHERE ${clauses.join(' AND ')}` : '';
  }

  buildCondition(params, alias, column, operator, value) {
    quoteIdentifier(column);
    const field = `${quoteIdentifier(alias)}.${quoteIdentifier(column)}`;
    if (operator === 'is' || operator === 'not_is') {
      const negated = operator === 'not_is';
      if (value === null) return `${field} IS ${negated ? 'NOT ' : ''}NULL`;
      if (typeof value === 'boolean') return `${field} IS ${negated ? 'NOT ' : ''}${value ? 'TRUE' : 'FALSE'}`;
      throw new Error('IS filters support only null and boolean values.');
    }
    if (operator === 'in' || operator === 'not_in') {
      if (!Array.isArray(value) || value.length === 0) return operator === 'in' ? 'FALSE' : 'TRUE';
      const placeholders = value.map((item) => {
        params.push(item);
        return `$${params.length}`;
      });
      return `${field} ${operator === 'not_in' ? 'NOT ' : ''}IN (${placeholders.join(', ')})`;
    }
    if (operator.startsWith('not_')) {
      const baseOperator = operator.slice(4);
      if (baseOperator === 'is') return this.buildCondition(params, alias, column, 'not_is', value);
      if (baseOperator === 'in') return this.buildCondition(params, alias, column, 'not_in', value);
      if (baseOperator === 'eq') return this.buildCondition(params, alias, column, 'neq', value);
      if (baseOperator === 'neq') return this.buildCondition(params, alias, column, 'eq', value);
      if (!operatorSql[baseOperator]) throw new Error(`Unsupported filter operator: ${operator}`);
      params.push(value);
      return `NOT (${field} ${operatorSql[baseOperator]} $${params.length})`;
    }
    if (!operatorSql[operator]) throw new Error(`Unsupported filter operator: ${operator}`);
    params.push(value);
    return `${field} ${operatorSql[operator]} $${params.length}`;
  }

  buildProjection() {
    const selections = parseSelection(this.selection);
    const fields = [];
    const joins = [];

    for (let index = 0; index < selections.length; index += 1) {
      const item = selections[index];
      if (item.kind === 'all') {
        fields.push(`${quoteIdentifier(this.table)}.*`);
        continue;
      }
      if (item.kind === 'column') {
        const as = item.alias ? ` AS ${quoteIdentifier(item.alias)}` : '';
        fields.push(`${quoteIdentifier(this.table)}.${quoteIdentifier(item.column)}${as}`);
        continue;
      }

      const relation = RELATIONS[`${this.table}:${item.table}`];
      if (!relation) throw new Error(`Unsupported relation ${this.table}.${item.table}`);
      if (item.columns === 'count' && relation.many) {
        const countAlias = `count_${index}`;
        const subquery = `(SELECT jsonb_build_array(jsonb_build_object('count', COUNT(*))) FROM ${quoteIdentifier(item.table)} AS ${quoteIdentifier(countAlias)} WHERE ${quoteIdentifier(countAlias)}.${quoteIdentifier(relation.foreign)} = ${quoteIdentifier(this.table)}.${quoteIdentifier(relation.local)})`;
        fields.push(`${subquery} AS ${quoteIdentifier(item.alias)}`);
        continue;
      }

      const joinAlias = `relation_${index}`;
      const joinType = item.inner ? 'INNER JOIN' : 'LEFT JOIN';
      joins.push(`${joinType} ${quoteIdentifier(item.table)} AS ${quoteIdentifier(joinAlias)} ON ${quoteIdentifier(joinAlias)}.${quoteIdentifier(relation.foreign)} = ${quoteIdentifier(this.table)}.${quoteIdentifier(relation.local)}`);
      const relationColumns = item.columns === '*' ? null : splitSelection(item.columns).map((column) => {
        const [name] = column.split(':').map((part) => part.trim());
        quoteIdentifier(name);
        return name;
      });
      const jsonFields = relationColumns
        ? relationColumns.flatMap((column) => [`'${column}'`, `${quoteIdentifier(joinAlias)}.${quoteIdentifier(column)}`])
        : null;
      const relationJson = relationColumns
        ? `jsonb_build_object(${jsonFields.join(', ')})`
        : `to_jsonb(${quoteIdentifier(joinAlias)})`;
      fields.push(`CASE WHEN ${quoteIdentifier(joinAlias)}.${quoteIdentifier(relation.foreign)} IS NULL THEN NULL ELSE ${relationJson} END AS ${quoteIdentifier(item.alias)}`);
    }

    const projection = fields.length ? fields.join(', ') : `${quoteIdentifier(this.table)}.*`;
    return { projection, joins: joins.length ? ` ${joins.join(' ')}` : '' };
  }

  async executeSelect() {
    const countParams = [];
    const where = this.buildWhere(countParams);
    let count = null;
    if (this.countMode === 'exact') {
      const countResult = await pool.query(`SELECT COUNT(*)::int AS count FROM ${quoteIdentifier(this.table)}${where}`, countParams);
      count = countResult.rows[0].count;
    }
    if (this.head) return { data: null, error: null, count };

    const params = [];
    const queryWhere = this.buildWhere(params);
    const { projection, joins } = this.buildProjection();
    let sql = `SELECT ${projection} FROM ${quoteIdentifier(this.table)}${joins}${queryWhere}`;
    if (this.orders.length) {
      const orders = this.orders.map(({ column, ascending, nullsFirst }) => {
        const nulls = nullsFirst === undefined ? '' : ` NULLS ${nullsFirst ? 'FIRST' : 'LAST'}`;
        return `${quoteIdentifier(this.table)}.${quoteIdentifier(column)} ${ascending ? 'ASC' : 'DESC'}${nulls}`;
      });
      sql += ` ORDER BY ${orders.join(', ')}`;
    }
    if (this.maxRows !== null) {
      params.push(this.maxRows);
      sql += ` LIMIT $${params.length}`;
    }
    if (this.offset) {
      params.push(this.offset);
      sql += ` OFFSET $${params.length}`;
    }

    const { rows } = await pool.query(sql, params);
    if (this.singleMode && rows.length > 1) {
      return { data: null, error: this.cardinalityError(rows.length), count };
    }
    if (this.singleMode === 'single') {
      if (rows.length !== 1) return { data: null, error: this.cardinalityError(rows.length), count };
      return { data: rows[0], error: null, count };
    }
    if (this.singleMode === 'maybeSingle') return { data: rows[0] || null, error: null, count };
    return { data: rows, error: null, count };
  }

  cardinalityError(rowCount) {
    return { code: 'PGRST116', message: `Expected a single row, received ${rowCount}.`, details: null, hint: null };
  }

  buildReturning() {
    if (!this.returning) return '';
    const columns = parseSelection(this.selection);
    if (columns.some((column) => column.kind === 'relation')) throw new Error('Related columns cannot be returned from a mutation.');
    const names = columns.map((column) => column.kind === 'all'
      ? '*'
      : `${quoteIdentifier(column.column)}${column.alias ? ` AS ${quoteIdentifier(column.alias)}` : ''}`);
    return ` RETURNING ${names.join(', ')}`;
  }

  async executeMutation() {
    const params = [];
    const where = this.buildWhere(params);
    if ((this.action === 'update' || this.action === 'delete') && !where) {
      throw new Error(`${this.action.toUpperCase()} queries require at least one filter.`);
    }

    let sql;
    if (this.action === 'insert' || this.action === 'upsert') {
      const rows = Array.isArray(this.payload) ? this.payload : [this.payload];
      if (!rows.length) return { data: [], error: null, count: 0 };
      if (!rows.every((row) => row && typeof row === 'object' && !Array.isArray(row))) throw new Error('Insert payload must contain objects.');
      const columns = [...new Set(rows.flatMap((row) => Object.keys(row)))];
      if (!columns.length) throw new Error('Insert payload cannot be empty.');
      columns.forEach(quoteIdentifier);
      const values = rows.map((row) => `(${columns.map((column) => {
        params.push(row[column] === undefined ? null : row[column]);
        return `$${params.length}`;
      }).join(', ')})`);
      sql = `INSERT INTO ${quoteIdentifier(this.table)} (${columns.map(quoteIdentifier).join(', ')}) VALUES ${values.join(', ')}`;
      if (this.action === 'upsert') {
        const conflictColumns = (this.conflictColumns || 'id').split(',').map((column) => column.trim());
        conflictColumns.forEach(quoteIdentifier);
        const updatedColumns = columns.filter((column) => !conflictColumns.includes(column));
        const conflictAction = updatedColumns.length
          ? `DO UPDATE SET ${updatedColumns.map((column) => `${quoteIdentifier(column)} = EXCLUDED.${quoteIdentifier(column)}`).join(', ')}`
          : 'DO NOTHING';
        sql += ` ON CONFLICT (${conflictColumns.map(quoteIdentifier).join(', ')}) ${conflictAction}`;
      }
    } else if (this.action === 'update') {
      if (!this.payload || typeof this.payload !== 'object' || Array.isArray(this.payload)) throw new Error('Update payload must be an object.');
      const columns = Object.keys(this.payload);
      if (!columns.length) return { data: [], error: null, count: 0 };
      const assignments = columns.map((column) => {
        params.push(this.payload[column]);
        return `${quoteIdentifier(column)} = $${params.length}`;
      });
      sql = `UPDATE ${quoteIdentifier(this.table)} SET ${assignments.join(', ')}${where}`;
    } else {
      sql = `DELETE FROM ${quoteIdentifier(this.table)}${where}`;
    }

    const result = await pool.query(`${sql}${this.buildReturning()}`, params);
    if (this.returning && this.singleMode === 'single' && result.rows.length !== 1) {
      return { data: null, error: this.cardinalityError(result.rows.length), count: result.rowCount };
    }
    if (this.returning && this.singleMode === 'maybeSingle' && result.rows.length > 1) {
      return { data: null, error: this.cardinalityError(result.rows.length), count: result.rowCount };
    }
    return {
      data: this.returning
        ? this.singleMode === 'single' || this.singleMode === 'maybeSingle'
          ? result.rows[0] || null
          : result.rows
        : null,
      error: null,
      count: result.rowCount,
    };
  }

  execute() {
    if (!this.promise) {
      this.promise = (this.action === 'select' ? this.executeSelect() : this.executeMutation())
        .catch((error) => ({
          data: null,
          error: {
            code: error.code || 'DATABASE_ERROR',
            message: error.message,
            details: error.detail || null,
            hint: error.hint || null,
          },
          count: null,
        }));
    }
    return this.promise;
  }

  then(resolve, reject) { return this.execute().then(resolve, reject); }
  catch(reject) { return this.execute().catch(reject); }
  finally(callback) { return this.execute().finally(callback); }
}

const supabase = {
  from: (table) => new PostgresQueryBuilder(table),
};

module.exports = { supabase, PostgresQueryBuilder };