import {onlyOneSurface} from './surfaces';
import {allType, concat, isDef, filterUndefinedValues, is} from './helper';

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
        data = {...data, ...data.surfaces[0], type: 'aperture', surfaces: undefined, 'data-name': undefined};
        data = filterUndefinedValues(data);
    }
    return data;
};

export const resolveRect = options => data => {
    const spineWithOneLayer = onlyOneSurface(data) && data.type === 'spine' && data.surfaces[0].type === 'layer';
    const layerWithOneAperture = onlyOneSurface(data) && data.type === 'layer' && data.surfaces[0].type === 'aperture';
    const apertureWithOneRect = onlyOneSurface(data) && data.type === 'aperture' && data.surfaces[0].type === 'rect';

    const groupWithRects = isDef(data.surfaces) && allType('rect')(data.surfaces);

    const layoutWithOneSubSurface = onlyOneSurface(data) && data.type === 'layout' && data.surfaces[0].type === 'g' && data.surfaces[0].surfaces;

    if (spineWithOneLayer && layerWithOneAperture && apertureWithOneRect) {
        data = filterUndefinedValues({...data.surfaces[0], ...data, surfaces: undefined, 'data-name': undefined});
    }

    if (groupWithRects) {
        console.info('...', 'groupWithRects', {...data.surfaces});
        data = {...data.surfaces};
    }

    if (layoutWithOneSubSurface) {
        data = {
            ...data,
            surfaces: data.surfaces[0].surfaces.map(surface => {
                if (surface.surfaces && surface.surfaces.every(({type}) => is('rect'))) {
                    return surface.surfaces;
                }
                return surface;
            }).reduce(concat, [])
        };
    }

    return data;
};

