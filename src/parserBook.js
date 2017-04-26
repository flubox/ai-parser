const uuidV4 = require('uuid/v4');
import {
    extractClipPaths,
    extractSymbols,
    extractUnit,
    extractUuids,
    filterUndefinedValues,
    getAttributes,
    getTypeFromId,
    indexUp,
    merge,
    reduceByMerge,
    resolveByType,
    riseSurfaces
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
import {addDscId, filterDscKey, makeDscValues, mergeDscValues, removeDscKey, nestDscData} from './dsc';
import {getSub, hasSub} from './sub';
import {byId, extractIndexFromInnerId, getInnerCount, isCover, isInner, isSpine, resolveAperture, resolveRect} from './book';
import {getProductDeclaration} from './product';

export const resolveList = [
    resolveAperture,
    // resolveUse,
    // resolveRect,
    // mergeTextUp
];

export const isDeprecated = id => id && id.indexOf('_autofillable') > -1 && id.indexOf('inner') === 0;

export const filterDeprecatedElement = element => isDeprecated(element.attributes.id);

export const getSurfaceType = ({attributes, elements, name}) => {
    return new Promise((resolve, reject) => {
        if (attributes && attributes.id) {
            return resolve({then: resolve => resolve({type: getTypeFromId(attributes.id)})});
        } else if (name) {
            return resolve({then: resolve => resolve({type: name})});
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
            // getPosition(json).catch(resolveFromError),
            // getSize(json).catch(resolveFromError),
            // getColor(json).catch(resolveFromError),
            // getTransform(json).catch(resolveFromError)
        ])
        .then(refineResults(json))
        .then(addDscId(has_id ? json.attributes.id : undefined))
        .then(filterUndefinedValues)
        .then(nestDscData)
        .then(getTransform)
        .then(resolveByType(options)(resolveList))
        .then(options.flat ? riseSurfaces(options) : d => d)
        .then(data => {
            // data = adjustType(data);

            // data = extractSubSurfaces(data);
            if (data.type === 'use') {
                console.info('>>>', 'data', data);
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
    console.info('...', 'defs', {...defs}, {...clipPath}, {...symbols});
    // console.info('...', 'unit', unit);
    options = {...options, defs, unit, width, height};
    return new Promise((resolve, reject) => {
        const bookDesign = getProductGroup(json);
        const productDetected = getProductDeclaration(bookDesign);
        if (productDetected !== 'book') {
            return reject({error: 'design is not a book'});
        }
        // const innerCount = getInnerCount(bookDesign);
        const innerCount = getSiblingsCount(svg)('[id*=design]');
        console.info('>>>', 'innerCount', innerCount);
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
                        surfaces: surfaces.reduce((a, data) => {
                            // console.info('>>>>', 'data', data);
                            return ({...a, [flat ? data.uuid : data.id]: data});
                        }, {})
                    }
                })
            });
        })
    });
};

export default parseBook;