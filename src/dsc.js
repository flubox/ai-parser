import {merge} from './helper';

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