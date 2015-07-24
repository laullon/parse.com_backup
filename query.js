var Promise = require('promise');
var HTTP = require('https');
var Querystring = require('querystring');
var Parse = require('parse').Parse;

exports.loadClass = function (api, className, onNewChuck) {
    return new Promise(function (resolve, reject) {
        _query(api, className, 0, resolve, onNewChuck);
    });
}

var _query = function (api, className, skip, resolve, onNewChuck) {
    var postData = Querystring.stringify({
        'skip': skip,
        'limit': 1000
    });

    var options = api.prepareRequestOptions("classes/" + className);
    options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
    options.headers['Content-Length'] = postData.length;

    var req = HTTP.request(options, function (res) {
        res.setEncoding('utf8');
        var body = '';
        res.on('data', function (chunk) {
            body += chunk;
        });
        res.on('end', function () {
            var res = JSON.parse(body);
            if (res.results.length != 0) {
                onNewChuck(res.results);
                _query(api, className, skip + res.results.length, resolve, onNewChuck);
            } else {
                resolve();
            }
        });
    });
    req.on('error', function (e) {
        console.log('problem with request: ' + e.message);
        reject(e);
    });
    req.write(postData);
    req.end();
};

exports.getSchema = function (api) {
    return new Promise(function (resolve, reject) {
        var options = api.prepareRequestOptions("schemas");
        var req = HTTP.request(options, function (res) {
            res.setEncoding('utf8');
            var body = '';
            res.on('data', function (chunk) {
                body += chunk;
            });
            res.on('end', function () {
                var parsed = JSON.parse(body);
                resolve(parsed);
            });
        });
        req.end();
    });
};
