const uuidV4 = require('uuid/v4');
import {merge} from './helper';
import {getProductDeclaration} from './surfaces';

export const isDeprecated = id => id.indexOf('_autofillable') > -1 && id.indexOf('inner') > -1;

export const getTypeFromId = id => id.split('-')[0];

export const getSurfaceType = json => {
    return new Promise((resolve, reject) => {
        if (json.attributes && json.attributes.id) {
            return resolve({then: resolve => resolve({type: getTypeFromId(json.attributes.id)})});
        } else if (json.elements) {
            return Promise.all(json.elements.map(getSurfaceType)).then(value => resolve(value));
        }
        return reject({then: resolve => resolve(false)});

    });
};

export const getZIndex = ({attributes}) => {
    return new Promise(resolve => {
        let z_index = -1;
        const type = getTypeFromId(attributes.id);
        console.info('...', 'getZIndex', type);
        if (type === 'Background') {
            z_index = 0;
        }
        resolve({z_index});
    });
};

export const parseNodeToSurface = json => {
    return new Promise((resolve, reject) => { 
        const {id} = json.attributes;
        if (isDeprecated(id)) {
            reject({
                then: resolve => resolve({error: 'deprecated'})
            });
        }
        Promise.all([
            Promise.resolve({id: uuidV4()}),
            Promise.resolve({product: 'mug'}),
            getSurfaceType(json),
            getZIndex(json)
        ])
        .then(values => {
            values = {...values.reduce(merge, {}), raw: json, dsc_id: id};
            console.info('...', 'parseNodeToSurface', 'values', values);
            resolve({
                then: resolve => resolve(values)
            });
        })
        // .catch(error => reject({then: resolve => resolve({error})}))
        ;
    });
};

export const getProductGroup = json => {
    return json.elements[0].elements.find(element => element.attributes && element.attributes.id.indexOf('design') > -1);
};

export const parseMug = ({svg, json}) => options => {
    const mugDesign = getProductGroup(json);
    const productDetected = getProductDeclaration(mugDesign);
    // if (productDetected !== 'mug') {
    //     return Promise.reject();
    // }
    console.info('...', 'parseMug', productDetected, 'mugDesign', mugDesign, 'json', json);
    return Promise.all(
        mugDesign.elements[0].elements.map(
            node => parseNodeToSurface(node).then(values => {
                console.info('......', values);
                return values;
            })
        )
    )
    .then(surfaces => {
        const sort = (a, b) => a.z_index < b.z_index ? -1 : 1;
        surfaces = surfaces.sort(sort);
        console.info('...', 'mug', 'surfaces', surfaces);
        return {
            then: resolve => resolve({
                uuid: uuidV4(),
                id: options.filename
            })
        };
    })
};

export default parseMug;