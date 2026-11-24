const { getConnection } = require('./lib/db');

const MAX_SEARCH_LENGTH = 50;

exports.handler = async (event) => {
    const headers = {
        'Content-Type': 'application/json'
    };

    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    // Validate the input before touching the database
    const rawTerm = event.queryStringParameters?.q;
    const searchTerm = typeof rawTerm === 'string' ? rawTerm.trim() : '';

    if (!searchTerm) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Search term required' })
        };
    }
    if (searchTerm.length > MAX_SEARCH_LENGTH) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: `Search term must be ${MAX_SEARCH_LENGTH} characters or fewer` })
        };
    }

    // Escape LIKE wildcards so a typed % or _ is searched literally
    const pattern = `%${searchTerm.replace(/[\\%_]/g, '\\$&')}%`;

    let connection;

    try {
        connection = await getConnection();

        const [rows] = await connection.execute(
            `SELECT product_id, product_name, category, price, stock_quantity
             FROM products
             WHERE (product_name LIKE ? OR category LIKE ?) AND status = 'Active'
             ORDER BY product_name`,
            [pattern, pattern]
        );

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(rows)
        };
    } catch (error) {
        console.error('Search error:', error.code, error.message);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Search failed' })
        };
    } finally {
        if (connection) await connection.end();
    }
};
