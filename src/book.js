import {nestDscData} from './dsc';
import {mergeRawWithSubRaw, onlyOneSurface} from './surfaces';
import {filterUndefinedValues} from './helper';

export const isCover = id => id.indexOf('cover') > -1;

export const isSpine = id => id.indexOf('spine') > -1;

export const isInner = id => id.indexOf('inner') > -1;

export const extractIndexFromInnerId = id => id.match(/inner_(\d+)/);

export const getInnerIndex = id => {
    const raw = id.split('_')[1];
    return isNaN(raw) ? -1 : parseInt(raw, 10);
};

export const byId = {isCover, isSpine, isInner};

export const getInnerCount = json => json.elements.filter(({attributes}) => attributes.id.indexOf('inner') > -1).length;

export const resolveAperture = options => data => {
    if (onlyOneSurface(data) && data.type === 'aperture' && data.surfaces[0].type === 'rect') {
        data = {...data, ...data.surfaces[0], type: 'aperture', surfaces: undefined, 'data-name': undefined, raw: mergeRawWithSubRaw(data)};
        data = nestDscData(data);
        data = filterUndefinedValues(data);
    }
    return data;
};

export const resolveRect = options => data => {
    if (onlyOneSurface(data) && data.type === 'aperture' && data.surfaces[0].type === 'rect') {
        data = filterUndefinedValues({...data, ...data.surfaces[0], type: 'aperture', surfaces: undefined, 'data-name': undefined, raw: mergeRawWithSubRaw(data)});
    }
    return data;
};