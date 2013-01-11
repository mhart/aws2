var should = require('should')
  , aws2   = require('../')
  , cred   = { accessKeyId: 'ABCDEF', secretAccessKey: 'abcdef1234567890' }
  , date   = 'Wed, 26 Dec 2012 06:10:30 GMT'
  , path   = '/?Action=ListQueues&Version=2009-02-01'
  , sig    = /Signature=DLYbFaqPn%2BgKVbpNrqA6feoGyczH%2B30nNmlFYGS18yk%3D/

describe('aws2', function() {

  // Save and ensure we restore process.env
  var envAccessKeyId, envSecretAccessKey

  before(function() {
    envAccessKeyId = process.env.AWS_ACCESS_KEY_ID
    envSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
    process.env.AWS_ACCESS_KEY_ID = cred.accessKeyId
    process.env.AWS_SECRET_ACCESS_KEY = cred.secretAccessKey
  })

  after(function() {
    process.env.AWS_ACCESS_KEY_ID = envAccessKeyId
    process.env.AWS_SECRET_ACCESS_KEY = envSecretAccessKey
  })

  describe('#sign() when constructed with string url', function() {
    it('should parse into request correctly', function() {
      var signer = new aws2.RequestSigner('http://sqs.us-east-1.amazonaws.com' + path)
      signer.request.headers = { Date: date }
      signer.sign().path.should.match(sig)
    })
  })

  describe('#sign() with no credentials', function() {
    it('should use process.env values', function() {
      var opts = aws2.sign({ service: 'sqs', path: path, headers: { Date: date } })
      opts.path.should.match(sig)
    })
  })

  describe('#sign() with credentials', function() {
    it('should use passed in values', function() {
      var cred = { accessKeyId: 'A', secretAccessKey: 'B' }
        , opts = aws2.sign({ service: 'sqs', path: path, headers: { Date: date } }, cred)
      opts.path.should.match(/Z0LJr9UHo%2FvePJ8fUhB5fMqog%2Fi6tNHib25%2BItMSfDY%3D/)
    })
  })

  describe('#sign() with no host or region', function() {
    it('should add hostname and default region', function() {
      var opts = aws2.sign({ service: 'sqs', path: path, headers: { Date: date } })
      opts.hostname.should.equal('sqs.us-east-1.amazonaws.com')
      opts.headers['Host'].should.equal('sqs.us-east-1.amazonaws.com')
    })
  })

  describe('#sign() with no host, but with region', function() {
    it('should add correct hostname', function() {
      var opts = aws2.sign({ service: 'glacier', region: 'us-west-1' })
      opts.hostname.should.equal('glacier.us-west-1.amazonaws.com')
      opts.headers['Host'].should.equal('glacier.us-west-1.amazonaws.com')
    })
  })

  describe('#sign() with hostname', function() {
    it('should populate signature correctly', function() {
      var opts = aws2.sign({ hostname: 'sqs.us-east-1.amazonaws.com', path: path, headers: { Date: date } })
      opts.path.should.match(sig)
    })
  })

  describe('#sign() with host', function() {
    it('should populate signature correctly', function() {
      var opts = aws2.sign({ host: 'sqs.us-east-1.amazonaws.com', path: path, headers: { Date: date } })
      opts.path.should.match(sig)
    })
  })

  describe('#sign() with body', function() {
    it('should use POST', function() {
      var opts = aws2.sign({ body: 'SomeAction' })
      opts.method.should.equal('POST')
    })
    it('should set Content-Type', function() {
      var opts = aws2.sign({ body: 'SomeAction' })
      opts.headers['Content-Type'].should.equal('application/x-www-form-urlencoded; charset=utf-8')
    })
  })

  describe('#sign() with many different options', function() {
    it('should populate signature correctly', function() {
      var opts = aws2.sign({
        service: 'dynamodb',
        region: 'ap-southeast-2',
        method: 'DELETE',
        path: '/Some/Path?param=key&param=otherKey',
        body: 'SomeAction=SomeThing&Whatever=SomeThingElse',
        headers: {
          Date: date,
          'Content-Type': 'application/x-amz-json-1.0',
          'X-Amz-Target': 'DynamoDB_20111205.ListTables'
        }
      })
      opts.body.should.match(/S6APdJvQ%2FjqP0sBWs8x5r5LEx%2FWAy8n1taoexmznBp8%3D/)
    })
  })

})

