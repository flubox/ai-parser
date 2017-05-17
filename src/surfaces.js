import {filterUndefinedValues, getUse, hasAttributes, hasId, isDef, is, merge, unDef} from './helper';

export const adjustType = data => {
    if (data.type === 'rect' && data['data-name'] === 'aperture') {
        return {...data, type: data['data-name']};
    }
    return data;
};

export const cleanedElementId = ({attributes}) => attributes.id.split('_').filter(isNaN).slice(0, 3);

export const extractPhysicalSize = ({width, height}) => ({width, height});

export const getProductGroup = json => {
    return json.elements[0].elements.find(element => element.attributes && element.attributes.id.indexOf('design') > -1);
};

export const mergeResults = results => ({...results.filter(isDef).reduce(merge, {})});

export const filterSurfaceError = ({debug}) => surface => {
    if (isDef(surface.error)) {
        if (debug) {
            console.warn(surface.error, {...surface});
        }
        return false;
    }
    return true;
};

export const transformRegexes = [
    {key: 'translate', regex: /translate\(([\d\.]+)\s?([\d\.]+)?\)/, refine: r => ({x: parseFloat(r[1]), y: parseFloat(r[2]) || 0})}
];

export const getSiblingsCount = svg => topSelector => document.querySelectorAll(`${topSelector}>g`).length;

export const getTransform = data => {
    return new Promise((resolve, reject) => {
        let {transform} = data;
        if (unDef(transform)) {
            resolve(data);
        }
        const results = transformRegexes.map(r => ({...r, result: transform.match(r.regex)})).filter(({result}) => isDef(result));
        if (results.length) {
            transform = results.reduce((a, b) => ({...a, [b.key]: b.refine((b.result))}), {});
        }
        resolve({...data, transform});
    });
};

export const onlyOneSurface = data => isDef(data.surfaces) && data.surfaces.length === 1;

export const mergeRawWithSubRaw = data => [].concat(data.raw, data.surfaces[0].raw);

export const firstSurface = ({surfaces}) => surfaces[0];

export const filterForMergeUp = data => type => onlyOneSurface(data) && firstSurface(data).type === type;

export const resolveText = options => data => {
    const isText = data.type === 'text';
    const oneSurface = onlyOneSurface(data);
    const surfaceIsText = oneSurface && data.surfaces[0].type === 'text';

    if (isText) {
        if (surfaceIsText) {
            data = {...firstSurface(data)};
        } else if (isDef(data.surfaces)) {
            data = {...data, text: data.surfaces.map(({text}) => isDef(text) ? text : ' ').join(''), surfaces: undefined};
        }
    }

    return data;
};

export const mergeUseUp = data => filterForMergeUp(data)('use') ? filterUndefinedValues({...data, ...firstSurface(data), surfaces: undefined, raw: mergeRawWithSubRaw(data)}) : data;

// export const extractSubSurfaces = data => data.surfaces && data.surfaces.length ? [{...data, surfaces: data.surfaces.map(s => s.uuid)}].concat(data.surfaces) : data;

export const hasSymbols = data => isDef(data['xlink:href']);

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