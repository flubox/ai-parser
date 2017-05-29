import convert from 'xml-js';
import { ACL, Bucket, getLocation, getSvgUploadOptions, mkUrl } from './upload';
import {defaultCatchHandling, extractUnit, isDef, merge, nodeList2Array, reduceByConcat, unDef} from './helper';
import * as helper from './helper';
import {parseBook, parseBookToDSC} from './book';

const productsParsers = [
    [parseBook, parseBookToDSC],
];

export const designsSelectors = '#designs';

export const parseDesigns = svg => options => {
    return new Promise((resolve, reject) => {
        const designsSelected = document.querySelector(designsSelectors);
        console.info('...', 'parseDesigns', designsSelected);
        if (designsSelected === null) {
            return reject({error: 'no valid global designs structure found'});
        }

        const designs = helper.nodeList2Array(designsSelected);
        const json = JSON.parse(convert.xml2json(svg.outerHTML, {compact: false, spaces: 4}));

        if (unDef(json)) {
            return reject({error: 'error while converting SVG to JSON'});
        }

        if (unDef(json.elements)) {
            return reject({error: 'no groups found in top level'});
        }

        if (unDef(json.elements[0].attributes)) {
            return reject({error: 'no attributes found for top level group'})
        }

        // const viewbox = getViewBox(json.elements[0]);
        // const viewport = { width: window.innerWidth, height: window.innerHeight };
        // options = {...options, viewbox, viewport};

        const {width, height} = helper.extractPhysicalSize(json.elements[0].attributes);
        const unit = helper.extractUnit(width || height);
        const symbols = helper.reduceByMerge(helper.extractSymbols(json).map(s => helper.indexUp(s.attributes.id)(s)));
        const clipPath = helper.reduceByMerge(helper.extractClipPaths(json).map(s => helper.indexUp(s.attributes.id)(s)));
        const defs = {symbols, clipPath};
        options = {...options, defs, unit, width, height};
        let defaultCatchHandling = args => args2 => console.info('.........', 'defaultCatchHandling', args, args2);

        Promise.all(
            json.elements.map(design => {
                return Promise.all(
                    productsParsers
                    .map(
                        productsParser => productsParser[0]({json})(options)
                        // .catch(defaultCatchHandling('book'))
                        .then(productsParser[1](options))
                    )
                )
                .then(
                    allProductParsers => {
                        if (unDef(allProductParsers)) {
                            return Promise.reject({then: reject => reject({error: 'no design parsed'})});
                        }
                        Promise.resolve({then: resolve => resolve(reduceByConcat(allProductParsers))});
                    }
                )
                // .catch(defaultCatchHandling('book'))
            })
        )
        .then(designsParsed => {
            console.info('designsParsed', reduceByConcat(designsParsed));
            if (unDef(designsParsed)) {
                return reject({error: 'no design parsed'})
            }
            resolve({
                then: resolve => resolve({designs: reduceByConcat(designsParsed)})
            });
        })
        // .catch(defaultCatchHandling('book'))
    });
};

export default parseDesigns;