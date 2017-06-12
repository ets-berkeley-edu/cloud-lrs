# Cloud LRS AWS deployment

For cloud deployments, LRS uses Amazon Web Services(AWS) component called Elastic Beanstalk(EB). The following document details the set up of the AWS and EB command line interface and steps to deploy LRS on EB.

## Install aws cli and eb cli.

```
brew install awscli
or
pip install awscli
```

For more information on installations refer this link:
http://docs.aws.amazon.com/cli/latest/userguide/installing.html#install-bundle-other-os

### Configure aws credentials

```
aws configure
AWS Access Key ID [None]: AKIAIOSFODNN7EXAMPLE
AWS Secret Access Key [None]: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
Default region name [None]: us-east-1
Default output format [None]: ENTER
```

### Install eb cli

The EB CLI is a command line client that you can use to create, configure, and manage Elastic Beanstalk environments. The EB CLI is developed in Python and requires Python version 2.7, version 3.4, or newer.

```
brew install python
pip install --upgrade pip
pip install --upgrade --user awsebcli
```

eb is installed to the Python bin directory; add it to your path.

```
export PATH=~/Library/Python/2.7/bin:$PATH
```

For more detais on install eb refer:
http://docs.aws.amazon.com/elasticbeanstalk/latest/dg/eb-cli3-install.html


## Prepare the LRS deployment package

### Clone the Cloud LRS codebase

```
git clone git://github.com/ets-berkeley-edu/cloud-lrs.git
```

### Packages & Dependencies

Ensure you have the following packages installed and available in your `$PATH`:

  * Node.JS(v6.9.1) and NPM
  * npm install -g bower

Install Node modules in package.json

```
npm install
bower install
```
Cloud LRS references caliper-js sensor code for Caliper statement validation. Caliper v1.1 is not available for public release yet from IMS. Download and manually add caliper-js-develop from IMS private repo as an npm dependency using the following command.

```
npm install /path/to/caliper-js
```

### Run and Test Cloud LRS locally.
The LRS starts listening on port 2000.

```
node app
```

### Note:
Remove .git references before proceeding with eb cli deployment.
Cloud LRS currently uses a few dependencies which part of private git repositories. Currently eb configurations set up does not have private git repo resolution support. The sequence of eb deployment steps include preparing the LRS package and shipping it to Elastic Beanstalk via eb cli.


## Deploying your application to Elastic Beanstalk via eb cli

1. Open the terminal and go to your node application folder
2. Run eb init to initialize the beanstalk application. For fresh environments the following prompts will appear
    - Default region - This will be the EC2 location for the application. Choose the nearest one
    - AWS security credentials
    - EB application name (Eg: cloud-lrs)
    - Choice of programming language/framework that your application will be using. In our case Node.js
3. Use eb create to create new environments like dev, prod, qa, beta etc. Be sure to specify EB_ENVIRONMENT variable with the environment name.
4. The .ebextension folder contains all the custom configurations required to run the Cloud LRS application on the environment.
4. This should deploy the Cloud LRS application to Elastic Beanstalk.
5. For subsequent deploys to push local changes use eb deploy.
6. To terminate the environments use eb terminate.

```
eb init
eb create cloud-lrs-dev --envvars EB_ENVIRONMENT=cloud-lrs-dev
eb deploy
eb terminate
```

For the full list of EB CLI commands:
https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/eb3-cmd-commands.html

For more detailed eb configuration explanation refer [AWS Elastic Beanstalk ETS developer guide](https://docs.google.com/a/berkeley.edu/document/d/1yKTSLWvcQYASYvv77QXwxLt-8VaEDMiEzNB9p6ir2sU/edit?usp=sharing)
