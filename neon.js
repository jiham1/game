const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    savePlayer: async (player) => {
        const sql = `
            INSERT INTO users (username, hp, gold, level, exp, inventory)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (username) DO UPDATE
            SET hp = $2, gold = $3, level = $4, exp = $5, inventory = $6;
        `;
        return pool.query(sql, [
            player.name,
            player.hp,
            player.gold,
            player.level,
            player.exp,
            JSON.stringify(player.inventory)
        ]);
    }
};
