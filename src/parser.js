import convert from 'xml-js';
// import { getColorsFromRects } from './colors';
// import { getFontsFromGroups } from './fonts';
// import { parseImagesFromSVG } from './images';
// import { lookForProductAttributes } from './product';
// import { ACL, Bucket, getLocation, getSvgUploadOptions, mkUrl } from './upload';
// import {getViewBox, isDef, merge, nodeList2Array, reduceByConcat, unDef} from './helper';
import {isDef, merge} from './helper';
// import {checkMode, checkContent} from './check';
// import {getDeclaration} from './group';

// import parserMug from './parserMug';
// import {parseBook, parseBookToDSC} from './book';
import {parseLayoutSet, layoutSetToDS} from './layouts';
import {parseToolkits} from './toolkit';
import {parseDesigns} from './design';

// const productsParsers = [
//     // parserMug,
//     [parseBook, parseBookToDSC],
// ];

// export const legacyColorDeclaration = id => id.match(/COLOR_([\w]+)_([\d]+)?/i);
// export const legacyClipartDeclaration = id => id.match(/CLIPART_([\d]+)?/i);
export const designsSelectors = '#designs';

export const defaultErrorHandling = key => ({error}) => {
    console.error(error);
    return Promise.resolve({then: resolve => resolve({[key]: false})});
};

export const defaultsWarningHandling = key => ({warning}) => {
    console.warn(warning);
    return Promise.resolve({then: resolve => resolve({[key]: false})});
};

export const defaultCatchHandling = key => ({error, warning}) => isDef(error) ? defaultErrorHandling({error}) : defaultsWarningHandling({warning});

export const parse = {
    toolkits: svg => options => parseToolkits(svg)(options).catch(msg => defaultCatchHandling('toolkits')),
    designs: svg => options => parseDesigns(svg)(options).catch(msg => defaultCatchHandling('designs')),
    // designs: svg => options => {
    //     return new Promise((resolve, reject) => {
    //         const designs = nodeList2Array(document.querySelectorAll(designsSelectors));
    //         const json = JSON.parse(convert.xml2json(svg.outerHTML, {compact: false, spaces: 4}));
    //         const viewbox = getViewBox(json.elements[0]);
    //         const viewport = { width: window.innerWidth, height: window.innerHeight };
    //         options = {...options, viewbox, viewport};

    //         Promise.all(
    //             json.elements.map(design => {
    //                 return Promise.all(
    //                     productsParsers.map(productsParser => productsParser[0]({json})({...options}).then(productsParser[1]({...options, viewbox})))
    //                 )
    //                 .then(allProductParsers => {
    //                     allProductParsers.map(product => {
    //                         const productName = Object.keys(product)[0];
    //                         // const {surfaces} = product[productName];
    //                         console.info('@@@', `product[${productName}]`, Object.keys(surfaces).length, surfaces);
    //                     })
    //                     return Promise.resolve({
    //                         then: resolve => resolve(reduceByConcat(allProductParsers))
    //                     });
    //                 })
    //                 .catch(error => resolve(error));
    //             })
    //         )
    //         .then(designsParsed => {
    //             resolve({
    //                 then: resolve => resolve({designs: reduceByConcat(designsParsed)})
    //             });
    //         })
    //     });
    // },
    layouts: svg => options => parseLayoutSet(svg)(options).then(layoutSetToDS(options)).catch(msg => defaultCatchHandling('layouts'))
};

export const parser = svg => options => {
    if (typeof svg === 'string') {
        const svgElement = document.querySelector(svg);
        if (unDef(svgElement)) {
            return Promise.reject("Can't find any dom element using selector: " + svg);
        }
        return parser(svgElement)(options);
    }

    return Promise.all([
        parse.toolkits(svg)(options),
        parse.designs(svg)(options),
        parse.layouts(svg)(options)
    ])
    .then(values => values.reduce(merge, {}))
    ;
};

export default parser;
