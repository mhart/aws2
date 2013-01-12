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

