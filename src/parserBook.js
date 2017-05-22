const uuidV4 = require('uuid/v4');
import * as helper from './helper';
import {is, isDef, keys, merge, not, unDef, sortByZindex} from './helper';
import {checkIfHasElements, checkIfSvg} from './check';
import {
    adjustType,
    extractPhysicalSize,
    // extractSubSurfaces,
    filterSurfaceError,
    getSiblingsCount,
    getTransform,
    resolveText,
    mergeResults,
    resolveUse
} from './surfaces';
import {surfaceToDsc} from './dsc';
import {getSub, hasSub} from './sub';
import {byId, extractIndexFromInnerId, getInnerCount, isCover, isInner, isSpine, resolveAperture, resolveRect} from './book';
import {getProductDeclaration} from './product';

export const mergeRules = [
    resolveAperture,
    // resolveUse,
    resolveRect,
    resolveText
];

export const isDeprecated = id => id && id.indexOf('_autofillable') > -1 && id.indexOf('inner') === 0;

export const filterDeprecatedElement = element => isDeprecated(element.attributes.id);

export const getSurfaceType = ({attributes, name, type}) => {
    return new Promise((resolve, reject) => {
        type = name;
        if (isDef(attributes) && isDef(attributes.id)) {
            type = helper.getTypeFromId(attributes.id);
            // if (type === 'cover') {
            //     console.info('############', 'getSurfaceType', has_id, attributes.id, has_name, name, type);
            // }
            return resolve({then: resolve => resolve({type})});
        // } else if (isDef(name)) {
        //     type = name;
        //     return resolve({then: resolve => resolve({type})});
        }

        return resolve({then: resolve => resolve({type})});
        // return resolve({error: 'no type'});
    });
};

export const resolveFromError = e => Promise.resolve(e);

export const getZIndex = ({options, json}) => {
    return new Promise((resolve, reject) => {
        let z = -1;
        if (helper.hasId(json)) {
            const {id} = json.attributes;
            if (byId.isCover(id) || byId.isSpine(id)) {
                z = 0;
            } else if (byId.isInner(id)) {
                const extractedIndex = extractIndexFromInnerId(id);
                if (extractedIndex) {
                    z = extractedIndex[1];
                } else {
                    z = options.innerCount + (id === 'inner_barcode' ? 1 : 2);
                }
            }
        }
        return resolve({z});
    });
};

export const getSubSurface = ({options, json}) => {
    return new Promise((resolve, reject) => {
        if (unDef(json)) {
            reject();
        } else if (hasSub({options, json})) {
            const has_attributes = helper.hasAttributes(json);
            Promise.all(
                json.elements.map(json => parseNodeToSurface({options, json}))
            )
            .then(surfaces => resolve({surfaces: surfaces.filter(filterSurfaceError(options)).filter(helper.filterUndefinedValues)}));
        } else {
            // reject({then: resolve => resolve()});
            // resolve({error: 'no sub surfaces'});
            resolve();
        }
    });
};

export const parseNodeToSurface = ({options, json}) => {
    return new Promise((resolve, reject) => {
        const has_id = helper.hasId(json);
        if (has_id && isDeprecated(json.attributes.id)) {
            resolve({error: 'deprecated'});
        }
        Promise.all([
            Promise.resolve({
                ...json.attributes,
                attributes: undefined,
                product: 'book',
                uuid: uuidV4(),
                raw: {...json}
            }),
            getSurfaceType(json),//.catch(resolveFromError),
            getZIndex({options, json}),
            getSubSurface({options, json}),
            helper.getDefaultRotation(json),
            helper.getText(json),
            // getPosition(json).catch(resolveFromError),
            // getSize(json).catch(resolveFromError),
            // getColor(json).catch(resolveFromError),
            // getTransform(json).catch(resolveFromError)
        ])
        .then(mergeResults)
        // .then(helper.removeAttributes)
        // .then(helper.removeElements)
        .then(helper.filterUndefinedValues)
        .then(helper.filterEmptySurfaces)
        .then(getTransform)
        .then(helper.rise(options)(mergeRules))
        .then(helper.toFloat)
        .then(data => {

            // if (Array.isArray(data)) {
            // if (data.type === 'text') {
            //     console.info('<<<', 'data', data);
            // }

            resolve({then: resolve => resolve(data)});
        });
    });
};

export const getProductGroup = ({elements}) => elements[0].elements.find(e => helper.hasAttributes(e) && e.attributes.id.match(/design/gi));

export const parseBook = ({svg, json}) => options => {
    options = {...options, debug: false, flat: options.flat || false};
    // console.info('...', 'options', options, 'json', json);
    const {width, height} = extractPhysicalSize(json.elements[0].attributes);
    const unit = helper.extractUnit(width || height);
    const symbols = helper.reduceByMerge(helper.extractSymbols(json).map(s => helper.indexUp(s.attributes.id)(s)));
    const clipPath = helper.reduceByMerge(helper.extractClipPaths(json).map(s => helper.indexUp(s.attributes.id)(s)));
    const defs = {symbols, clipPath};
    options = {...options, defs, unit, width, height};
    return new Promise((resolve, reject) => {
        const bookDesign = getProductGroup(json);
        const productDetected = getProductDeclaration(bookDesign);
        if (productDetected !== 'book') {
            return reject({error: 'design is not a book'});
        }
        const innerCount = getSiblingsCount(svg)('[id*=design]');
        return Promise.all(
            bookDesign.elements.map(json => parseNodeToSurface({options: {...options, innerCount}, json}))
        )
        .then(surfaces => surfaces.filter(filterSurfaceError(options)))
        .then(surfaces => surfaces.reduce((a, surface) => a.concat(surface), []))
        .then(surfaces => {
            surfaces = surfaces.sort(sortByZindex).reduce((a, data) => ({...a, [options.flat ? data.uuid : data.id]: data}), {});
            const final = {
                [productDetected]: {
                    uuid: uuidV4(),
                    defs,
                    product: 'book',
                    type: 'book',
                    surfaces
                }
            };
            console.info('...', 'final', final);
            return resolve({then: resolve => resolve(final)});
        })
    });
};

export const parseBookToDSC = options => data => {
    const productDeclaration = helper.first(Object.keys(data));
    const product = data[productDeclaration];
    console.warn('before', 'parseBookToDSC', 'product', product);
    const converted = surfaceToDsc({...options, debug: true})(product);
    // const converted = {[product]: {...data[product], surfaces: toDsc(options)(data[product])}};
    // console.info('after', 'product.surfaces.cover_front_outside_autofillable.surfaces[4].surfaces[3]', {...product.surfaces.cover_front_outside_autofillable.surfaces[4].surfaces[3]});
    console.info(
        'after',
        '@@@@@@',
        {...product.surfaces.cover_front_outside_autofillable},
        // helper.rise(options)(mergeRules)(product.surfaces.cover_front_outside_autofillable.surfaces[4])
    );
    // console.info('converted', {...converted.surfaces});
    console.info('converted', converted);
    return converted;
};

export default parseBook;