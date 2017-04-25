import {merge} from './helper';

export const adjustType = data => {
    if (data.type === 'rect' && data['data-name'] === 'aperture') {
        console.info('>>>', 'adjustType', data.type !== data['data-name'], data.type, data['data-name'], data);
        return {...data, type: data['data-name']};
    }
    return data;
};

export const cleanedElementId = ({attributes}) => attributes.id.split('_').filter(isNaN).slice(0, 3);

export const extractPhysicalSize = ({width, height}) => ({width, height});

export const filterUndefinedValues = data => Object.keys(data).filter(k => !!data[k]).reduce((a, k) => ({...a, [k]: data[k]}), {});

export const getProductDeclaration = json => {
    if (json.attributes && json.attributes.id && json.attributes.id.indexOf('design:') === 0) {
        return json.attributes.id.split(':')[1];
    } else if (json.elements && json.elements.length === 1) {
        return getProductDeclaration(json.elements[0]);
    }
    return undefined;
};

export const getProductGroup = json => {
    return json.elements[0].elements.find(element => element.attributes && element.attributes.id.indexOf('design') > -1);
};

export const hasId = json => json.attributes && json.attributes.id;

export const hasAttributes = json => !!json.attributes;

export const getAttributes = json => json.attributes;

export const is = ({tag, json}) => json.name === tag;

export const refineResults = raw => results => ({...results.reduce(merge, {}), raw});

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

export const mergeRectUp = data => {
    if (onlyOneSurface(data) && data.surfaces[0].type === 'rect') {
        data = filterUndefinedValues({...data, ...data.surfaces[0], surfaces: undefined, raw: mergeRawWithSubRaw(data)});
    }
    return data;
};

export const mergeTextUp = data => {
    if (onlyOneSurface(data) && data.surfaces[0].type === 'text') {
        data = filterUndefinedValues({...data, ...data.surfaces[0], surfaces: undefined, raw: mergeRawWithSubRaw(data)});
    }
    return data;
};

export const mergeUseUp = data => {
    if (onlyOneSurface(data) && data.surfaces[0].type === 'use') {
        data = filterUndefinedValues({...data, ...data.surfaces[0], surfaces: undefined, raw: mergeRawWithSubRaw(data)});
    }
    return data;
};