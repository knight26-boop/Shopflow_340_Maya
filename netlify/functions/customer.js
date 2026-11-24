const { getConnection } = require('./lib/db');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

exports.handler = async (event) => {
    const headers = {
        'Content-Type': 'application/json'
    };

    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    // Validate the input before touching the database
    const rawEmail = event.queryStringParameters?.email;
    const email = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : '';

    if (!email) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Email required' })
        };
    }
    if (email.length > 100 || !EMAIL_PATTERN.test(email)) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Please enter a valid email address' })
        };
    }

    let connection;

    try {
        connection = await getConnection();

        // Only the fields the page displays are selected
        const [rows] = await connection.execute(
            `SELECT customer_id, first_name, last_name, email,
                    customer_segment, lifetime_value, status, registration_date
             FROM customers
             WHERE email = ?`,
            [email]
        );

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(rows[0] || null)
        };
    } catch (error) {
        console.error('Lookup error:', error.code, error.message);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Lookup failed' })
        };
    } finally {
        if (connection) await connection.end();
    }
};
