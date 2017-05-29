import md5 from 'blueimp-md5';
const uuidV4 = require('uuid/v4');
export const addUuid = data => ({...data, uuid: uuidV4()});
export const addHash = keys => data => {
    if (unDef(data.hash)) {
        const hash = md5(Object.keys(data).filter(k => !keys.includes(k)).reduce(merge, {}));
        return ({...data, hash});
    }
    return data;
}
export const all = key => value => list => list.every(item => isDef(item[key]) && item[key] === value);
export const allType = value => list => all('type')(value)(list);
export const camel = text => `${uCase(0)(1)(text)}${lCase(1)(text)}`;
export const capitalizeFirstLetter = string => `${string.toUpperCase().substr(0, 1)}${string.toLowerCase().substr(1)}`;
export const clean = data => Object.keys(data).reduce((all, k) => shouldAdd(data[k]) ? ({...all, [k]: data[k]}) : all, {});
export const concat = (a, b) => a.concat(b);

export const defaultErrorHandling = key => ({error}) => {
    console.error(error);
    return Promise.resolve({then: resolve => resolve({[key]: false})});
};

export const defaultsWarningHandling = key => ({warning}) => {
    console.warn(warning);
    return Promise.resolve({then: resolve => resolve({[key]: false})});
};

export const defaultCatchHandling = key => ({error, warning}) => isDef(error) ? defaultErrorHandling({error}) : defaultsWarningHandling({warning});

export const encapsulate = key => data => ({[key]: data});
export const encapsulateViaFunction = (f = a => a) => data => key => ({[key]: f(data[key])});
export const extract = targetName => json => {
    const {name, elements} = json;
    if (unDef(name) && name === targetName) {
        return [json];
    } else if (unDef(elements)) {
        return reduceByConcat(elements.map(extract(targetName)));
    }
    return [];
};
// export const convertToUnit = dimension => viewbox => viewport => value => {
//     if (viewbox[dimension] === 0) {
//         return value;
//     } 
//     return viewport[dimension] === 0 ? value : value * (viewport[dimension] / viewbox[dimension]);
// };
// export const toUnit = options => data => {
//     // if (data.type === 'rect') console.info('\n', data.type, data);
//     const {viewbox, viewport} = options;
//     const converted = keys(data).filter(only(['x', 'y', 'width', 'height'])).reduce((accumulator, k) => {
//         const dimension = ['x', 'width'].includes(k) ? 'width' : 'height';
//         // if (data.type === 'rect') console.info('toUnit', k, `dimension:${dimension}`, data[k] === 0, data[k], convertToUnit(dimension)(viewbox)(viewport)(data[k]));
//         return {...accumulator, [k]: data[k] === 0 ? data[k] : convertToUnit(dimension)(viewbox)(viewport)(data[k])};
//     }, {});
//     return {...data, ...converted};
// };
export const extractClipPaths = json => {
    const {name, elements} = json;
    const noName = typeof name === 'undefined';
    const noElements = typeof elements === 'undefined';
    if (!noName && name === 'clipPath') {
        return [json];
    } else if (!noElements) {
        return reduceByConcat(elements.map(extractSymbols));
    }
    return [];
};
export const extactIdFromUrl = url => url.match(/url\(#(.+)\)/i);
export const extractSymbols = json => {
    const {name, elements} = json;
    const noName = typeof name === 'undefined';
    const noElements = typeof elements === 'undefined';
    if (!noName && name === 'symbol') {
        return [json];
    } else if (!noElements) {
        return reduceByConcat(elements.map(extractSymbols));
    }
    return [];
};
export const extractUnit = size => {
    const match = size.match(/(?:[\.\d]+)([\D]+)/);
    if (match) {
        return match[1];
    }
};
export const extractUuids = surface => Array.isArray(surface) ? surface.map(extractUuids) : surface.uuid;
export const extractPhysicalSize = ({width, height}) => ({width, height});
export const extractIds = surface => Array.isArray(surface) ? surface.map(extractIds) : surface.id;
export const extractIdentifiers = debug => surface => debug && hasId(surface) ? extractIds(surface) : extractUuids(surface);
export const filterTag = tag => element => element.name === tag;
export const filterUndefinedValues = data => isArray(data) ? data.map(filterUndefinedValues) : keys(data || {}).filter(k => isDef(data[k])).reduce(reduceByKeys(data), {});
export const filterEmptySurfaces = data => unDef(data.surfaces) ? data : (Object.keys(data.surfaces).length ? data : filterUndefinedValues({...data, surfaces: undefined}));
export const filterElementsByName = name => obj => obj.elements.filter(matchName);
export const float = value => parseFloat(value);
export const first = array => array[0];
// export const getDefaultRotation = data => new Promise(resolve => resolve({...keysExcept(data)('type').reduce(mergeWith(data), {}), rotation: 0}));
export const getDefaultRotation = () => new Promise(resolve => resolve({rotation: 0}));
export const getSiblingsCount = svg => topSelector => document.querySelectorAll(`${topSelector}>g`).length;
export const getText = ({elements}) => isDef(elements) && elements.length === 1 ? filterUndefinedValues({...elements[0], type: undefined}) : undefined;
export const getTransform = data => {
    return new Promise((resolve, reject) => {
        let {transform} = data;
        if (unDef(transform)) {
            resolve(false);
        }
        const results = transformRegexes.map(r => ({...r, result: transform.match(r.regex)})).filter(({result}) => isDef(result));
        if (results.length) {
            transform = results.reduce((a, b) => ({...a, [b.key]: b.refine((b.result))}), {});
        }
        resolve({transform});
    });
};
export const hasId = json => isDef(json.attributes) && isDef(json.attributes.id);
export const hasAttributes = json => isDef(json.attributes);
export const isArray = data => Array.isArray(data);
export const keys = data => Object.keys(data || {});
export const keysExcept = data => except => keys(data).filter(not(except));
export const keysOnly = data => selected => keys(data).filter(only(selected));
export const lCase = (start = 0) => text => text.substr(start).toLowerCase();
export const reduceByKeys = data => (accumulator, k) => ({...accumulator, [k]: data[k]});
export const get = name => obj => isNode(obj) ? obj.querySelectorAll(name) : (obj.elements ? filterElementsByName(name)(obj) : undefined);
export const getSubGroups = obj => get('g')(obj);
export const getSubGroupsWithId = svg => svg.querySelectorAll('g[id]');
export const getTypeFromId = id => id.split(/[-_]/)[0];
export const getRects = obj => get('rect')(obj);
export const getTexts = obj => get('text')(obj);
export const getUse = ({clipPath}) => ({attributes, elements}) => unDef(attributes) || unDef(elements) ? undefined : first(first(elements).elements);
// export const getViewBox = json => {
//     if (json && json.attributes && json.attributes.viewBox) {
//         const {viewBox} = json.attributes;
//         const matched = viewBox.match(/([\d\.]+)+/g);
//         const keys = ['x', 'y', 'width', 'height'];
//         return matched.reduce((accumulator, value, index) => ({...accumulator, [keys[index]]: parseFloat(value)}), {});
//     }
//     return false;
// };
export const isDef = item => !unDef(item);
export const indexUp = key => object => ({[object[key] || [key]]: object});
export const is = a => b => Array.isArray(a) ? a.includes(b) : a === b;
export const isNode = obj => obj instanceof Node;
export const isTitle = data => named('title')(data) && isDef(data.elements) && data.elements.length === 1;
export const matchName = name => element => element.name === name;
export const merge = (a, b) => ({...a, ...b });
export const mergeWith = data => (accumulator, key) => ({...accumulator, [key]: data[key]});
export const mergeWithoutUndef = results => ({...results.filter(isDef).reduce(merge, {})});
export const named = value => data => data.name === value;
export const nodeList2Array = nodeList => [].slice.call(nodeList);
export const not = a => b => Array.isArray(a) ? !a.includes(b) : a !== b;
export const only = keys => key => keys.includes(key);
export const onlyOneSurface = data => isDef(data.surfaces) && data.surfaces.length === 1;
export const unDef = item => typeof item === 'undefined';
export const reduceByConcat = list => Array.isArray(list) ? list.reduce(concat, []) : list;
export const reduceByMerge = list => Array.isArray(list) ? list.reduce(merge, {}) : list;
export const resolver = options => (data, f) => f(options)(data);
export const solve = options => resolvers => data => resolvers.reduce(resolver(options), data);
export const shouldAdd = data => isDef(data);
export const sortByZindex = (a, b) => a.z < b.z ? -1 : 1;
export const useClipPath = defs => id => Array.isArray(id) ? reduceByMerge(id.map(useClipPath(defs))) : ({...defs.clipPath[id]});
export const uCase = (start = 0) => (end = 1) => text => text.substr(start, end).toUpperCase;
export const toFloat = data => ({...data, ...keys(data).filter(only(['x', 'y', 'width', 'height'])).map(encapsulateViaFunction(float)(data)).reduce(merge, {})});
