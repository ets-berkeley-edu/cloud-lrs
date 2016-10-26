# Cloud-LRS

Cloud-LRS is a Learning Record Store, a central place for collecting and storing interoperable Learning Activities from multiple campus systems.
It can store statements in compliance with xAPI and IMS Caliper formats.

### PostgreSQL

Cloud-LRS uses PostgreSQL as its database to store the statements. In order to set up PostgreSQL and the required database and database users, the following steps should be taken:


# Install postgres

```
brew install postgresql
```
# Start postgres

```
postgres -D /usr/local/var/postgres
```

# Create a database and user
```
psql template1
CREATE USER cloudlrs WITH PASSWORD 'cloudlrs';
CREATE DATABASE cloudlrs;
GRANT ALL PRIVILEGES ON DATABASE cloudlrs TO cloudlrs;
```

# Create a tenant & write credentials for tenant app.

```
insert into tenants values(<tenant-id>,'<tenant-name>', '<key>', '<secret>', now(), now());
insert into write_credentials values(<id>,'<app-name>','<key>','<secret>',now(), now(),<tenant-id>);
```

### Cloud-LRS - Local Deployment

In order to install and start the Cloud-LRS app server, the following steps should be taken:

# Clone the Cloud-LRS codebase

```
git clone git://github.com/ets-berkeley-edu/cloud-lrs.git
```

# Dependencies

## Packages

Ensure you have the following packages installed and available in your `$PATH`:

  * Node.JS(v6.2.2) and NPM
  * npm install -g bower

## Install Node modules in package.json

```
npm install
bower install
```

# Run Cloud-LRS. The LRS starts listening on port 2000.

```
node app
```


# Deploying Cloud-LRS using Apache

## Apache
Cloud-LRS uses Apache as its reverse proxy. Rename the file in config/default.json (If not it gets overwritten during commits). Set the apache documentRoot and logDirectory in the config/<config>.json file.

Cloud-LRS also contains a script that will generate an Apache config file based on the project's configuration. This script can be run by executing the following command from the project's root folder:

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
Cloud-LRS contains a deployment script that can be used to deploy the latest code. The script installs all dependencies in package json, generates static assets and drops it under /public folder. By default the DOCUMENT_ROOT is set to /var/www/html/ and the static assets are dropped into the folder.

To start Cloud-LRS app server

```
./deploy/start.sh
```

To stop Cloud-LRS app server

```
./deploy/stop.sh
```

## Privacy Dashboard

The privacy dashboard can be accessed using the URL

```
http://localhost/privacydashboard
```

## Learning Statements (currently in xAPI format).
The LRS uses Basic Authentication and accepts Learning statements using POST and PUT methods.

```
http://localhost/api/statements
```
The xAPI statements are validated using https://github.com/nicolaasmatthijs/xapi-validator before incorporating into the LRS.
