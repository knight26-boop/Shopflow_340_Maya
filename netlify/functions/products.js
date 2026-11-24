const { getConnection } = require('./lib/db');

exports.handler = async (event) => {
    const headers = {
        'Content-Type': 'application/json'
    };

    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    let connection;

    try {
        connection = await getConnection();

        // Parameterized, read-only query: active products only
        const [rows] = await connection.execute(
            'SELECT product_id, product_name, category, price, stock_quantity FROM products WHERE status = ? ORDER BY product_id',
            ['Active']
        );

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(rows)
        };
    } catch (error) {
        console.error('Database error:', error.code, error.message);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Database connection failed' })
        };
    } finally {
        if (connection) await connection.end();
    }
};
