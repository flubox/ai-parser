import {merge} from './helper';

export const cleanedElementId = ({attributes}) => attributes.id.split('_').filter(isNaN).slice(0, 3);

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
    {key: 'translate', regex: /translate\(([\d\.]+)\s([\d\.]+)\)/, refine: r => ({x: r[1], y: r[2]})}
];

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