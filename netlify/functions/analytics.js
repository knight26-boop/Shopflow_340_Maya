const mysql = require('mysql2/promise');

// Selected read-only views. Revenue = Delivered orders only, quantity * unit_price at the
// order-item grain (same definition as the notebook). No reviews or tickets are joined in.
const QUERIES = {
    'top-products': `
        SELECT
            p.product_name,
            p.category,
            COUNT(DISTINCT oi.order_id) AS order_count,
            ROUND(SUM(oi.quantity * oi.unit_price), 2) AS revenue
        FROM products p
        JOIN order_items oi ON p.product_id = oi.product_id
        JOIN orders o ON oi.order_id = o.order_id
        WHERE o.order_status = 'Delivered'
        GROUP BY p.product_id, p.product_name, p.category
        ORDER BY revenue DESC, p.product_name
        LIMIT 10
    `,
    'segments': `
        SELECT
            c.customer_segment,
            COUNT(DISTINCT c.customer_id) AS customer_count,
            COUNT(DISTINCT o.order_id) AS total_orders,
            ROUND(SUM(oi.quantity * oi.unit_price), 2) AS actual_revenue
        FROM customers c
        LEFT JOIN orders o
            ON c.customer_id = o.customer_id
           AND o.order_status = 'Delivered'
        LEFT JOIN order_items oi ON o.order_id = oi.order_id
        WHERE c.status = 'Active'
        GROUP BY c.customer_segment
        ORDER BY actual_revenue DESC, c.customer_segment
    `,
    'revenue': `
        SELECT
            p.category,
            SUM(oi.quantity) AS units_sold,
            ROUND(SUM(oi.quantity * oi.unit_price), 2) AS revenue
        FROM products p
        JOIN order_items oi ON p.product_id = oi.product_id
        JOIN orders o ON oi.order_id = o.order_id
        WHERE o.order_status = 'Delivered'
        GROUP BY p.category
        ORDER BY revenue DESC, p.category
    `,
    'orders': `
        SELECT
            order_status,
            COUNT(*) AS order_count,
            ROUND(SUM(total_amount), 2) AS total_value
        FROM orders
        GROUP BY order_status
        ORDER BY order_count DESC, order_status
    `
};

exports.handler = async (event) => {
    const headers = {
        'Content-Type': 'application/json'
    };

    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    // Only a fixed list of approved queries can run; anything else is rejected before connecting
    const queryType = event.queryStringParameters?.query;
    if (typeof queryType !== 'string' || !Object.prototype.hasOwnProperty.call(QUERIES, queryType)) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Invalid query type' })
        };
    }

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

        const [rows] = await connection.execute(QUERIES[queryType]);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(rows)
        };
    } catch (error) {
        console.error('Analytics error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Analytics query failed' })
        };
    } finally {
        if (connection) await connection.end();
    }
};
