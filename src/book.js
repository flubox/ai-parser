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
