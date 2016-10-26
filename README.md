# Cloud-LRS

Cloud LRS is a Learning Record Store, a central place for collecting and storing interoperable Learning Activities from multiple campus systems.
It can store statements in compliance with xAPI and IMS Caliper formats.

### PostgresSQL

Cloud-LRS uses PostgresSQL as its database to store the statements. In order to set up PostgresSQL and the required database and database users, the following steps should be taken:

```
# Install postgres
brew install postgresql

# Start postgres
postgres -D /usr/local/var/postgres

# Create a database and user
psql template1
  template1=# CREATE USER cloudlrs WITH PASSWORD 'cloudlrs';
    CREATE ROLE
  template1=# CREATE DATABASE cloudlrs;
    CREATE DATABASE
  template1=# GRANT ALL PRIVILEGES ON DATABASE cloudlrs TO cloudlrs;
    GRANT

# Create a tenant & write credentials for tenant app.

insert into tenants values(<tenant-id>,'<tenant-name>', '<key>', '<secret>', now(), now());

insert into write_credentials values(<id>,'<app-name>','<key>','<secret>',now(), now(),<tenant-id>);

```

### Cloud LRS - Local Deployment

In order to install and start the Collabosphere app server, the following steps should be taken:

```
# Clone the Cloud-LRS codebase
git clone git://github.com/ets-berkeley-edu/cloud-lrs.git
```

# Dependencies

## Packages

Ensure you have the following packages installed and available in your `$PATH`:

  * Node.JS(v6.2.2) and NPM
  * npm install -g bower

## Install Node modules in package.json

npm install

# Run Cloud-LRS. The LRS starts listening on port 2000.

```
node app
```

## To Do - Apache proxy configs.
