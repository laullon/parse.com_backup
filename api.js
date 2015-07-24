var Config = require('./config.js');

var URL = require('url');
var Parse = require('parse').Parse;

function Api(cfg) {
    if (typeof this !== 'object') {
        throw new TypeError('Api must be constructed via new');
    }

    if (Config.keys[cfg]) {
        this.parseAppID = Config.keys[cfg].parseAppID;
        this.parseMasterKey = Config.keys[cfg].parseMasterKey;
    } else {
        throw new TypeError("Configuration '" + cfg + "' doesn't exists");
    }
}

Api.prototype.prepareRequestOptions = function (f) {
    var options = URL.parse("https://api.parse.com/1/" + f);
    options.headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Parse-Application-Id': this.parseAppID,
        'X-Parse-Master-Key': this.parseMasterKey,
        'Content-Type': 'application/json'
    };
    return options;
};

module.exports = Api;
