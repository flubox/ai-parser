import convert from 'xml-js';
import {defaultCatchHandling, merge} from './helper';

// import {parseLayoutSet, layoutSetToDS} from './layouts';
import {parseToolkits} from './toolkit';
// import {parseDesigns} from './design';

export const designsSelectors = '#designs';

export const parse = {
    toolkits: svg => options => parseToolkits(svg)(options).catch(defaultCatchHandling('toolkits')),
    // designs: svg => options => parseDesigns(svg)(options).catch(defaultCatchHandling('designs')),
    // layouts: svg => options => parseLayoutSet(svg)(options).then(layoutSetToDS(options)).catch(defaultCatchHandling('layouts'))
};

export const parser = svg => options => {
    if (typeof svg === 'string') {
        const svgElement = document.querySelector(svg);
        if (unDef(svgElement)) {
            return Promise.reject("Can't find any dom element using selector: " + svg);
        }
        return parser(svgElement)(options);
    }

    return Promise.all([
        parse.toolkits(svg)(options),
        // parse.designs(svg)(options),
        // parse.layouts(svg)(options)
    ])
    .then(values => values.reduce(merge, {}))
    ;
};

export default parser;
