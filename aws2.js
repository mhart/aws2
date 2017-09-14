var aws2        = exports,
    url         = require('url'),
    crypto      = require('crypto'),
    querystring = require('querystring')

// http://docs.amazonwebservices.com/general/latest/gr/signature-version-2.html

// request: { path | body, [host], [method], [headers], [service], [region] }
// credentials: { accessKeyId, secretAccessKey, [sessionToken] }
function RequestSigner(request, credentials) {

  if (typeof request === 'string') request = url.parse(request)

  var headers = request.headers || {},
      hostParts = this.matchHost(request.hostname || request.host || headers.Host)

  this.request = request
  this.credentials = credentials || this.defaultCredentials()

  this.service = request.service || hostParts[0] || ''
  this.region = request.region || hostParts[1] || 'us-east-1'
}

RequestSigner.prototype.matchHost = function(host) {
  var match = (host || '').match(/^([^\.]+)\.?([^\.]*)\.amazonaws\.com$/)
  return (match || []).slice(1, 3)
}

// http://docs.aws.amazon.com/general/latest/gr/rande.html
RequestSigner.prototype.isSingleRegion = function() {
  // Special case for SimpleDB in us-east-1
  if (this.service === 'sdb' && this.region === 'us-east-1') return true

  return ['cloudfront', 'ls', 'route53', 'iam', 'importexport', 'sts']
    .indexOf(this.service) >= 0
}

RequestSigner.prototype.createHost = function() {
  var region = this.isSingleRegion() ? '' : '.' + this.region
  return this.service + region + '.amazonaws.com'
}

RequestSigner.prototype.matchLocalDate = function(date) {
  var localDate = new Date(Date.now() - (date.getTimezoneOffset() * 60000))
  return localDate.toISOString()
}

RequestSigner.prototype.sign = function() {
  var request = this.request,
      headers = request.headers = (request.headers || {}),
      date = new Date(headers.Date || new Date),
      pathParts = this.pathParts = (request.path || '/').split('?', 2),
      query = request.body || pathParts[1],
      params = this.params = querystring.parse(query)

  if (!request.method && request.body)
    request.method = 'POST'

  if (!headers.Host && !headers.host)
    headers.Host = request.hostname || request.host || this.createHost()
  if (!request.hostname && !request.host)
    request.hostname = headers.Host || headers.host

  if (request.body && !headers['Content-Type'] && !headers['content-type'])
    headers['Content-Type'] = 'application/x-www-form-urlencoded; charset=utf-8'

  if (this.credentials.sessionToken) {
    headers['X-Amz-Security-Token'] = this.credentials.sessionToken
    params.SecurityToken = this.credentials.sessionToken
  }

  params.Timestamp = (request.localTimezone) ? this.matchLocalDate(date) : date.toISOString()
  params.SignatureVersion = '2'
  params.SignatureMethod = 'HmacSHA256'
  params.AWSAccessKeyId = this.credentials.accessKeyId

  if (params.Signature) delete params.Signature
  params.Signature = this.signature()

  query = querystring.stringify(params)

  if (request.body) {
    request.body = query
    headers['Content-Length'] = Buffer.byteLength(request.body)
  } else {
    request.path = pathParts[0] + '?' + query
  }

  return request
}

RequestSigner.prototype.signature = function() {
  return crypto.createHmac('sha256', this.credentials.secretAccessKey)
    .update(this.stringToSign(), 'utf8').digest('base64')
}

RequestSigner.prototype.stringToSign = function() {
  return [
    this.request.method || 'GET',
    (this.request.hostname || this.request.host).toLowerCase(),
    this.pathParts[0] || '/',
    this.canonicalParams()
  ].join('\n')
}

RequestSigner.prototype.canonicalParams = function() {
  var params = this.params
  return Object.keys(params).sort().map(function(key) {
    return querystring.escape(key) + '=' + querystring.escape(params[key])
  }).join('&')
}

RequestSigner.prototype.defaultCredentials = function() {
  var env = process.env
  return {
    accessKeyId:     env.AWS_ACCESS_KEY_ID     || env.AWS_ACCESS_KEY,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY || env.AWS_SECRET_KEY,
    sessionToken:    env.AWS_SESSION_TOKEN
  }
}

aws2.RequestSigner = RequestSigner

aws2.sign = function(request, credentials) {
  return new RequestSigner(request, credentials).sign()
}
