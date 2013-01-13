aws2
----

[![Build Status](https://secure.travis-ci.org/mhart/aws2.png?branch=master)](http://travis-ci.org/mhart/aws2)

A small utility to sign vanilla node.js http(s) request options using Amazon's
[AWS Signature Version 2](http://docs.amazonwebservices.com/general/latest/gr/signature-version-2.html).

This signature is supported by a number of Amazon services, including
[SNS](http://docs.aws.amazon.com/sns/latest/api/),
[RDS](http://docs.aws.amazon.com/AmazonRDS/latest/APIReference/),
[CloudWatch](http://docs.aws.amazon.com/AmazonCloudWatch/latest/APIReference/),
[EC2](http://docs.aws.amazon.com/AWSEC2/latest/APIReference/),
[ElastiCache](http://docs.aws.amazon.com/AmazonElastiCache/latest/APIReference/),
[Elastic MapReduce](http://docs.aws.amazon.com/ElasticMapReduce/latest/API/),
[ImportExport](http://docs.aws.amazon.com/AWSImportExport/latest/API/) and
[SimpleDB](http://docs.aws.amazon.com/AmazonSimpleDB/latest/DeveloperGuide/SDB_API.html).

It also provides defaults for a number of core AWS headers and
request parameters, making it a very easy to query AWS services, or
build out a fully-featured AWS library.

*NB: It is preferrable to use the more secure
[aws4](https://github.com/mhart/aws4) over this library for AWS services
that support AWS Signature Version 4.*

Example
-------

```javascript
var http  = require('http')
  , https = require('https')
  , aws2  = require('aws2')

// given an options object you could pass to http.request
var opts = { host: 'sns.us-east-1.amazonaws.com', path: '/?Action=ListTopics' }

aws2.sign(opts) // assumes AWS credentials are available in process.env

console.log(opts)
/*
{
  host: 'sns.us-east-1.amazonaws.com',
  path: '/?Action=ListTopics&Timestamp=2013-01-12T01%3A25%3A55.553Z&SignatureVersion=2&SignatureMethod=HmacSHA256&AWSAccessKeyId=AKIAIHHJHZVAHCEWLG7A&Signature=LyWO%2B%2B%2BZ6x2i7LvQKcbX5HdiFs995kkyqmyTI5y6LCg%3D',
  headers: { Host: 'sns.us-east-1.amazonaws.com' }
}
*/

// we can now use this to query AWS using the standard node.js http API
http.request(opts, function(res) { res.pipe(process.stdout) }).end()
/*
<?xml version="1.0"?>
<ListTopicsResponse xmlns="http://sns.amazonaws.com/doc/2010-03-31/">
...
*/
```

More options
------------

```javascript
// you can pass AWS credentials in explicitly
aws2.sign(opts, { accessKeyId: '', secretAccessKey: '' })

// aws2 can infer the host from a service and region
opts = aws2.sign({ service: 'sns', region: 'us-east-1', path: '/?Action=ListTopics' })

// create a utility function to pipe to stdout (with https this time)
function request(o) { https.request(o, function(res) { res.pipe(process.stdout) }).end(o.body || '') }

// aws2 can infer the HTTP method if a body is passed in
// method will be POST and Content-Type: 'application/x-www-form-urlencoded; charset=utf-8'
request(aws2.sign({ service: 'monitoring', body: 'Action=ListMetrics&Version=2010-08-01' }))
/*
<ListMetricsResponse xmlns="http://monitoring.amazonaws.com/doc/2010-08-01/">
...
*/

// can specify any custom option or header as per usual
request(aws2.sign({
  service: 'rds',
  region: 'ap-southeast-2',
  method: 'POST',
  path: '/',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  body: 'Action=DescribeDBInstances&Version=2012-09-17'
}))
/*
<DescribeDBInstancesResponse xmlns="http://rds.amazonaws.com/doc/2012-09-17/">
...
*/

// works with all other services that support Signature Version 2

request(aws2.sign({ service: 'ec2', path: '/?Action=DescribeRegions&Version=2012-12-01' }))
/*
<?xml version="1.0" encoding="UTF-8"?>
<DescribeRegionsResponse xmlns="http://ec2.amazonaws.com/doc/2012-12-01/">
...
*/

request(aws2.sign({ service: 'elasticache', path: '/?Action=DescribeCacheClusters&Version=2012-11-15' }))
/*
<DescribeCacheClustersResponse xmlns="http://elasticache.amazonaws.com/doc/2012-11-15/">
...
*/

request(aws2.sign({ service: 'elasticmapreduce', path: '/?Action=DescribeJobFlows&Version=2009-03-31' }))
/*
<DescribeJobFlowsResponse xmlns="http://elasticmapreduce.amazonaws.com/doc/2009-03-31">
...
*/

request(aws2.sign({ service: 'importexport', path: '/?Action=ListJobs&Version=2010-06-01' }))
/*
<ListJobsResponse xmlns="http://importexport.amazonaws.com/doc/2010-06-01/">
...
*/

request(aws2.sign({ service: 'sdb', path: '/?Action=ListDomains&Version=2009-04-15' }))
/*
<?xml version="1.0"?>
<ListDomainsResponse xmlns="http://sdb.amazonaws.com/doc/2009-04-15/">
...
*/
```

API
---

### aws2.sign(requestOptions, [credentials])

This calculates and populates the `Signature` param of either
`requestOptions.path` or `requestOptions.body` depending on whether it is
a `GET` or `POST` request. Returns `requestOptions` as a convenience for
chaining.

`requestOptions` is an object holding the same options that the node.js
[http.request](http://nodejs.org/docs/latest/api/http.html#http_http_request_options_callback)
function takes.

The following properties of `requestOptions` are used in the signing or
populated if they don't already exist:

- `hostname` or `host` (will be determined from `service` and `region` if not given)
- `method` (will use `'GET'` if not given or `'POST'` if there is a `body`)
- `path` (will use `'/'` if not given)
- `body` (will use `''` if not given)
- `service` (will be calculated from `hostname` or `host` if not given)
- `region` (will be calculated from `hostname` or `host` or use `'us-east-1'` if not given)
- `headers['Host']` (will use `hostname` or `host` or be calculated if not given)
- `headers['Content-Type']` (will use `'application/x-www-form-urlencoded; charset=utf-8'`
  if not given and there is a `body`)
- `headers['Date']` (used to calculate the signature date if given, otherwise `new Date` is used)

Your AWS credentials (which can be found in your
[AWS console](https://portal.aws.amazon.com/gp/aws/securityCredentials))
can be specified in one of two ways:

- As the second argument, like this:

```javascript
aws2.sign(requestOptions, {
  secretAccessKey: "<your-secret-access-key>",
  accessKeyId: "<your-access-key-id>"
})
```

- From `process.env`, such as this:

```
export AWS_SECRET_ACCESS_KEY="<your-secret-access-key>"
export AWS_ACCESS_KEY_ID="<your-access-key-id>"
```

(will also use `AWS_ACCESS_KEY` and `AWS_SECRET_KEY` if available)

Installation
------------

With [npm](http://npmjs.org/) do:

```
npm install aws2
```

