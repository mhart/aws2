var http  = require('http'),
    https = require('https'),
    aws2  = require('aws2')

// given an options object you could pass to http.request
var opts = { host: 'sdb.amazonaws.com', path: '/?Action=ListDomains&Version=2009-04-15' }

// alternatively (as aws2 can infer the host):
opts = { service: 'sdb', path: '/?Action=ListDomains&Version=2009-04-15' }

aws2.sign(opts) // assumes AWS credentials are available in process.env

console.log(opts)
/*
{
  host: 'importexport.amazonaws.com',
  path: '/?Action=ListJobs&Timestamp=2013-01-12T01%3A25%3A55.553Z&SignatureVersion=2&SignatureMethod=...'
  headers: { Host: 'importexport.amazonaws.com' }
}
*/

// we can now use this to query AWS using the standard node.js http API
http.request(opts, function(res) { res.pipe(process.stdout) }).end()
/*
<ListDomainsResponse xmlns="http://sdb.amazonaws.com/doc/2009-04-15/">
...
*/

// you can pass AWS credentials in explicitly (otherwise taken from process.env)
aws2.sign(opts, { accessKeyId: '', secretAccessKey: '' })

// create a utility function to pipe to stdout (with https this time)
function request(o) { https.request(o, function(res) { res.pipe(process.stdout) }).end(o.body || '') }

// aws2 can infer the HTTP method if a body is passed in
// method will be POST and Content-Type: 'application/x-www-form-urlencoded; charset=utf-8'
request(aws2.sign({ service: 'importexport', body: 'Action=ListJobs&Version=2010-06-01' }))
/*
<ListJobsResponse xmlns="http://importexport.amazonaws.com/doc/2010-06-01/">
...
*/

// can specify any custom option or header as per usual
request(aws2.sign({
  service: 'importexport',
  method: 'POST',
  path: '/',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  body: 'Action=ListJobs&Version=2010-06-01'
}))
/*
<ListJobsResponse xmlns="http://importexport.amazonaws.com/doc/2010-06-01/">
...
*/
