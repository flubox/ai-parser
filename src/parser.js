import convert from 'xml-js';
import {defaultCatchHandling, merge} from './helper';
import {parseToolkits} from './toolkit';

export const parse = {
    toolkits: svg => options => parseToolkits(svg)(options).catch(defaultCatchHandling('toolkits')),
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
    ])
    .then(values => values.reduce(merge, {}))
    ;
};

export default parser;
