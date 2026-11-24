const mysql = require('mysql2/promise');

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
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: Number(process.env.DB_PORT),
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            dateStrings: true,
            ssl: {
                ca: process.env.DB_CA_CERT.replace(/\\n/g, '\n'),
                rejectUnauthorized: true
            }
        });

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
        console.error('Search error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Search failed' })
        };
    } finally {
        if (connection) await connection.end();
    }
};
