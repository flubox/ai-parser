import {filterUndefinedValues, getUse, merge} from './helper';

export const adjustType = data => {
    if (data.type === 'rect' && data['data-name'] === 'aperture') {
        return {...data, type: data['data-name']};
    }
    return data;
};

export const cleanedElementId = ({attributes}) => attributes.id.split('_').filter(isNaN).slice(0, 3);

export const extractPhysicalSize = ({width, height}) => ({width, height});

// export const getProductDeclaration = json => {
//     if (json.attributes && json.attributes.id && json.attributes.id.indexOf('design:') === 0) {
//         return json.attributes.id.split(':')[1];
//     } else if (json.elements && json.elements.length === 1) {
//         return getProductDeclaration(json.elements[0]);
//     }
//     return undefined;
// };

export const getProductGroup = json => {
    return json.elements[0].elements.find(element => element.attributes && element.attributes.id.indexOf('design') > -1);
};

export const hasId = json => json.attributes && json.attributes.id;

export const hasAttributes = json => !!json.attributes;

export const is = ({tag, json}) => json.name === tag;

export const refineResults = raw => results => {
    let refined = ({...results.filter(a => !!a).reduce(merge, {})});
    refined.raw = raw;
    // console.info('refineResults', raw, results.filter(a => !!a), refined);
    return refined;
};

export const filterSurfaceError = ({debug}) => surface => {
    if (typeof surface.error !== 'undefined') {
        if (debug) {
            console.warn(surface.error, {...surface});
        }
        return false;
    }
    return true;
};

export const transformRegexes = [
    {key: 'translate', regex: /translate\(([\d\.]+)\s?([\d\.]+)?\)/, refine: r => ({x: r[1], y: r[2] || 0})}
];

export const getSiblingsCount = svg => topSelector => document.querySelectorAll(`${topSelector}>g`).length;

export const getTransform = data => {
    return new Promise((resolve, reject) => {
        let {transform} = data;
        if (typeof transform === 'undefined') {
            resolve(data);
        }
        const results = transformRegexes.map(r => ({...r, result: transform.match(r.regex)})).filter(r => !!r.result);
        if (results.length) {
            transform = results.reduce((a, b) => ({...a, [b.key]: b.refine(b.result)}), {});
        }
        resolve({...data, transform});
    });
};

export const onlyOneSurface = data => data.surfaces && data.surfaces.length === 1;

// export const mergeRawWithSubRaw = data => data.raw.concat(data.surfaces[0].raw);
export const mergeRawWithSubRaw = data => [].concat(data.raw, data.surfaces[0].raw);

// export const mergeRectUp = data => {
//     if (onlyOneSurface(data) && data.surfaces[0].type === 'rect') {
//         data = filterUndefinedValues({...data, ...data.surfaces[0], surfaces: undefined, raw: mergeRawWithSubRaw(data)});
//     }
//     return data;
// };

export const mergeTextUp = options => data => {
    if (onlyOneSurface(data) && data.surfaces[0].type === 'text') {
        console.info('...', 'mergeTextUp', data);
        const {id, type} = data;
        data = filterUndefinedValues({...data, ...data.surfaces[0], surfaces: undefined, raw: mergeRawWithSubRaw(data), id, type});
    }
    return data;
};

export const mergeUseUp = data => {
    if (onlyOneSurface(data) && data.surfaces[0].type === 'use') {
        data = filterUndefinedValues({...data, ...data.surfaces[0], surfaces: undefined, raw: mergeRawWithSubRaw(data)});
    }
    return data;
};

export const extractSubSurfaces = data => {
    return data.surfaces && data.surfaces.length ? [{...data, surfaces: data.surfaces.map(s => s.uuid)}].concat(data.surfaces) : data;
};

export const hasSymbols = data => typeof data['xlink:href'] !== 'undefined';

export const getSymbols = ({symbols}) => data => symbols[getXlinkHref(data).substr(1)];

export const getXlinkHref = data => data['xlink:href'];

export const addUseToData = ({symbols}) => data => ({...data, use: getSymbols({symbols})(data)});

export const mergeWithUse = ({symbols}) => data => {
    const use = getSymbols({symbols})(data);
    return {...data, use};
};

export const resolveUse = ({debug, defs}) => data => {
    if (data.type === 'use') {
        const has_symbols = hasSymbols(data);
        if (debug && has_symbols) {
            // console.warn('use detected, but no xlik:href found', data);
            return data;
        }
        // console.info('...', 'resolveUse', data.type, 'data', data);
        const symbols = getSymbols(defs)(data);
        // console.info('...', 'symbols', symbols);
        const use = getUse(defs)(symbols);
        const elements = use ? [use] : undefined
        const toBeRemoved = {elements, 'xlink:href': undefined};
        const newData = filterUndefinedValues({...data, ...toBeRemoved});
        // console.info('###', 'data', newData, 'use', use);
        return newData;
    }
    return data;
};