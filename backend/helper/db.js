const { joinPool, orderPool } = require("../mysql");

/**
 * @param {string} sql - คำสั่ง SQL
 * @param {Array} params - พารามิเตอร์
 * @param {string} dbType - 'join' หรือ 'order'
 */
async function query(sql, params = [], dbType = 'join') {
  const pool = dbType === 'order' ? orderPool : joinPool;
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    try {
      return await pool.query(sql, params);
    } catch (err) {
      attempts++;
      if (err.code === "ECONNRESET" && attempts < maxAttempts) {
        console.warn(`⚠️ Database connection reset. Retrying... (Attempt ${attempts}/${maxAttempts})`);
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 500 * attempts));
        continue;
      }
      console.error(`❌ Database Error after ${attempts} attempts:`, err);
      throw err;
    }
  }
}

async function getConnection(dbType = 'join') {
  const pool = dbType === 'order' ? orderPool : joinPool;
  return await pool.getConnection();
}

module.exports = { query, getConnection };