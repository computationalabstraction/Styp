const fs = require("fs");
const gzip = require('zlib').createGzip();
const babel = require("@babel/core");
const util = require('util');
const { argv } = require("process");

const transform = util.promisify(babel.transformFile);

// Dist Gen
function distGen(filename) {
    transform(`${__dirname}/src/${filename}.js`,{"presets":["minify"],"comments":false})
    .then(result => {
        fs.writeFileSync(`${__dirname}/dist/${filename}.min.js`,result.code);
        fs.createReadStream(`${__dirname}/dist/${filename}.min.js`)
        .pipe(gzip)
        .pipe(fs.createWriteStream(`${__dirname}/dist/${filename}.min.js.gz`));
    });
}

if (!fs.existsSync(argv[2])) fs.mkdirSync(argv[2]);
argv.slice(3).forEach(distGen);