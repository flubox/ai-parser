const uuidV4 = require('uuid/v4');
import * as helper from './helper';
import {allType, concat, is, isDef, keys, merge, not, onlyOneSurface, unDef, sortByZindex} from './helper';
import {getProductDeclaration} from './product';

//WIP

export const isAutofillable = context => isDef(context) && context.indexOf('autofillable') > -1;
export const isBack = context => isDef(context) && context.indexOf('back') > -1;
export const isCover = context => isDef(context) && context.indexOf('cover') > -1;
export const isFront = context => isDef(context) && context.indexOf('front') > -1;
export const isFrontOrBack = context => isFront(id) || isBack(id);
export const isSpine = context => isDef(context) && context.indexOf('spine') > -1;
export const isInner = context => isDef(context) && context.indexOf('inner') > -1;
export const isInside = context => isDef(context) && context.indexOf('inside') > -1;
export const byId = {isCover, isFront, isFrontOrBack, isSpine, isInner};
export const isDeprecated = id => id && id.indexOf('_autofillable') > -1 && id.indexOf('inner') === 0;
export const extractIndexFromInnerId = id => id.match(/inner_(\d+)/);
export const filterDeprecatedElement = element => isDeprecated(element.attributes.id);
export const resolveFromError = e => Promise.resolve(e);

export const resolveAperture = options => data => {
    if (onlyOneSurface(data) && data.type === 'aperture' && data.elements[0].type === 'rect') {
        data = {...data, ...data.elements[0], type: 'aperture', elements: undefined, 'data-name': undefined};
        data = helper.filterUndefinedValues(data);
    }
    return data;
};
 
export const resolveRect = options => data => {
    const spineWithOneLayer = onlyOneSurface(data) && data.type === 'spine' && data.elements[0].type === 'layer';
    const layerWithOneAperture = onlyOneSurface(data) && data.type === 'layer' && data.elements[0].type === 'aperture';
    const apertureWithOneRect = onlyOneSurface(data) && data.type === 'aperture' && data.elements[0].type === 'rect';

    const groupWithRects = isDef(data.elements) && allType('rect')(data.elements);

    const layoutWithOneSubSurface = onlyOneSurface(data) && data.type === 'layout' && data.elements[0].type === 'g' && data.elements[0].elements;

    if (spineWithOneLayer && layerWithOneAperture && apertureWithOneRect) {
        data = helper.filterUndefinedValues({...data.elements[0], ...data, elements: undefined, 'data-name': undefined});
    }

    if (groupWithRects) {
        console.info('...', 'groupWithRects', {...data.elements});
        data = {...data.elements};
    }

    if (layoutWithOneSubSurface) {
        data = {
            ...data,
            elements: data.elements[0].elements.map(surface => {
                if (surface.elements && surface.elements.every(({type}) => is('rect'))) {
                    return surface.elements;
                }
                return surface;
            }).reduce(concat, [])
        };
    }

    return data;
};

export const resolveText = options => data => {
    const isText = data.type === 'text';
    const oneSurface = onlyOneSurface(data);
    const surfaceIsText = oneSurface && data.elements[0].type === 'text';

    if (isText) {
        if (surfaceIsText) {
            data = {...firstSurface(data)};
        } else if (isDef(data.elements)) {
            data = {...data, text: data.elements.map(({text}) => isDef(text) ? text : ' ').join(''), elements: undefined};
        }
    }

    return data;
};

export const addUuid = () => new Promise(resolve => resolve({uuid: uuidV4()}));
export const addProduct = () => new Promise(resolve => resolve({product: 'book'}));
export const extractAttributes = data => new Promise(resolve => resolve(isDef(data.attributes) ? {...data.attributes} : false));
export const extractElements = data => new Promise(resolve => resolve(isDef(data.elements) ? {elements: data.elements} : false));

export const getType = ({attributes, name, type}) => {
    return new Promise((resolve, reject) => {
        type = name;
        if (isDef(attributes) && isDef(attributes.id)) {
            type = helper.getTypeFromId(attributes.id);
            // if (type === 'cover') {
            //     console.info('############', 'getType', has_id, attributes.id, has_name, name, type);
            // }
            return resolve({then: resolve => resolve({type})});
        // } else if (isDef(name)) {
        //     type = name;
        //     return resolve({then: resolve => resolve({type})});
        }

        return resolve({then: resolve => resolve({type})});
        // return resolve({error: 'no type'});
    });
};

export const getZIndex = options => json => {
    return new Promise((resolve, reject) => {
        let z = -1;
        if (helper.hasId(json)) {
            const {id} = json.attributes;
            if (byId.isCover(id) || byId.isSpine(id)) {
                z = 0;
            } else if (byId.isInner(id)) {
                const extractedIndex = extractIndexFromInnerId(id);
                if (extractedIndex) {
                    z = extractedIndex[1];
                } else {
                    z = options.innerCount + (id === 'inner_barcode' ? 1 : 2);
                }
            }
        }
        return resolve({z});
    });
};

export const parseFunctionsStack = [
    () => addUuid,
    () => addProduct,
    () => extractAttributes,
    () => extractElements,
    () => getType,
    getZIndex,
    () => helper.getDefaultRotation,
    () => helper.getTransform
];

export const parsePage = options => json => {
    const mergeRules = [
        resolveAperture,
        resolveRect,
        resolveText
    ];
    return new Promise((resolve, reject) => {
        Promise.all(parseFunctionsStack.map(funk => funk(options)(json)))
        .then(data => data.filter(a => !!a))
        .then(helper.mergeWithoutUndef)
        .then(helper.solve(options)(mergeRules))
        .then(helper.toFloat)
        .then(data => {
            if (isDef(data.elements)) {
                return Promise.all(data.elements.map(parsePage(options))).then(elements => resolve({then: resolve => resolve({...data, elements})}));
            }
            return resolve({then: resolve => resolve(data)})
        })
    });
};

export const getProductGroup = ({elements}) => elements[0].elements.find(e => helper.hasAttributes(e) && e.attributes.id.match(/design/gi));

export const filterParsingErrors = ({debug}) => surface => {
    if (isDef(surface.error)) {
        if (debug) {
            console.warn(surface.error, {...surface});
        }
        return false;
    }
    return true;
};

export const parseBook = ({svg, json}) => options => {
    options = {...options, debug: false, flat: options.flat || false};
    return new Promise((resolve, reject) => {
        const {defs} = options;
        options.debug = false;
        options.flat = false;
        const bookDesign = getProductGroup(json);
        const productDetected = getProductDeclaration(bookDesign);
        if (productDetected !== 'book') {
            return reject({error: 'design is not a book'});
        }
        const innerCount = helper.getSiblingsCount(svg)('[id*=design]');
        return Promise.all(
            bookDesign.elements.map(parsePage({options: {...options, innerCount}}))
        )
        .then(elements => elements.filter(filterParsingErrors(options)))
        .then(elements => elements.reduce((a, surface) => a.concat(surface), []))
        .then(elements => {
            elements = elements.sort(sortByZindex).reduce((a, data) => ({...a, [options.flat ? data.uuid : data.id]: data}), {});
            const final = {
                [productDetected]: {
                    uuid: uuidV4(),
                    defs,
                    product: 'book',
                    type: 'book',
                    elements
                }
            };
            return resolve({then: resolve => resolve(final)});
        })
    });
};

export const seekId = options => data => {
    return new Promise(resolve => resolve({id: undefined}));
};

export const filterInner = data => Object.keys(data.elements).filter(k => isInner(data.elements[k])).reduce(merge, {...data});
export const seekName = ({filename}) => data => new Promise(resolve => resolve({name: filename.replace(/\.svg$/i, '')}));

export const seekToolkitIds = options => data => {
    return new Promise(resolve => resolve({toolkitIds: []}));
};

export const splitId = token => id => id.split(token);
export const fragmentId = id => splitId('_')(id).map(s => s.toUpperCase()).map(v => isNaN(v) ? v : parseInt(v));
export const hasPageNumber = idFragment => idFragment.some(v => !isNaN(v));

export const makePageDescId = element => {
    const {pageNumber, pageId, pageType} = element;
    return {id: `${pageNumber || null}_${pageType}_${pageId}`};
};

export const inferPageNumber = ({id}) => {
    return new Promise(resolve => {
        const fragmentedId = fragmentId(id);
        return resolve(hasPageNumber(fragmentedId) ? {pageNumber: fragmentedId.find(v => !isNaN(v))} : false);
    });
}

export const inferPageType = ({id}) => {
    return new Promise(resolve => {
        return Promise.all([
            new Promise(resolve => resolve(isSpine(id)  ? 'SPINE' : false)),
            new Promise(resolve => resolve(isFront(id) && !isInside(id)  ? 'FRONT_COVER' : false)),
            new Promise(resolve => resolve(isFront(id) && isInside(id) ? 'INNER_COVER_FRONT' : false)),
            new Promise(resolve => resolve(isInner(id) ? 'INNER' : false)),
            new Promise(resolve => resolve(isBack(id) && isInside(id) ? 'INNER_COVER_BACK' : false)),
            new Promise(resolve => resolve(isBack(id) && !isInside(id) ? 'BACK_COVER' : false))
        ])
        .then(a => a.filter(v => !!v))
        .then(helper.first)
        .then(pageType => resolve({pageType}));
    });
};

export const extractAltPages = element => {
    return new Promise(resolve => {
        if (unDef(element.elements) || !isInner(element.id) || isAutofillable(element.id)) {
            return resolve(false);
        }
        const altPages = element.elements.map(({id}) => parseInt(id, 10))
        return resolve({altPages});
    });
}

export const pageDescsFunctionStack = [
    inferPageNumber,
    inferPageType,
    () => Promise.resolve({pageId: undefined}),
    () => Promise.resolve({defaultThumbnail: undefined}),
    extractAltPages,
];

export const seekPagesDescs = options => elements => {
    elements = Object.keys(elements).map(k => elements[k]);
    const elementKey = element => Object.keys(element)[0];
    return new Promise(resolve => {
        return Promise.all(elements.map(element => {
            return Promise.all(pageDescsFunctionStack.map(f => f(element)))
            .then(a => a.filter(v => !!v))
            .then(b => b.reduce(merge, makePageDescId(b)))
        }))
        .then(a => a.reduce(concat, []))
        .then(b => {
            console.info('..........', 'pageDescs', b);
            return b;
        })
        .then(pageDescs => resolve({pageDescs}))
    });
};

export const seekSequences = options => data => {
    return new Promise(resolve => resolve({sequences: []}));
};

export const seekPagesRepeatables = ({pageDescs}) => {
    const {id} = pageDescs.find(pageDesc => {
        const {id, pageNumber, pageType} = pageDesc;
        return isDef(pageNumber) && pageNumber === 1;
    });
    return {pagesRepeatables: [id]};
};

export const toDscFunctionStack = [
    seekId,
    seekToolkitIds,
    seekPagesDescs,
    seekSequences,
    seekName
];

export const parseBookToDSC = options => data => {
    return new Promise((resolve, reject) => {
        if (unDef(data)) {
            return reject({error: 'no parsed data found'});
        }
        const productDeclaration = helper.first(Object.keys(data));
        const product = data[productDeclaration];
        const {elements} = data[productDeclaration];
        Promise.all(toDscFunctionStack.map(f => f(options)(elements)))
        .then(converted => converted.reduce(merge, {}))
        .then(data => ({...data, ...seekPagesRepeatables(data)}))
        .then(book => resolve({book}));
    });
};

export default parseBook;
