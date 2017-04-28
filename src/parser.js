import convert from 'xml-js';
import { getColorsFromRects } from './colors';
import { getFontsFromGroups } from './fonts';
import { parseImagesFromSVG } from './images';
import { lookForProductAttributes } from './product';
import { ACL, Bucket, getLocation, getSvgUploadOptions, mkUrl } from './upload';
import {merge, nodeList2Array, reduceByConcat} from './helper';
import {checkMode, checkContent} from './check';
import {getDeclaration} from './group';

import parserMug from './parserMug';
import {parseBook, parseBookToDSC} from './parserBook';

const productsParsers = [
    // parserMug,
    [parseBook, parseBookToDSC]
];

export const legacyColorDeclaration = id => id.match(/COLOR_([\w]+)_([\d]+)?/i);
export const legacyClipartDeclaration = id => id.match(/CLIPART_([\d]+)?/i);
// export const designsSelectors = '#designs [id*=design]';
export const designsSelectors = '#designs';

export const parse = {
    toolkit: svg => options => {
        const { filename, S3, hashFunction, hashMethod } = options;
        const groups = nodeList2Array(svg.querySelectorAll('g#toolkit g'));
        if (groups.length === 0) {
            const errors = [{msg: 'TOOLKIT NOT PARSABLE : no matching toolkit attributes found'}];
            return Promise.resolve({then: resolve => resolve({toolkit: false, errors})});
        }
        const mode = checkMode(groups);
        const colorsGroup = nodeList2Array(svg.querySelectorAll('rect[id*="color"]'));
        const fontsGroup = nodeList2Array(svg.querySelectorAll('g[id="fonts"] text'));
        const imagesGroup = nodeList2Array(svg.querySelectorAll('[id="images"] [id="image"]'));
        const urlThumbPath = `${filename}/${filename.replace('.svg', '.thumb.svg')}`;
        return new Promise((resolve, reject) => {
            Promise.all([
                new Promise((resolve, reject) => S3.upload(getSvgUploadOptions(urlThumbPath)(svg.outerHTML)).promise().then(getLocation).then(thumbUrl => resolve({ thumbUrl }))),
                Promise.resolve({ id: filename }),
                Promise.resolve({ colors: getColorsFromRects(colorsGroup)({hashFunction, hashMethod}) }),
                Promise.resolve({ fonts: getFontsFromGroups(fontsGroup)({hashFunction, hashMethod}) }),
                new Promise((resolve, reject) => parseImagesFromSVG(filename)(svg)(S3)({hashFunction, hashMethod}).then(images => resolve({ images }))),
            ]).then(values => resolve({toolkit: values.reduce(merge, {})}))
        });
    },
    designs: svg => options => {
        return new Promise((resolve, reject) => {
            const designs = nodeList2Array(document.querySelectorAll(designsSelectors));
            const json = JSON.parse(convert.xml2json(svg.outerHTML, {compact: false, spaces: 4}));

            Promise.all(
                json.elements.map(design => {
                    return Promise.all(
                        productsParsers.map(productsParser => productsParser[0]({json})(options).then(productsParser[1](options)))
                    )
                    .then(allProductParsers => {
                        allProductParsers.map(product => {
                            const productName = Object.keys(product)[0];
                            // const {surfaces} = product[productName];
                            console.info('...', `product[${productName}]`, Object.keys(surfaces).length, surfaces);
                        })
                        return Promise.resolve({
                            then: resolve => resolve(reduceByConcat(allProductParsers))
                        });
                    })
                    .catch(error => resolve(error));
                })
            )
            .then(designsParsed => {
                resolve({
                    then: resolve => resolve({designs: reduceByConcat(designsParsed)})
                });
            })
        });
    }
};

export const parser = svg => options => {
    if (typeof svg === 'string') {
        const svgElement = document.querySelector(svg);
        if (typeof svgElement === 'undefined') {
            return Promise.reject("Can't find any dom element using selector: " + svg);
        }
        return parser(svgElement)(options);
    }

    const { filename, S3, hashFunction, hashMethod } = options;

    return Promise.all([
        parse.toolkit(svg)(options),
        parse.designs(svg)(options)
    ])
    .then(values => values.reduce(merge, {}));
};

export default parser;
