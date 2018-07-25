# Cloud LRS

Cloud LRS is a Learning Record Store, a central place for collecting and storing interoperable Learning Activities from multiple campus systems. It can store statements in compliance with xAPI(v1.0) and IMS Caliper(v1.1) formats.

### PostgreSQL

Cloud LRS uses PostgreSQL as its database to store the statements. In order to set up PostgreSQL and the required database and database users, the following steps should be taken:


# Install postgres

```
brew install postgresql
```
# Start postgres

```
postgres -D /usr/local/var/postgres
```

# Create a database and user from schema.sql
```
dropdb cloudlrs
createuser cloudlrs --pwprompt          # The default config assumes the password "cloudlrs"
createdb cloudlrs --owner=cloudlrs

psql -d cloudlrs -f config/schema.sql   # recreate DB from schema.sql
```
# ... and a test database and user

```
createuser cloudlrstest --pwprompt   # The default config assumes the password "cloudlrs"
createdb cloudlrstest --owner=cloudlrstest
```

# Taking DB backups & restore
```
pg_dump -d cloudlrs > schema.sql    # for text file
pg_dump -Fc cloudlrs > db.dump      # for pg compliant

pg_restore -d cloudlrs db.dump      # recreate it from dump file
```

### Cloud LRS - Local Deployment

In order to install and start the Cloud LRS app server, the following steps should be taken:

# Clone the Cloud LRS codebase

```
git clone git://github.com/ets-berkeley-edu/cloud-lrs.git
```

# Dependencies

## Packages

Ensure you have the following packages installed and available in your `$PATH`:

  * Node.JS(v6.14.3) and NPM
  * npm install -g bower

## Install Node modules in package.json

```
npm install
bower install
```
Cloud LRS references caliper-js sensor code for Caliper statement validation. Caliper v1.1 is not available for public release yet from IMS. Download and manually add caliper-js-develop from IMS private repo as an npm dependency using the following command.

```
npm install /path/to/caliper-js
```

# Run Cloud LRS. The LRS starts listening on port 2000.

```
node app
```

# Create a tenant & write credentials for tenant app after successful node deployment.

```
insert into tenants values(<tenant-id>, '<tenant_api_domain>', '<tenant-name>', '<tenant_api_key>', '<lti_key>', '<lti_secret>', <ssl = false>, '<logo>', now(), now());

insert into credentials values(<id>, '<app-name>', '<description>', '<key>', '<secret>', '<anonymous-flag>', '<read_permission-flag>', '<write_permission-flag>', '<datashare-flag>', now(), now(), <tenant-id>);

```

# Deploying Cloud LRS using Apache

## Apache
Cloud LRS uses Apache as its reverse proxy. Rename the file in config/default.json (If not it gets overwritten during commits). Set the apache documentRoot and logDirectory in the config/<config>.json file.

Cloud LRS also contains a script that will generate an Apache config file based on the project's configuration. This script can be run by executing the following command from the project's root folder:

```
node apache/apache.js
```

This will generate an Apache config file at `apache/cloudlrs.conf`, which can be included into the main Apache config file.
Copy the cloudlrs.conf to  /path/to/apache2 directory (Eg: /usr/local/etc/apache2)

Include the cloudlrs.conf Apache config file by adding this line to httpd.conf

```
Include /path/to/apache2/cloudlrs.conf
```

Restart Apache

```
sudo apachectl restart
```

## Deployment script
Cloud LRS contains a deployment script that can be used to deploy the latest code. The script installs all dependencies in package json, generates static assets and drops it under /public folder. By default the DOCUMENT_ROOT is set to /var/www/html/ and the static assets are dropped into the folder.

Update the paths in deploy/start.sh  for caliper-js-develop dependency and LOG_DIR for forever logs.


To start Cloud LRS app server

```
./deploy/start.sh
```

To stop Cloud LRS app server

```
./deploy/stop.sh
```

## Learning Statements (currently in xAPI and Caliper format).
The LRS uses Basic Authentication and accepts Learning statements using cloudlrs-ingest-microservice.

The xAPI statements are validated using https://github.com/ets-berkeley-edu/xapi-validator.git before incorporating into the LRS.
