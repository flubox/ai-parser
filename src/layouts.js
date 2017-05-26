import convert from 'xml-js';
import * as helper from './helper';
import {extractPhysicalSize, mergeWithoutUndef} from './surfaces';
import {getProductDeclaration} from './product';

export const extractTransform = data => {
    if (helper.isDef(data.attributes) && helper.isDef(data.attributes.transform) && typeof data.attributes.transform === 'string') {
        const match = data.attributes.transform.match(/(translate)\(([\d\.]+)\s([\d\.]+)\)/)
        if (match) {
            return ({transform: {[match[1]]: helper.toFloat({x: match[2], y: match[3]})}});
        }
    }
    return false;
};

export const hasGroups = data => helper.isDef(data.elements) && data.elements.length > 0;

export const hasSubGroup = data => hasGroups(data) && data.elements.some(helper.named('g'));

export const shouldSkipGroup = data => hasSubGroup(data);

export const popGroup = data => shouldSkipGroup(data) ? ({...data, elements: data.elements.map(e => helper.named('g')(e) ? e.elements : e).reduce(helper.concat, [])}) : data;

export const needNewType = data => ['text', 'rect'].includes(data.name);

export const zIndex = (data, z) => ({...data, z});

export const parseLayout = options => json => {
    return new Promise(resolve => {
        if (helper.isTitle(json)) {
            return resolve({...json, ...json.elements[0], elements: undefined});
        }

        Promise.all([
            helper.isDef(json.attributes) && Promise.resolve({...json, ...json.attributes}),
            Promise.resolve(extractTransform(json)),
            !hasGroups(json) && Promise.resolve(helper.addHash(helper.keys(json))(json)),
            ['text', 'rect'].includes(json.name) && Promise.resolve({...json, type: json.name}),
            'g' === json.name && Promise.resolve({...json, type: 'layout'}),
        ])
        .then(layout => layout.filter(a => !!a))
        .then(layout => layout.map(a => ({...a, attributes: undefined, name: undefined})))
        .then(layout => layout.map(helper.clean))
        .then(layout => layout.map(helper.toFloat))
        .then(layout => layout.reduce(helper.merge, {}))
        .then(layout => helper.addUuid(layout))
        .then(layout => popGroup(layout))
        .then(layout => {
            if (helper.isDef(layout.elements)) {
                Promise.all(layout.elements.map(parseLayout(options)))
                .then(elements => resolve({...layout, elements: elements.map(zIndex)}));
            } else {
                return resolve(layout);
            }
        })
        ;
    });
};

export const subGroups = ({elements}) => elements;

export const parseLayoutSet = svg => options => {
    const json = JSON.parse(convert.xml2json(svg.outerHTML, {compact: false, spaces: 4}));
    const firstGroup = helper.first(json.elements);
    const {width, height} = extractPhysicalSize(firstGroup.attributes);
    const unit = helper.extractUnit(width || height);
    options = {...options, debug: false, unit, width, height};

    return new Promise((resolve, reject) => {
        const productDetected = getProductDeclaration(json);
        if (productDetected !== 'layouts') {
            return reject({error: 'this is not a layout set'});
        }

        Promise.all(subGroups(firstGroup).map(parseLayout(options)))
        .then(layouts => {
            const wTitle = a => helper.named('title')(a);
            const woTitle = a => !wTitle(a);
            const titleLayout = layouts.find(wTitle);
            const result = {
                layoutSet: helper.addUuid({
                    name: titleLayout.text,
                    type: [productDetected],
                    layouts: layouts.filter(woTitle).reverse()
                })
            };
            // console.info('...', 'parseLayoutSet', 'result', result);
            resolve(result);
        });
    });
};

export const layoutElement = ({height, uuid, rotation, width, x, y, z}) => ({height, rotation: rotation || 0, id: uuid, width, x, y, z});

export const layoutElementApertureFromRect = data => helper.merge(layoutElement(data), {type: 'aperture'});

export const extractXY = ({x, y}) => ({x, y});

export const layoutElementTextFromText = data => helper.merge(layoutElement(data), {...extractXY(data.transform.translate), type: 'text', size: data['font-size']});

export const layoutToDS = options => layout => {
    return new Promise(resolve => {
        let ds = {...layout};
        if ('rect' === ds.type) {
            return resolve(layoutElementApertureFromRect(ds));
        }
        if ('text' === ds.type) {
            return resolve(layoutElementTextFromText(ds));
        }

        if (ds.elements) {
            Promise.all(ds.elements.map(layoutToDS(options)))
            .then(elements => resolve({...ds, elements}));
        } else {
            resolve(ds);
        }
    });
};

export const layoutSetToDS = options => ({layoutSet}) => {
    return new Promise((resolve, reject) => {
        if (helper.unDef(layoutSet)) {
            return reject({error: 'no layoutSet provided'});
        }
        const {layouts} = layoutSet;
        if (helper.unDef(layouts)) {
            return reject({error: 'no layouts provided'});
        }

        Promise.all(layouts.map(layoutToDS(options)))
        .then(dsLayout => {
            console.info('@@@@@@@', 'layoutSetToDS', 'layouts', layouts, 'dsLayout', dsLayout);
            resolve(dsLayout);
        });
    });
};

export default parseLayoutSet;