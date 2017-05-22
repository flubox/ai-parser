const uuidV4 = require('uuid/v4');
import {chain, combine, combineArray, from, fromPromise, just} from 'most';
import * as helper from './helper';
import {clean, concat, first, isDef, keys, merge, named, shouldAdd, toFloat} from './helper';
import {extractPhysicalSize, mergeResults} from './surfaces';
import {getProductDeclaration} from './product';

export const encapsulate = key => data => ({[key]: data});

export const extractAttributes = element => ({...element.attributes});

export const parseElements = options => parser => json => encapsulate('elements')(isDef(json.elements) ? ({...json, elements: json.elements.map(parser)}) : undefined);

export const extractTransform = data => {
    if (isDef(data.transform)) {
        const match = data.transform.match(/(translate)\(([\d\.]+)\s([\d\.]+)\)/)
        if (match) {
            const transform = {[match[1]]: toFloat({x: match[2], y: match[3]})};
            console.info('...', 'match', match, transform);
            data = ({...data, transform});
        }
    }
    return data;
};

export const addUuid = data => ({...data, uuid: uuidV4()});

export const hasGroups = data => isDef(data.elements) && data.elements.length > 0;

export const hasSubGroup = data => hasGroups(data) && data.elements.some(named('g'));

export const isTitle = data => named('title')(data) && isDef(data.elements) && data.elements.length === 1;

export const shouldSkipGroup = data =>  hasSubGroup(data);

export const popGroup = data => ({...data, elements: data.elements.map(e => named('g')(e) ? e.elements : e).reduce(concat, [])})

export const parseLayout = options => json => {
    
    if (isTitle(json)) {
        if (options.debug) console.info('°°°°°°°°°°°°°°°°°°°°°°°°°°°', 'json is title');
        return clean({...json, ...json.elements[0], elements: undefined});
    }

    if (shouldSkipGroup(json)) {
        if (options.debug) console.info('°°°°°°°°°°°°°°°°°°°°°°°°°°°', 'group should be skipped');
        return parseLayout(options)(popGroup(json));
    }

    if (isDef(json.attributes)) {
        return parseLayout(options)(clean({...json, ...json.attributes, attributes: undefined}));
    }

    if (isDef(json.elements)) {
        json = clean({...json, elements: json.elements.map(parseLayout(options))});
    }

    if (isDef(json.transform)) {
        json = extractTransform(json);
    }

    json = toFloat(json);

    console.info('\n parseLayout', json);
    console.info('@@@', json);

    return json;
};

export const removeUnit = unit => data => data.replace(unit, '');

export const subGroups = ({elements}) => elements;

export const parseLayoutSet = ({svg, json}) => options => {
    console.info('...', 'options', options, 'json', json);
    const firstGroup = first(json.elements);
    const {width, height} = extractPhysicalSize(firstGroup.attributes);
    const unit = helper.extractUnit(width || height);
    options = {...options, debug: false, unit, width, height};
    console.info('parseLayoutSet', 'options', options, 'json', json);
    const sub = subGroups(firstGroup);

    // return Promise.reject({error: 'design is not a book'});

    return new Promise((resolve, reject) => {
        const productDetected = getProductDeclaration(json);
        if (productDetected !== 'layouts') {
            return reject({error: 'this is not a layout'});
        }

        const layouts = {
            [productDetected]: {
                uuid: uuidV4(),
                product: 'layouts',
                type: 'layouts',
                layouts: sub.map(parseLayout(options))
            }
        };
        console.info('layouts', layouts);
        resolve(layouts);
    });
};

export default parseLayoutSet;