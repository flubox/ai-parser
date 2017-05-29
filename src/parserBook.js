const uuidV4 = require('uuid/v4');
import {
    extractClipPaths,
    extractSymbols,
    extractUnit,
    extractUuids,
    filterUndefinedValues,
    filterEmptySurfaces,
    getAttributes,
    getTypeFromId,
    indexUp,
    isolate,
    keys,
    keysExcept,
    merge,
    mergeWith,
    not,
    reduceByMerge,
    resolveByType,
    riseSurfaces,
    toFloat,
    toUnit
} from './helper';
import {checkIfHasElements, checkIfSvg} from './check';
import {
    adjustType,
    extractPhysicalSize,
    extractSubSurfaces,
    filterSurfaceError,
    getSiblingsCount,
    getTransform,
    hasId,
    hasAttributes,
    is,
    mergeTextUp,
    refineResults,
    resolveUse
} from './surfaces';
import {addDscId, filterDscKey, makeDscValues, mergeDscValues, removeDscKey, nestDscData, surfaceToDsc, toDsc} from './dsc';
import {getSub, hasSub} from './sub';
import {byId, extractIndexFromInnerId, getInnerCount, isCover, isInner, isSpine, resolveAperture, resolveRect} from './book';
import {getProductDeclaration} from './product';

export const resolveList = [
    resolveAperture,
    // resolveUse,
    resolveRect
    // mergeTextUp
];

export const isDeprecated = id => id && id.indexOf('_autofillable') > -1 && id.indexOf('inner') === 0;

export const filterDeprecatedElement = element => isDeprecated(element.attributes.id);

export const getRotation = data => new Promise(resolve => resolve({...keysExcept(data)('type').reduce(mergeWith(data), {}), rotation: 0}));

export const removeAttributes = data => filterUndefinedValues({...data, attributes: undefined});

export const removeElements = data => filterUndefinedValues({...data, elements: undefined});

export const riseTspan = data => {
    
    return data;
};

export const getSurfaceType = ({attributes, name, type}) => {
    return new Promise((resolve, reject) => {
        const has_id = attributes && !!attributes.id;
        const has_name = typeof name !== 'undefined';
        type = undefined;
        if (has_id) {
            type = getTypeFromId(attributes.id);
            // if (type === 'cover') {
            //     console.info('############', 'getSurfaceType', has_id, attributes.id, has_name, name, type);
            // }
            return resolve({then: resolve => resolve({type})});
        } else if (has_name) {
            type = name;
            return resolve({then: resolve => resolve({type})});
        }

        return resolve({error: 'no type'});
    });
};

export const resolveFromError = e => Promise.resolve(e);

export const getZIndex = ({options, json}) => {
    return new Promise((resolve, reject) => {
        let z = -1;
        if (hasId(json)) {
            const {id} = json.attributes;
            if (byId.isCover(id) || byId.isSpine(id)) {
                // console.info('>>>', 'id', id, 'byId.isCover(id)', byId.isCover(id), 'byId.isSpine(id)', byId.isSpine(id));
                z = 0;
            } else if (byId.isInner(id)) {
                const extractedIndex = extractIndexFromInnerId(id);
                // if (id.match(/inner_(\d+)/)) {
                if (extractedIndex) {
                    // z = getInnerIndex(id);
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
        // if (json.elements) {
        if (typeof json === 'undefined') {
            reject();
        } else if (hasSub({options, json})) {
            const has_attributes = hasAttributes(json);
            Promise.all(
                json.elements.map(json => parseNodeToSurface({options, json}))
            )
            .then(surfaces => resolve({surfaces: surfaces.filter(filterSurfaceError(options)).filter(filterUndefinedValues)}));
        } else {
            // reject({then: resolve => resolve()});
            // resolve({error: 'no sub surfaces'});
            resolve();
        }
    });
};

export const parseNodeToSurface = ({options, json}) => {
    return new Promise((resolve, reject) => {
        const has_id = hasId(json);
        if (has_id && isDeprecated(json.attributes.id)) {
            resolve({error: 'deprecated'});
        }
        Promise.all([
            Promise.resolve({uuid: uuidV4()}),
            Promise.resolve({product: 'book'}),
            getAttributes(json),
            getSurfaceType(json),
            getZIndex({options, json}),
            getSubSurface({options, json}).catch(resolveFromError),
            getRotation(json),

            // getPosition(json).catch(resolveFromError),
            // getSize(json).catch(resolveFromError),
            // getColor(json).catch(resolveFromError),
            // getTransform(json).catch(resolveFromError)
        ])
        // .then(result => {
        //     console.info('#######', 'result', [...result]);
        //     return result;
        // })
        .then(refineResults(json))
        .then(removeAttributes)
        .then(removeElements)
        .then(addDscId(has_id ? json.attributes.id : undefined))
        .then(filterUndefinedValues)
        .then(filterEmptySurfaces)
        .then(nestDscData)
        .then(getTransform)
        .then(resolveByType(options)(resolveList))
        .then(toFloat)
        .then(toUnit(options))
        // .then(options.flat ? riseSurfaces(options) : d => d)
        .then(data => {
            // data = adjustType(data);
            // data = extractSubSurfaces(data);
            if (data.type === 'layout') {
                console.info('>>>', 'data', data, Array.isArray(data));
            }
            // if (data.surfaces) {
            //     // console.info('>>>', 'data', data.type, data);
            //     const uuidList = extractUuids(data.surfaces).reduce((a, b) => a.concat(b), []);
            //     data = [{...data, surfaces: uuidList}].concat(data.surfaces.reduce((a, b) => a.concat(b), []));
            // }
            resolve({
                // then: resolve => resolve({...data})
                then: resolve => resolve(data)
            });
        });
    });
};

export const getProductGroup = json => {
    return json.elements[0].elements.find(element => element.attributes && element.attributes.id.indexOf('design') > -1);
};

export const parseBook = ({svg, json}) => options => {
    options.debug = false;
    console.info('...', 'json', json);
    // if (typeof json.name === 'undefined' && typeof json.elements !== 'undefined' && json.elements.length === 1) {
    //     return parseBook({svg, json: json.elements[0]});
    // }
    const flat = options.flat || false;
    const {width, height} = extractPhysicalSize(json.elements[0].attributes);
    const unit = extractUnit(width || height);
    const symbols = reduceByMerge(extractSymbols(json).map(s => indexUp(s.attributes.id)(s)));
    const clipPath = reduceByMerge(extractClipPaths(json).map(s => indexUp(s.attributes.id)(s)));
    const defs = {symbols, clipPath};
    options = {...options, defs, unit, width, height};
    return new Promise((resolve, reject) => {
        const bookDesign = getProductGroup(json);
        const productDetected = getProductDeclaration(bookDesign);
        if (productDetected !== 'book') {
            return reject({error: 'design is not a book'});
        }
        // const innerCount = getInnerCount(bookDesign);
        const innerCount = getSiblingsCount(svg)('[id*=design]');
        return Promise.all(
            bookDesign.elements.map(json => parseNodeToSurface({options: {...options, innerCount}, json}))
        )
        .then(surfaces => surfaces.filter(filterSurfaceError(options)))
        .then(surfaces => surfaces.reduce((a, surface) => a.concat(surface), []))
        .then(surfaces => {
            const sort = (a, b) => a.z < b.z ? -1 : 1;
            surfaces = surfaces.sort(sort);
            return resolve({
                then: resolve => resolve({
                    [productDetected]: {
                        uuid: uuidV4(),
                        product: 'book',
                        type: 'book',
                        surfaces: surfaces.reduce((a, data) => ({...a, [flat ? data.uuid : data.id]: data}), {})
                    }
                })
            });
        })
    });
};

export const parseBookToDSC = options => data => {
    const productDeclaration = isolate(Object.keys(data));
    const product = data[productDeclaration];
    console.warn('before', 'parseBookToDSC', 'product', product);
    const converted = surfaceToDsc({...options, debug: true})(product);
    // const converted = {[product]: {...data[product], surfaces: toDsc(options)(data[product])}};
    console.info('after', 'parseBookToDSC', 'converted', {...product.surfaces.cover_front_outside_autofillable.surfaces[4].surfaces[3]});
    return converted;
};

export default parseBook;