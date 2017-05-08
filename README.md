# Introduction
**urlcheck** is a url monitoring service.
**urlcheck-probe** is used to provision AWS CloudWatch events, AWS SNS subjects and AWS Lambda functions to preform url monitoring.

# Prerequisites
- Node v6.4.x with npm (https://nodejs.org/)
- AWS Command Line Interface (https://aws.amazon.com/cli/)
- AWS access credentials (http://docs.aws.amazon.com/cli/latest/reference/configure/)

# Installation
Apply AWS access credentials
```bash
aws configure
```

Clone the repository
```bash
git clone https://github.com/codeaim/urlcheck-probe.git
```

Navigate into the project directory
```bash
cd urlcheck-probe
```

Install dependenices
```bash
npm install
```

Create deployment package
```bash
zip -r deploy.zip index.js node_modules
```

Create AWS S3 bucket
```bash
aws s3api create-bucket --bucket urlcheck-probe --region eu-west-1 --create-bucket-configuration LocationConstraint=eu-west-1
```

Upload deployment package to AWS S3 bucket
```bash
aws s3 cp deploy.zip s3://urlcheck-probe/deploy.zip
```

Upload AWS CloudFormation template to AWS S3 bucket
```bash
aws s3 cp template.yml s3://urlcheck-probe/template.yml
```

Create etdrivingschool-api stack using AWS CloudFormation template. Replace parameter values with valid values.
```bash
aws cloudformation create-stack --stack-name urlcheck-probe --template-url https://s3.amazonaws.com/urlcheck-probe/template.yml --capabilities CAPABILITY_IAM --parameters ParameterKey=ApiUrlParameter,ParameterValue=https://ayq59nzzn4.execute-api.eu-west-1.amazonaws.com/prod ParameterKey=ChunkSizeParameter,ParameterValue=25 ParameterKey=ChecksTopicParameter,ParameterValue=arn:aws:sns:eu-west-1:326341022855:acquired-checks
```
