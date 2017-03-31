import uuidV4 from 'uuid/v4';
import fs from 'fs-extra';
import http from 'http';
import { exec } from 'child_process';
import path from 'path';
import svg2png from 'svg2png';

const { PORT } = process.env;

const SVG2PNG_PATH = path.resolve('./node_modules/.bin/svg2png');

const getFilepath = path => tmpDir => filename => path.resolve(`${tmpDir}/${filename}`);
const getPngFilepath = path => tmpDir => filename => path.resolve(`${tmpDir}/${filename.replace('svg', 'png')}`);
const getSvg2pngOptions = svgFilename => pngFilename => width => height => [svgFilename, '-v ', `-o ${pngFilename}`, `-w ${width}`, `-h ${height}`];

const cleaningPrevious = then => {
    fs.readdir('./tmp', (err, dirList) => {
        if (err) {
            return then;
        } else {
            dirList.forEach(dir => {
                dir = `./tmp/${dir}`;
                fs.readdir(dir, (err, fileList) => {
                    if (fileList) {
                        if (fileList.length) {
                            const splittedFilenames = fileList.map(filename => filename.split('.'));
                            const extensions = splittedFilenames.map(splitted => splitted.slice(splitted.length - 1)[0]);
                            const extensionsCheck = extensions.includes('svg') && extensions.includes('png');
                            const filenames = splittedFilenames.map(splitted => splitted.slice(0, splitted.length - 1).join('.'));
                            const filenamesMatch = filenames.length === 2 && filenames[0] === filenames[1];
                            const allGood = extensionsCheck && filenamesMatch;
                            if (allGood) {
                                fileList.forEach(filename => {
                                    const toBeRemoved = `${dir}/${filename}`;
                                    console.info('...', 'toBeRemoved', toBeRemoved);
                                    const removed = fs.removeSync(toBeRemoved);
                                    if (removed) {
                                        console.info(`OK : while removing : ${toBeRemoved}`);
                                        return true;
                                    } else {
                                        console.error(`ERROR : while removing : ${toBeRemoved}`);
                                    }
                                });
                            }
                        }
                        fs.remove(dir, err => {
                            if (err) {
                                console.error(`ERROR : while removing ${dir}`);
                            } else {
                                console.info(`OK : while removing ${dir}`);
                            }
                        });
                    }
                });
            });
            return then;
        }
    });
};

const handleRequest = (req, res, next) => {
    const tmpDir = `./tmp/${uuidV4()}`;
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Request-Method', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET');
    res.setHeader('Access-Control-Allow-Headers', '*');

    console.info('#########', 'req.url', req.url);

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        return res.end();
    }

    if (req.method === 'POST') {
        // const parsed = req.url.match(/svg2png\/([\w\.]+)\/(\d+)\/(\d+)/i);
        // if (parsed) {
        //     const [url, filename, width, height] = parsed;
        //     if (!filename || !width || !height) {
        //         return res.end(409, 'usage: POST /svg2png/:filename/:width/:height with svg content inside body');
        //     }

        //     let svg = '';
        //     req.on('data', chunk => svg += chunk.toString());
        //     req.on('end', () => {
        //         fs.ensureDir(tmpDir, err => {
        //             if (err) {
        //                 fs.removeSync(tmpDir);
        //                 return res.end(500, err);
        //             }
        //             const svgFilename = getFilepath(path)(tmpDir)(filename);
        //             const pngFilename = getPngFilepath(path)(tmpDir)(filename);
        //             console.info('...', 'svgFilename', svgFilename, svg);
        //             fs.writeFile(svgFilename, svg, 'utf-8', err => {
        //                 if (err) {
        //                     fs.removeSync(tmpDir);
        //                     return res.end(500, err);
        //                 }
        //                 const options = getSvg2pngOptions(svgFilename)(pngFilename)(width)(height);
        //                 console.info(`svg2png ${tmpDir}/${filename} -o ${tmpDir}/${filename.replace('svg', 'png')} -w ${width} -h ${height}`);

        //                 return exec(`${SVG2PNG_PATH} ${options.join(' ')}`, (err, stdout, stderr) => {
        //                     if (err) {
        //                         console.error('###', 'error', err);
        //                         fs.removeSync(tmpDir);
        //                         return res.end(500, err);
        //                     }

        //                     const s = fs.createReadStream(pngFilename);
        //                     s.on('open', function() {
        //                         res.setHeader('Content-Type', 'image/png');
        //                         s.pipe(res);
        //                     });
        //                     s.on('error', function() {
        //                         res.setHeader('Content-Type', 'text/plain');
        //                         res.statusCode = 404;
        //                         res.end('Not found');
        //                     });
        //                     s.on('close', function() {
        //                         fs.removeSync(tmpDir);
        //                     });
        //                 });
        //             });
        //         });
        //     });
        // }

        const upload = req.url.match(/upload\/([\w\.]+)/i);
        if (upload) {
            const filename = upload[1].replace('upload/', '');
            console.info('#############', 'upload', upload, 'filename', filename);
            let data = '';
            req.on('data', chunk => data += chunk.toString());
            req.on('end', () => {
                fs.ensureDir(tmpDir, err => {
                    if (err) {
                        fs.removeSync(tmpDir);
                        return res.end(500, err);
                    }
                    const filepath = getFilepath(path)(tmpDir)(filename);
                    console.info('...', 'filepath', filepath);
                    fs.writeFile(filepath, data, 'utf-8', err => {
                        if (err) {
                            fs.removeSync(tmpDir);
                            return res.end(500, err);
                        }
                        res.end(filepath);
                    });
                });
            });

        }
    } else {
        return res.end('usage: POST /:filename/:width/:height with svg content inside body');
    }
};

const server = http.createServer(handleRequest);

server.listen(PORT, () => {
    console.log(`Server listening on: http://localhost:${PORT}`);
});