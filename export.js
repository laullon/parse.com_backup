var config = require('./config.js');
var HTTP = require('https');
var URL = require('url');
var Promise = require('promise');
var Querystring = require('querystring');
var FS = require('fs');

var prepareRequestOptions = function (f) {
    var options = URL.parse("https://api.parse.com/1/" + f);
    options.headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Parse-Application-Id': config.parseAppID,
        'X-Parse-Master-Key': config.parseMasterKey,
        'Content-Type': 'application/json'
    };
    return options;
};

var getSchema = function () {
    return new Promise(function (resolve, reject) {
        var options = prepareRequestOptions("schemas");
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

var query = function (className, rows, resolve) {
    var postData = Querystring.stringify({
        'skip': rows.length,
        'limit': 1000
    });

    var options = prepareRequestOptions("classes/" + className);
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
                rows = rows.concat(res.results);
                query(className, rows, resolve);
            } else {
                console.log("class: " + className + " - " + rows.length + " rows");
                var exp = {
                    'results': rows
                };
                resolve(exp);
            }
        });
    });
    req.write(postData);
    req.end();
};

var saveClass = function (className, data) {
    return new Promise(function (resolve, reject) {
        var fileName = "/tmp/" + className + ".json";
        FS.writeFile(fileName, JSON.stringify(data, null, 4), function (err) {
            if (err) {
                reject(err);
            } else {
                console.log("JSON saved to '" + fileName + "'");
                resolve();
            }
        });
    });
};

var downloadClass = function (className) {
    return new Promise(function (resolve, reject) {
        var rows = [];
        query(className, rows, resolve);
    }).then(function (data) {
        return saveClass(className, data);
    });
};

getSchema().then(function (res) {
    var downloads = [];
    res.results.forEach(function (item) {
        downloads.push(downloadClass(item.className));
    });
    return Promise.all(downloads);
}).then(function () {
    console.log("Done !!!");
}, function (error) {
    console.log("error:" + error);
});
