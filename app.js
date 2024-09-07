const express = require("express");
const mysql = require("mysql");
const cors = require("cors");

const app = express();

// Middleware to extract info from the HTML
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.json());

app.get("/", (req, res) =>
  res.send(
    '<body style="background-color: bisque;" ><h3>The server is running ...</h3></body>'
  )
);

// Database connection
const connection = mysql.createConnection({
  user: "mydb",
  password: "mastewaltakele7",
  host: "localhost",
  database: "mydb",
  port: 3306
});


connection.connect((err) => {
  if (err) console.log(err);
  console.log("Connected to MySQL");
});

// Route to create tables     (get no need body)
app.get("/create-table", (req, res) => {
  let name = `CREATE TABLE if not exists customers(customer_id int auto_increment, name VARCHAR(255) not null, PRIMARY KEY (customer_id))`;

  let address = `CREATE TABLE if not exists address(address_id int auto_increment, customer_id int(11) not null, address VARCHAR(255) not null, PRIMARY KEY (address_id), FOREIGN KEY (customer_id) REFERENCES customers (customer_id))`;

  let company = `CREATE TABLE if not exists company(company_id int auto_increment, customer_id int(11) not null, company VARCHAR(255) not null, PRIMARY KEY (company_id), FOREIGN KEY (customer_id) REFERENCES customers (customer_id))`;

  connection.query(name, (err, results) => {
    if (err) console.log(`Error Found: ${err}`);
  });

  connection.query(address, (err, results) => {
    if (err) console.log(`Error Found: ${err}`);
  });

  connection.query(company, (err, results) => {
    if (err) console.log(`Error Found: ${err}`);
  });

  res.end("Tables Created");
  console.log("Tables Created");
});

// Route to insert customer information
app.post("/insert-customers-info", (req, res) => {
  const { name, address, company } = req.body;
  let insertName = `INSERT INTO customers (name) VALUES ('${name}')`;

  connection.query(insertName, (err) => {
    if (err) console.log(`Error Found: ${err}`);
  });

  connection.query(`SELECT * FROM customers WHERE name = "${name}"`, (err, rows) => {
    let nameAdded_id = rows[0].customer_id;

    let insertAddress = `INSERT INTO address (customer_id,address) VALUES ("${nameAdded_id}", "${address}")`;
    let insertCompany = `INSERT INTO company (customer_id,company) VALUES ("${nameAdded_id}", "${company}")`;

    connection.query(insertAddress, (err) => {
      if (err) console.log(`Error Found: ${err}`);
    });
    connection.query(insertCompany, (err) => {
      if (err) console.log(`Error Found: ${err}`);
    });
  });
  res.status = 200
  res.end("Data inserted to tables");
  console.log("Data inserted to tables");
});

// Route to retrieve all customer data
app.get("/customers", (req, res) => {
  connection.query(
    "SELECT customers.customer_id AS ID, customers.name, address.address, company.company FROM customers JOIN address ON customers.customer_id = address.customer_id JOIN company ON customers.customer_id = company.customer_id",
    (err, results) => {
      if (err) console.log("Error During selection", err);
      res.send(results);
    }
  );
});

// Route to retrieve a customer by ID
app.get("/customers/:id", (req, res) => {
  connection.query(
    `SELECT customers.customer_id AS ID, customers.name FROM customers WHERE customers.customer_id = ${req.params.id}`,
    (err, customerResults) => {
      if (err) console.log("Error During selection", err);

      connection.query(
        `SELECT address.address FROM address WHERE address.customer_id = ${req.params.id}`,
        (err, addressResults) => {
          if (err) console.log("Error During selection", err);

          connection.query(
            `SELECT company.company FROM company WHERE company.customer_id = ${req.params.id}`,
            (err, companyResults) => {
              if (err) console.log("Error During selection", err);
              res.send({
                id: customerResults[0]?.ID,
                name: customerResults[0]?.name,
                address: addressResults[0]?.address,
                company: companyResults[0]?.company,
              });
            }
          );
        }
      );
    }
  );
});

// Route to update a customer's name
app.put("/update", (req, res) => {
  const { newName, newAddress, newCompany, id } = req.body;

  // Start transaction
  connection.beginTransaction((err) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error starting transaction.");
    }

    // Update customers table
    let updateCustomerQuery = `
      UPDATE customers
      SET name = ?
      WHERE customer_id = ?;
    `;

    connection.query(updateCustomerQuery, [newName, id], (err, result) => {
      if (err) {
        return connection.rollback(() => {
          console.error(err);
          res.status(500).send("Error updating customer name.");
        });
      }

      // Update address table
      let updateAddressQuery = `
        UPDATE address
        SET address = ?
        WHERE customer_id = ?;
      `;

      connection.query(updateAddressQuery, [newAddress, id], (err, result) => {
        if (err) {
          return connection.rollback(() => {
            console.error(err);
            res.status(500).send("Error updating address.");
          });
        }

        // Update company table
        let updateCompanyQuery = `
          UPDATE company
          SET company = ?
          WHERE customer_id = ?;
        `;

        connection.query(updateCompanyQuery, [newCompany, id], (err, result) => {
          if (err) {
            return connection.rollback(() => {
              console.error(err);
              res.status(500).send("Error updating company.");
            });
          }

          // Commit transaction
          connection.commit((err) => {
            if (err) {
              return connection.rollback(() => {
                console.error(err);
                res.status(500).send("Error committing transaction.");
              });
            }

            console.log("Transaction Complete.");
            res.status(200)
            res.send("Customer updated successfully!");
          });
        });
      });
    });
  });
});



// Route to delete a customer
app.delete("/remove-user", (req, res) => {
  const { id } = req.body;
  let removeName = `DELETE FROM customers WHERE customer_id = '${id}'`;
  let removeAddress = `DELETE FROM address WHERE customer_id = '${id}'`;
  let removeCompany = `DELETE FROM company WHERE customer_id = '${id}'`;

  connection.query(removeAddress, (err, result) => {
    if (err) throw err;
    console.log(result.affectedRows + " record(s) Deleted");
  });

  connection.query(removeCompany, (err, result) => {
    if (err) throw err;
    console.log(result.affectedRows + " record(s) Deleted");
  });

  connection.query(removeName, (err, result) => {
    if (err) throw err;
    console.log(result.affectedRows + " record(s) Deleted");
  });

  res.send("Customer deleted");
});

const port = 2024;
app.listen(port, () => console.log(`Listening on http://localhost:${port}`));
