1)    The project's purpose is to practice creating a usable database. All data is realistic, instructor-provided fictional data
    
2)    The complete data flow: Browser → Netlify page → Netlify Function/API → Aiven MySQL → JSON → Browser
    The browser does not connect directly to the database. The read-only account is used by each Netlify function to run approved and parameterized queries over a TLS connection. The function returns its result in JSON, and the browser turns it into what the user sees.
        
3)    The seven tables: customers, products, orders, order_items, reviews, abandoned_carts and support_tickets
    Key relationships: 
            One customer → many orders (`orders.customer_id`)
            One order → many order items (`order_items.order_id`)
            One product → many order items (`order_items.product_id`)
            One product → many reviews (`reviews.product_id`)
            One customer → many reviews (`reviews.customer_id`)
            One customer → many abandoned carts (`abandoned_carts.customer_id`)
            One customer → many support tickets (`support_tickets.customer_id`)
            One order → many support tickets (`support_tickets.order_id`)
    The mapping product_reviews.csv → reviews:
            customers_data.csv → customers
            products_catalog.csv → products
            orders_history.csv → orders
            order_items_detail.csv → order_items
            product_reviews.csv → reviews
            abandoned_carts.csv → abandoned_carts
            customer_support_tickets.csv → support_tickets
    
4)    Some of the most important cleaning decisions from the notebook were:
    - Raw files were read as text so that no leading zeros were accidentally removed, even though this meant some values like NULL were also just text until later.
    - Formats for phone numbers were standardized, so 8 different formats became one. 
    - products.created_date was intentionally stored as month/day/year to keep standardization.
    Some of the most important validation decisions from the notebook were:
    - Parents were loaded before children, with a foreign key check before each child table to prevent child rows from pointing to a table that does not exist yet.
    - THe load was validated by reading it back from MySQL so the data is double-checked to be correct.
    - A control total was computed in pandas and MySQL to make sure the numbers that the business questions relied on were correct.

  
5)   The selected queries or database views shown on the website and how their results were verified against the notebook
    Elements like the search bar, customer lookup, and analytic views are all based on information from queries to the database. I verified the information given by comparing the display to the data in the notebook. For example, delivered total revenue shows as $6,149.17 on the website and in cell 7 in the notebook.
    
6)    Why avnadmin is used only for setup and shopflow_reader is used by the website
    avadmin is used only for setup, while shopflow_reader is used by the website because we are practicing least privilege. Since the admin user has more power and can do things that are not needed on the website end, we created the reader user to access what needs to be accessed without giving them the unnecessary power to maliciously mess things up.
    
7)    Setup and testing instructions using placeholder values only
    - Install node.js
    - run npm install
    - created .env with real info based on .env.example, making sure not to share it
    - run npm run dev
    - push repo to github
    - import repository to Netlify
    - add env vars
    - deployed environment
    - created envcheck.js to check env variables and connection info for troubleshooting
