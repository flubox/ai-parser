const uuidV4 = require('uuid/v4');
import {merge} from './helper';
import {
    adjustType,
    extractPhysicalSize,
    extractSubSurfaces,
    extractUuids,
    filterUndefinedValues,
    filterSurfaceError,
    getAttributes,
    getProductDeclaration,
    getSiblingsCount,
    getTransform,
    hasId,
    hasAttributes,
    is,
    mergeTextUp,
    refineResults
} from './surfaces';
import {addDscId, filterDscKey, makeDscValues, mergeDscValues, removeDscKey, nestDscData} from './dsc';
import {getSub, hasSub} from './sub';
import {byId, extractIndexFromInnerId, getInnerCount, isCover, isInner, isSpine, mergeRectUp} from './book';

export const isDeprecated = id => id && id.indexOf('_autofillable') > -1 && id.indexOf('inner') === 0;

export const filterDeprecatedElement = element => isDeprecated(element.attributes.id);

export const getTypeFromId = id => id.split(/[-_]/)[0];

// export const isText = json => is('text')(json);

export const filterTag = tag => element => element.name === tag;

// export const containsTexts = json => hasSub('text')(json);

// export const aggregateTexts = json => {
//     const text = getSub('tspan')(json).map(htmlText => htmlText.textContent).join()
// };

export const getColor = json => {
    return new Promise((resolve, reject) => {
        if (hasAttributes(json)) {
            const {fill} = json.attributes;
            return resolve({fill});
        }
        reject();
    });
};

export const getPosition = json => {
    return new Promise((resolve, reject) => {
        if (hasAttributes(json)) {
            const {x, y} = json.attributes;
            return resolve({x, y});
        }
        reject();
    });
};

export const getSize = json => {
    return new Promise((resolve, reject) => {
        if (hasAttributes(json)) {
            const {height, width} = json.attributes;
            return resolve({height, width});
        }
        reject();
    });
};

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
            .then(surfaces => resolve({surfaces: surfaces.filter(filterSurfaceError(options))}));
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
        .then(data => {
            data = mergeRectUp(data);
            // data = mergeTextUp(data);
            // data = adjustType(data);
            // if (typeof data.id !== 'undefined' && byId.isCover(data.id)) {
            //     console.info('>>>', 'data', data);
            // }
            // data = extractSubSurfaces(data);
            if (data.surfaces) {
                // console.info('>>>', 'data', data.type, data);
                const uuidList = extractUuids(data.surfaces).reduce((a, b) => a.concat(b), []);
                data = [{...data, surfaces: uuidList}].concat(data.surfaces.reduce((a, b) => a.concat(b), []));
            }
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
    options = {...options, ...extractPhysicalSize(json)};
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
                        surfaces: surfaces.reduce((a, data) => {
                            console.info('>>>>', 'data', data);
                            return ({...a, [data.uuid]: data});
                        }, {})
                    }
                })
            });
        })
    });
};

export default parseBook;