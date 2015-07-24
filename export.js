var Api = require('./api.js');
var Query = require('./query.js');

var Promise = require('promise');
var Path = require('path');
var util = require('util');
var Temp = require('temp');
var fs = require('fs');
var archiver = require('archiver');

var createZip = function (path) {
    return new Promise(function (resolve, reject) {
        var outputPath = "./export.zip";
        var output = fs.createWriteStream(outputPath);

        var zipArchive = archiver('zip');
        zipArchive.pipe(output);
        zipArchive.bulk([{
            src: ['**/*'],
            cwd: path,
            expand: true
        }]);

        output.on('close', function () {
            console.log('done with the zip', outputPath, zipArchive.pointer() + ' total bytes');
            resolve();
        });

        zipArchive.on('error', function (err) {
            reject(err);
        });

        zipArchive.finalize();
    });
};

var saveClass = function (className, data) {
    return new Promise(function (resolve, reject) {
        var fileName = tempDir + "/" + className + ".json";
        fs.writeFile(fileName, JSON.stringify(data, null, 4), function (err) {
            if (err) {
                reject(err);
            } else {
                console.log("JSON saved to '" + fileName + "'");
                resolve();
            }
        });
    });
};

var downloadClass = function (api, className) {
    var rows = [];
    return Query.loadClass(api, className, function (newChuck) {
        console.log("class:" + className + " + " + newChuck.length + " rows");
        rows = rows.concat(newChuck);
    }).then(function () {
        console.log("class:" + className + " - total:" + rows.length + " rows");
        var data = {
            'results': rows
        };
        return saveClass(className, data);
    });
};

//*********

var api;

Temp.track()
var tempDir = Temp.mkdirSync();

if (process.argv.length != 3) {
    console.log("Usage: " + process.argv[0] + " " + Path.basename(process.argv[1]) + " <config>");
    return;
} else {
    var cfg = process.argv[2];
    api = new Api(cfg);
}

console.log("Start !!!");
console.log("Output: " + tempDir);

Query.getSchema(api).then(function (res) {
    var downloads = [];
    res.results.forEach(function (item) {
        console.log("-" + item.className + " Start !!!");
        downloads.push(downloadClass(api, item.className));
    });
    return Promise.all(downloads);
}).then(function () {
    return createZip(tempDir);
}).then(function () {
    console.log("Done !!!");
}, function (error) {
    console.log("Export error: " + error);
});
