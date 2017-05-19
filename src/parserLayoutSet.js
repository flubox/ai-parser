const uuidV4 = require('uuid/v4');
import {chain, combine, combineArray, from, fromPromise, just} from 'most';
import * as helper from './helper';
import {concat, first, isDef, keys, merge} from './helper';
import {extractPhysicalSize, mergeResults} from './surfaces';
import {getProductDeclaration} from './product';

export const encapsulate = key => data => ({[key]: data});

export const extractAttributes = element => ({...element, ...element.attributes, attributes: undefined});

export const parseElements = options => parser => json => encapsulate('elements')(isDef(json.elements) ? ({...json, elements: json.elements.map(parser)}) : undefined);

export const removeDataId = data => ({...data, 'data-id': undefined});

export const addUuid = data => ({...data, uuid: uuidV4()});

export const parseLayout = options => json => {
    // console.info('parseLayout', json);

    const elements = isDef(json.elements) ? json.elements.map(parseLayout(options)) : [];
    const merge = a => ({...a, elements});
    const result = [
        extractAttributes,
        merge,
        removeDataId,
        helper.filterUndefinedValues,
        addUuid
    ].reduce((a, f) => ({...a, ...f(json)}), json);

    console.info('...', 'result', result);

    return result;

    // const data = just(json)
    // .map(extractAttributes)
    // .map(parseElements(parseLayout(options)))
    // .map(helper.filterUndefinedValues)
    // .map(addUuid)

    // return data;
    
    // layout
    // .forEach(console.info.bind(console))
    
// export const parseLayout = ({options, json}) => {
    // return new Promise(resolve => {
    //     const attributes = isDef(json) && isDef(json.attributes) ? json.attributes : {};
    //     const elements = isDef(json) && isDef(json.elements) ? json.elements : [];
    //     console.info('parseLayout', options, json, attributes, elements);
    //     Promise.all([
    //         Promise.resolve({
    //             ...attributes,
    //             name: attributes['data-name'],
    //             uuid: uuidV4(),
    //             raw: {...json},
    //             elements,
    //             attributes: undefined
    //         })
    //     ])
    //     .then(helper.filterUndefinedValues)
    //     .then(first)
    //     .then(parseElements)
    //     .then(layout => {
    //         resolve({[layout.uuid]: layout});
    //     })
    // });
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

        // .then(layoutStreams => {
        //     const final = combineArray(a => a, layoutStreams)
        //     console.info('final', final);
        // })

        // return Promise.all(parsedLayoutSet)
        // .then(result => {
        //     console.info('...', result);
        // })

        // const final = combine(merge, base, parsedLayoutSet)

        // return Promise.all(
        //     sub.map(element => parseLayout({options, json: element}))
        //     // [parseLayout({options, json: sub})]
        // )
        // .then(result => {
        //     console.info('parseLayoutSet', 'result', result);
        //     const {width, height} = helper.toFloat(options);
        //     const final = {
        //         [productDetected]: {
        //             layouts: result.reduce(merge, {}),
        //             unit,
        //             width, height
        //         }
        //     };
        //     console.info('parseLayoutSet', 'final', final);
        //     // const final = {
        //     //     [productDetected]: {
        //     //         ...result
        //     //         uuid: uuidV4(),
        //     //         product: 'layouts',
        //     //         type: 'layouts',
        //     //     }
        //     // };
        //     // console.info('...', 'final', final);
        //     return resolve({then: resolve => resolve(final)});
        // })
    });
};

export default parseLayoutSet;