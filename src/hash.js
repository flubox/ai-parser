import {merge} from './helper';

export const hash = ({method, fn, keys}) => data => {
    keys = keys || Object.keys(data);
    keys = keys.sort();
    const hashSubject = Object.keys(data).filter(k => keys.includes(k)).reduce(merge, {});
    const hash = {method, keys, value: fn(hashSubject)};
    return merge(data, hash);
};

export const hashForColor = ({method, fn}) => color => hash({method, fn, keys: Object.keys(color)})(color);

export const hashForImage = ({method, fn}) => image => hash({method, fn, keys: ['xlink:href']})(image);

export const hashForFont = ({method, fn}) => font => hash({method, fn, keys: Object.keys(font)})(font);

export default hash;