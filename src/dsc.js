import {camel, filterUndefinedValues, merge} from './helper';

export const addDscId = dsc_id => data => dsc_id ? ({...data, dsc_id}) : data;

export const filterDscKey = key => key.indexOf('dsc_') > -1;

export const makeDscValues = obj => keys => keys.map(k => ({dsc: {[k.split('_')[1]]: obj[k]}}));

export const mergeDscValues = values => values.reduce(merge, {});

export const removeDscKey = list => k => !list.includes(k);

export const nestDscData = data => {
    const dscKeys = Object.keys(data).filter(filterDscKey);
    const {dsc} = mergeDscValues(makeDscValues(data)(dscKeys));
    return {...Object.keys(data).filter(removeDscKey(dscKeys)).reduce((a, k) => ({...a, [k]: data[k]}), {}), dsc};
};

export const typeToUppercase = data => typeof data.type === 'undefined' ? data : ({...data, type: data.type.toUpperCase()});

export const camelCaseType = data => typeof data.type === 'undefined' ? data : ({...data, type: camel(data.type)});

export const toDscType = data => {
    if (typeof data !== 'undefined') {
        if (['aperture'].includes(data.type)) {
            return filterUndefinedValues({...data, id: data.uuid, id: undefined});
        }
    }
    return data;
};

export const dscFunctions = options => {
    return [
        toDscType,
    ]
};

export const dscFunctionsReduce = (data, f) => f(data);

export const surfacesReduce = key => (accumulator, surface) => ({...accumulator, [surface[key]]: surface});

export const surfaceToDsc = options => data => {
    data = dscFunctions(options).reduce(dscFunctionsReduce, data);
    // console.warn('surfaceToDsc', data);

    if (typeof data.surfaces !== 'undefined') {
        const surfacesKeys = Object.keys(data.surfaces);
        const extractSurface = data => k => data.surfaces[k];
        const surfaces = surfacesKeys.map(extractSurface(data)).reduce((a, s) => {
            return ({...a, [s.id]: surfaceToDsc(options)(s)});
        }, {});
        return {...data, surfaces};
    } else if (options.debug) {
        // console.warn('no data.surfaces found');
    }

    return data;
};
