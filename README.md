# Introduction
**urlcheck** is a url monitoring service.
**urlcheck-probe** is used to provision AWS CloudWatch events, AWS SNS subjects and AWS Lambda functions to preform url monitoring.

# Prerequisites
- Node v6.4.x with npm (https://nodejs.org/)
- AWS Command Line Interface (https://aws.amazon.com/cli/)
- AWS access credentials (http://docs.aws.amazon.com/cli/latest/reference/configure/)

# Setup
Apply AWS access credentials
```bash
aws configure
```

Create AWS S3 bucket
```bash
npm run setup
```

# Getting started
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

Set deployment configuration with valid values
```bash
npm config set urlcheck-probe:name=<name>
npm config set urlcheck-probe:template_url=<template_url>
npm config set urlcheck-probe:region=<region>
npm config set urlcheck-probe:api_url=<api_url>
npm config set urlcheck-probe:chunk_size=<chunk_size>
```

Produce deployment package. Upload deployment package & AWS CloudFormation template to AWS S3 bucket. Create AWS CloudFormation stack and wait for completion.
```bash
npm run create
```
