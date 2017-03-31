// import { readFileSync } from 'fs';
var readFileSync = require('fs').readFileSync;
var parser = require('./parser.js').default;

var options = {
    files: [
        'TOOLKIT_FATHERSDAY_2016_v2-cecile.svg'
    ]
}

options.files.forEach(function(filename) {
    const svg = readFileSync(filename, 'utf8');
    const json = parser(filename)(svg);
});