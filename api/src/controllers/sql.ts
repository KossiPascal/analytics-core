
import { getConnection } from 'typeorm';

async function complexQuery() {
    try {
        const connection = getConnection(); // Assuming you already have a connection configured
        
        const query = `
            SELECT t1.*, t2.*, t3.*
            FROM table1 t1
            INNER JOIN table2 t2 ON t1.column_name = t2.column_name
            INNER JOIN table3 t3 ON t2.column_name = t3.column_name
            WHERE t1.some_condition = :condition
            ORDER BY t1.some_column
        `;
        
        const result = await connection.query(query, [{ condition: 'some_value' }]);
        
        console.log(result);
    } catch (error) {
        console.error('Error executing complex query:', error);
    }
}

// // Call the function to execute the query
// complexQuery();



// // import { getConnection } from 'typeorm';

// // async function complexQuery() {
// //     try {
// //         const connection = getConnection(); // Assuming you already have a connection configured
        
// //         const query = `
// //             SELECT
// //                 p.id AS product_id,
// //                 p.name AS product_name,
// //                 SUM(oi.quantity) AS total_quantity,
// //                 SUM(oi.quantity * oi.unit_price) AS total_revenue
// //             FROM
// //                 orders o
// //                 JOIN order_items oi ON o.id = oi.order_id
// //                 JOIN products p ON oi.product_id = p.id
// //             GROUP BY
// //                 p.id, p.name
// //             ORDER BY
// //                 total_revenue DESC
// //         `;
        
// //         const result = await connection.query(query);
        
// //         console.log(result);
// //     } catch (error) {
// //         console.error('Error executing complex query:', error);
// //     }
// // }

// // // Call the function to execute the query
// // complexQuery();



// // import { getConnection } from 'typeorm';

// // async function complexQuery() {
// //     try {
// //         const connection = getConnection(); // Assuming you already have a connection configured
        
// //         const query = `
// //             SELECT
// //                 c.id AS customer_id,
// //                 c.name AS customer_name,
// //                 SUM(oi.quantity * oi.unit_price) AS total_revenue
// //             FROM
// //                 customers c
// //                 JOIN orders o ON c.id = o.customer_id
// //                 JOIN order_items oi ON o.id = oi.order_id
// //                 JOIN products p ON oi.product_id = p.id
// //             WHERE
// //                 o.order_date >= DATE_SUB(NOW(), INTERVAL 1 YEAR)
// //             GROUP BY
// //                 c.id, c.name
// //             ORDER BY
// //                 total_revenue DESC
// //             LIMIT
// //                 10
// //         `;
        
// //         const result = await connection.query(query);
        
// //         console.log(result);
// //     } catch (error) {
// //         console.error('Error executing complex query:', error);
// //     }
// // }

// // // Call the function to execute the query
// // complexQuery();



// // import { getConnection } from 'typeorm';

// // async function complexQuery() {
// //     try {
// //         const connection = getConnection(); // Assuming you already have a connection configured
        
// //         const query = `
// //             SELECT
// //                 c.city AS customer_city,
// //                 cat.name AS category_name,
// //                 SUM(oi.quantity * oi.unit_price) AS total_revenue
// //             FROM
// //                 customers c
// //                 JOIN orders o ON c.id = o.customer_id
// //                 JOIN order_items oi ON o.id = oi.order_id
// //                 JOIN products p ON oi.product_id = p.id
// //                 JOIN categories cat ON p.category_id = cat.id
// //             WHERE
// //                 o.order_date BETWEEN :start_date AND :end_date
// //             GROUP BY
// //                 c.city, cat.name
// //             ORDER BY
// //                 customer_city, total_revenue DESC
// //         `;
        
// //         const startDate = '2024-01-01';
// //         const endDate = '2024-12-31';

// //         const result = await connection.query(query, { start_date: startDate, end_date: endDate });
        
// //         console.log(result);
// //     } catch (error) {
// //         console.error('Error executing complex query:', error);
// //     }
// // }

// // // Call the function to execute the query
// // complexQuery();
