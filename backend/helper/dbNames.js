require("dotenv").config();

function requireEnv(key) {
  const value = process.env[key];
  if (!value) {
    throw new Error(`[Config]: Missing required env variable: ${key}`);
  }
  return value;
}

module.exports = {
  JOIN_DB: requireEnv("DBSQL"),
  ORDER_DB: requireEnv("DBSQL_ORDER"),
};
