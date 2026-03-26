const { joinPool, orderPool } = require("../mysql");

/**
 * @param {string} sql - คำสั่ง SQL
 * @param {Array} params - พารามิเตอร์
 * @param {string} dbType - 'join' หรือ 'order'
 */
async function query(sql, params = [], dbType = 'join') {
  const pool = dbType === 'order' ? orderPool : joinPool;
  try {
    return await pool.query(sql, params);
  } catch (err) {
    if (err.code === "ECONNRESET") {
      return await pool.query(sql, params);
    }
    throw err;
  }
}

async function getConnection(dbType = 'join') {
  const pool = dbType === 'order' ? orderPool : joinPool;
  return await pool.getConnection();
}

module.exports = { query, getConnection };