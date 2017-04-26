export const capitalizeFirstLetter = string => `${string.toUpperCase().substr(0, 1)}${string.toLowerCase().substr(1)}`;

export const concat = (a, b) => a.concat(b);

export const extract = targetName => json => {
    const {name, elements} = json;
    const noName = typeof name === 'undefined';
    const noElements = typeof elements === 'undefined';
    if (!noName && name === targetName) {
        return [json];
    } else if (!noElements) {
        return reduceByConcat(elements.map(extract(targetName)));
    }
    return [];
};

export const extractClipPaths = json => extract('clipPath')(json);
// export const extractClipPaths = json => {
//     const {name, elements} = json;
//     const noName = typeof name === 'undefined';
//     const noElements = typeof elements === 'undefined';
//     if (!noName && name === 'clipPath') {
//         return [json];
//     } else if (!noElements) {
//         return reduceByConcat(elements.map(extractSymbols));
//     }
//     return [];
// };

export const extactIdFromUrl = url => url.match(/url\(#(.+)\)/i);

export const extractSymbols = json => extract('symbol')(json);
// export const extractSymbols = json => {
//     const {name, elements} = json;
//     const noName = typeof name === 'undefined';
//     const noElements = typeof elements === 'undefined';
//     if (!noName && name === 'symbol') {
//         return [json];
//     } else if (!noElements) {
//         return reduceByConcat(elements.map(extractSymbols));
//     }
//     return [];
// };

export const extractUnit = size => {
    const match = size.match(/(?:[\.\d]+)([\D]+)/);
    if (match) {
        return match[1];
    }
};

// export const extractUuids = surface => Array.isArray(surface) ? reduceByConcat(surface.map(extractUuids)) : surface.uuid;
export const extractUuids = surface => Array.isArray(surface) ? surface.map(extractUuids) : surface.uuid;

export const extractIds = surface => Array.isArray(surface) ? surface.map(extractIds) : surface.id;

export const filterTag = tag => element => element.name === tag;

export const filterUndefinedValues = data => Object.keys(data).filter(k => !!data[k]).reduce((a, k) => ({...a, [k]: data[k]}), {});

export const getAttributes = json => json.attributes;

export const getSubGroupsWithId = svg => svg.querySelectorAll('g[id]');

export const getTypeFromId = id => id.split(/[-_]/)[0];

export const matchName = name => element => element.name === name;

export const isNode = obj => obj instanceof Node;

export const filterElementsByName = name => obj => obj.elements.filter(matchName);

export const get = name => obj => isNode(obj) ? obj.querySelectorAll(name) : (obj.elements ? filterElementsByName(name)(obj) : undefined);

export const getSubGroups = obj => get('g')(obj);

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

export const getRects = obj => get('rect')(obj);

export const getTexts = obj => get('text')(obj);

export const getUse = ({clipPath}) => ({attributes, elements}) => {
    if (typeof attributes === 'undefined' || typeof elements === 'undefined') {
        return undefined;
    }
    const merged = reduceByMerge([useClipPath({clipPath})])
    // console.info('...', 'attributes', {...attributes}, 'elements', [...elements], 'merged', {...merged});
    return isolate(isolate(elements).elements);
};

export const indexUp = key => object => ({[object[key] || [key]]: object});

export const isolate = array => array[0];

export const merge = (a, b) => ({...a, ...b });

export const nodeList2Array = nodeList => [].slice.call(nodeList);

export const reduceByConcat = list => Array.isArray(list) ? list.reduce(concat, []) : list;

export const reduceByMerge = list => Array.isArray(list) ? list.reduce(merge, {}) : list;

export const resolver = options => (data, f) => f(options)(data);

export const resolveByType = options => resolvers => data => resolvers.reduce(resolver(options), data);

export const riseSurfaces = ({debug}) => data => {
    if (data.surfaces && data.surfaces.length) {
        console.info('!!!!!!', 'riseSurfaces', data.surfaces);
        const uuids = data.surfaces.map(debug ? extractId : extractUuids);
        return [{...data, surfaces: uuids}].concat(data.surfaces.map(riseSurfaces));
    }
    return data;
};

export const useClipPath = defs => id => Array.isArray(id) ? reduceByMerge(id.map(useClipPath(defs))) : ({...defs.clipPath[id]});