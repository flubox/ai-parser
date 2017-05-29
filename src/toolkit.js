import convert from 'xml-js';
import { ACL, Bucket, getLocation, getSvgUploadOptions, mkUrl } from './upload';
import {getViewBox, isDef, merge, nodeList2Array, reduceByConcat, unDef} from './helper';
import { getColorsFromRects } from './colors';
import { getFontsFromGroups } from './fonts';
import { parseImagesFromSVG } from './images';

export const extractId = ({attributes}) => isDef(attributes) && isDef(attributes.id) && attributes.id.match(/^toolkit_(.+)/)[1];

export const parseToolkit = options => svg => {
    const { filename, S3, hashFunction, hashMethod } = options;
    return new Promise((resolve, reject) => {
        const json = JSON.parse(convert.xml2json(svg.outerHTML, {compact: false, spaces: 4})).elements[0];
        const id = extractId(json);
        const useDefaultToolkit = !!id.match(/default/);
        const colorsGroup = nodeList2Array(svg.querySelectorAll('#colors rect'));
        const fontsGroup = nodeList2Array(svg.querySelectorAll('#fonts text'));
        const urlThumbPath = `${filename}/${filename.replace('.svg', '.thumb.svg')}`;

        Promise.all([
            new Promise((resolve, reject) => S3.upload(getSvgUploadOptions(urlThumbPath)(svg.outerHTML)).promise().then(getLocation).then(thumbUrl => resolve({ thumbUrl }))),
            Promise.resolve({ id: id ? id.replace(/[_]?default[_]?/, '') : filename }),
            Promise.resolve({useDefaultToolkit}),
            Promise.resolve({ colors: getColorsFromRects(colorsGroup)({hashFunction, hashMethod}) }),
            Promise.resolve({ fonts: getFontsFromGroups(fontsGroup)({hashFunction, hashMethod}) }),
            new Promise((resolve, reject) => parseImagesFromSVG(filename)(svg)(S3)({hashFunction, hashMethod}).then(images => resolve({ images }))),
        ]).then(values => resolve({toolkit: values.reduce(merge, {})}));
    });
};

export const parseToolkits = svg => options => {
    return new Promise((resolve, reject) => {
        if (typeof options.S3 === 'undefined') {
            return reject({error: 'no AWS.S3 provided'});
        }

        if (typeof options.filename === 'undefined' || options.filename.length === 0) {
            return reject({error: 'no filename provided'});
        }

        if (unDef(svg.querySelector('[id="toolkits"]'))) {
            return reject({error: 'no valid global toolkits structure found'});
        }

        const svgGroups = svg.querySelectorAll('[id^="toolkit"]');
        const groups = nodeList2Array(svgGroups);

        if (groups.length === 0) {
            return reject({error: 'no single valid toolkit structure found'});
        }

        Promise.all(Array.prototype.map.call(groups, parseToolkit(options)))
        .then(results => resolve({toolkits: results.map(({toolkit}) => toolkit)}));
    });
};

export default parseToolkits;