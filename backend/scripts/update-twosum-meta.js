const { pool } = require('../config/database');

async function update() {
  const qId = '04de79f2-e8e6-45a6-aaf6-2f8f205cb461';
  const res = await pool.query('SELECT options FROM questions WHERE id = $1', [qId]);
  if (res.rows.length > 0) {
    const opts = typeof res.rows[0].options === 'string'
      ? JSON.parse(res.rows[0].options)
      : (res.rows[0].options || {});

    opts.executionMode = 'FUNCTION_BASED';
    opts.className = 'Solution';
    opts.functionName = 'twoSum';
    opts.returnType = 'vector<int>';
    opts.parameters = [
      { name: 'nums', type: 'vector<int>' },
      { name: 'target', type: 'int' }
    ];
    opts.comparisonMode = 'ARRAY';

    await pool.query('UPDATE questions SET options = $1 WHERE id = $2', [JSON.stringify(opts), qId]);
    console.log('Two Sum metadata updated successfully in database!');
  } else {
    console.log('Question not found');
  }
  pool.end();
}

update();
