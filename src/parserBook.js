const uuidV4 = require('uuid/v4');
import {merge} from './helper';
import {filterUndefinedValues, filterSurfaceError, getAttributes, getProductDeclaration, getTransform, hasId, hasAttributes, is, refineResults} from './surfaces';
import {addDscId, filterDscKey, makeDscValues, mergeDscValues, removeDscKey, nestDscData} from './dsc';
import {getSub, hasSub} from './sub';
import {getInnerCount, isCover, isSpine, isInner, extractIndexFromInnerId, byId} from './book';

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
        let z_index = -1;
        if (hasId(json)) {
            const {id} = json.attributes;
            if (byId.isCover(id) || byId.isSpine(id)) {
                z_index = 0;
            } else if (byId.isInner(id)) {
                const extractedIndex = extractIndexFromInnerId(id);
                // if (id.match(/inner_(\d+)/)) {
                if (extractedIndex) {
                    // z_index = getInnerIndex(id);
                    z_index = extractedIndex[1];
                } else {
                    z_index = options.innerCount + (id === 'inner_barcode' ? 1 : 2);
                }
            }
        }
        return resolve({z_index});
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
            .then(surfaces => {
                surfaces = surfaces.filter(filterSurfaceError(options));
                if (surfaces.length === 1 && surfaces[0].name === 'rect') {
                    console.info('...', 'has_attributes', has_attributes, 'getSubSurfaces', {...surfaces[0]});
                }
                if (surfaces.error) {
                    reject(surfaces);
                } else {
                    resolve({surfaces});
                }
            });
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
        // if (is({tag: 'g', json})) {
        //     parseNodeToSurface({options, json: json.elements});
        //     // const sub = getSubSurface({options, json});
        //     // sub.then(values => console.info('###', 'values', values, 'json', json)).catch(;
        //     // Promise.all(getSubSurface({options, json}).catch(e => resolve(e)))
        //     // .then(values => {
        //     //     console.info('###', 'values', values);
        //     //     resolve(values);
        //     // });
        // }
        Promise.all([
            Promise.resolve({id: uuidV4()}),
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
            console.info('>>>>', 'data', data);
            resolve({
                then: resolve => resolve({...data})
            });
        });
    });
};

export const getProductGroup = json => {
    return json.elements[0].elements.find(element => element.attributes && element.attributes.id.indexOf('design') > -1);
};

export const parseBook = ({json}) => options => {
    options.debug = false;
    return new Promise((resolve, reject) => {
        const bookDesign = getProductGroup(json);
        const productDetected = getProductDeclaration(bookDesign);
        if (productDetected !== 'book') {
            return reject({error: 'design is not a book'});
        }
        const innerCount = getInnerCount(bookDesign);
        return Promise.all(
            bookDesign.elements.map(json => parseNodeToSurface({options: {...options, innerCount}, json}))
        )
        .then(surfaces => surfaces.filter(filterSurfaceError(options)))
        .then(surfaces => {
            const sort = (a, b) => a.z_index < b.z_index ? -1 : 1;
            surfaces = surfaces.sort(sort);
            return resolve({
                then: resolve => resolve({
                    [productDetected]: {
                        id: uuidV4(),
                        surfaces: surfaces.reduce((a, data) => {
                            // console.info('>>>>', 'data', data);
                            return ({...a, [data.id]: data});
                        }, {})
                    }
                })
            });
        })
    });
};

export default parseBook;