const uuidV4 = require('uuid/v4');
import {merge} from './helper';
import {getProductDeclaration} from './surfaces';

export const hasId = json => json.attributes && json.attributes.id;

export const hasAttributes = json => !!json.attributes;

export const isDeprecated = id => id && id.indexOf('_autofillable') > -1 && id.indexOf('inner') === 0;

export const filterDeprecatedElement = element => isDeprecated(element.attributes.id);

export const getTypeFromId = id => id.split(/[-_]/)[0];

export const getColor = json => {
    return new Promise((resolve, reject) => {
        if (hasAttributes(json)) {
            const {fill} = json.attributes;
            return resolve({fill});
        }
        return reject();
    });
};

export const getPosition = json => {
    return new Promise((resolve, reject) => {
        if (hasAttributes(json)) {
            const {x, y} = json.attributes;
            return resolve({x, y});
        }
        return reject();
    });
};

export const getSize = json => {
    return new Promise((resolve, reject) => {
        if (hasAttributes(json)) {
            const {height, width} = json.attributes;
            return resolve({height, width});
        }
        return reject();
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

export const isCover = id => id.indexOf('cover') > -1;

export const isSpine = id => id.indexOf('spine') > -1;

export const isInner = id => id.indexOf('inner') > -1;

export const getInnerIndex = id => {
    const raw = id.split('_')[1];
    return isNaN(raw) ? -1 : parseInt(raw, 10);
};

export const getZIndex = ({innerCount}) => json => {
    return new Promise((resolve, reject) => {
        let z_index = -1;
        if (hasId(json)) {
            const {id} = json.attributes;
            if (isCover(id) || isSpine(id)) {
                z_index = 0;
            } else if (isInner(id)) {
                if (id.match(/inner_(\d+)/)) {
                    z_index = getInnerIndex(id);
                } else {
                    z_index = innerCount + (id === 'inner_barcode' ? 1 : 2);
                }
            }
        }
        return resolve({z_index});
    });
};

export const getSubSurface = options => json => {
    return new Promise((resolve, reject) => {
        if (json.elements) {
            const has_attributes = hasAttributes(json);
            Promise.all(
                json.elements.map(node => {
                    parseNodeToSurfacex(options)(node)
                    .then(result => {
                        if (!has_attributes) {
                            console.info('...', 'has_attributes', has_attributes, 'getSubSurface', result);
                        }
                    });
                    // return result;
                })
            );
            resolve();
        } else {
            // reject({then: resolve => resolve()});
            resolve();
        }
    });
};

export const filterUndefinedValues = data => Object.keys(data).filter(k => !!data[k]).reduce((a, k) => ({...a, [k]: data[k]}), {});

export const refineResults = raw => results => ({...results.reduce(merge, {}), raw});

export const addDscId = dsc_id => data => dsc_id ? ({...data, dsc_id}) : data;

export const filterDscKey = key => key.indexOf('dsc_') > -1;

export const makeDscValues = obj => keys => keys.map(k => ({dsc: {[k.split('_')[1]]: obj[k]}}));

export const mergeDscValues = values => values.reduce(merge, {});

export const removeDscKey = list => k => !list.includes(k);

export const nestDscData = data => {
    const dscKeys = Object.keys(data).filter(filterDscKey);
    const dsc = mergeDscValues(makeDscValues(data)(dscKeys));
    return {...Object.keys(data).filter(removeDscKey(dscKeys)).reduce((a, k) => ({...a, [k]: data[k]}), {}), dsc};
};

export const parseNodeToSurfacex = options => json => {
    return new Promise((resolve, reject) => {
        const has_id = hasId(json);
        if (has_id && isDeprecated(json.attributes.id)) {
            resolve({then: resolve => resolve({error: 'deprecated'})});
        }
        const resolveFromError = e => Promise.resolve(e);
        Promise.all([
            Promise.resolve({id: uuidV4()}),
            Promise.resolve({product: 'book'}),
            getSurfaceType(json),
            getZIndex(options)(json),
            getSubSurface(options)(json),
            getPosition(json).catch(resolveFromError),
            getSize(json).catch(resolveFromError),
            getColor(json).catch(resolveFromError)
            // new Promise(resolve => resolve(isDeprecated(has_id ? json.attributes.id : undefined) ? {error: 'deprecated'} : undefined))
        ])
        .then(refineResults(json))
        .then(addDscId(has_id ? json.attributes.id : undefined))
        .then(filterUndefinedValues)
        .then(nestDscData)
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

export const getInnerCount = json => json.elements.filter(({attributes}) => attributes.id.indexOf('inner') > -1).length;

export const parseBook = ({json}) => options => {
    return new Promise((resolve, reject) => {
        const bookDesign = getProductGroup(json);
        const productDetected = getProductDeclaration(bookDesign);
        if (productDetected !== 'book') {
            return reject({error: 'design is not a book'});
        }
        const innerCount = getInnerCount(bookDesign);
        return Promise.all(
            bookDesign.elements.map(parseNodeToSurfacex({...options, innerCount}))
        )
        .then(surfaces => surfaces.filter(surface => typeof surface.error === 'undefined'))
        .then(surfaces => {
            const sort = (a, b) => a.z_index < b.z_index ? -1 : 1;
            surfaces = surfaces.sort(sort);
            return resolve({
                then: resolve => resolve({
                    [productDetected]: {
                        id: uuidV4(),
                        surfaces: surfaces.reduce((a, b) => {
                            console.info('>>>', 'b', b);
                            return ({...a, [b.id]: b});
                        }, {})
                    }
                })
            });
        })
    });
};

export default parseBook;