import {camel, filterUndefinedValues, isDef, merge, unDef} from './helper';

export const filterDscKey = key => key.indexOf('dsc_') > -1;

export const makeDscValues = obj => keys => keys.map(k => ({dsc: {[k.split('_')[1]]: obj[k]}}));

export const mergeDscValues = values => values.reduce(merge, {});

export const typeToUppercase = data => unDef(data.type) ? data : ({...data, type: data.type.toUpperCase()});

export const camelCaseType = data => unDef(data.type) ? data : ({...data, type: camel(data.type)});

export const toDscType = data => {
    if (['aperture'].includes(data.type)) {
        return filterUndefinedValues({...data, id: data.uuid, id: undefined});
    }
    return data;
};

export const toDscId = data => {
    if (['aperture'].includes(data.type)) {
        return ({...data, id: data.id.split('-')[1]});
    }
    return data;
};

export const dscFunctions = options => {
    return [
        toDscType,
        toDscId
    ]
};

export const dscFunctionsReduce = (data, f) => f(data);

export const surfacesReduce = key => (accumulator, surface) => ({...accumulator, [surface[key]]: surface});

export const makeId = surface => surface.id || `${surface.type}:${surface.uuid}`;

export const surfaceToDsc = options => data => {
    if (isDef(data)) {
        data = dscFunctions(options).reduce(dscFunctionsReduce, data);
        if (isDef(data.surfaces)) {
            const surfacesKeys = Object.keys(data.surfaces);
            const extractSurface = data => k => data.surfaces[k];
            return ({...data, surfaces: surfacesKeys.map(extractSurface(data)).reduce((a, surface) => {
                return ({...a, [makeId(surface)]: surfaceToDsc(options)(surface)});
            }, {})});
        } else if (options.debug) {
            // console.warn('no data.surfaces found');
        }
    }

    return data;
};
