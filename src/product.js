import {isDef, merge} from './helper';

export const designAsBookSelectors = [
    '#spine',
    '[id*=cover_front_inside]',
    '[id*=cover_front_outside]',
    '[id*=cover_back_inside]',
    '[id*=cover_back_outside]',
    '[id*=inner_repeteable]'
];

export const checkDesignAsBook = svg => {
    return {book: designAsBookSelectors.every(selector => document.querySelector(selector))}
};

export const getProductDeclaration = json => {
    if (isDef(json)) {
        if (isDef(json.attributes)) {
            if (isDef(json.attributes.id)) {
                if (json.attributes.id.indexOf('design:') === 0) {
                    return json.attributes.id.split(':')[1];
                } else {
                    return json.attributes.id.split(':')[0];
                }
            } else if (isDef(json.elements) && json.elements.length === 1) {
                return getProductDeclaration(json.elements[0]);
            }
        } else if (isDef(json.elements) && json.elements.length === 1) {
            return getProductDeclaration(json.elements[0]);
        }
    }
    return undefined;
};

export const lookForProductAttributes = svg => {
    return [
        checkDesignAsBook(svg)
    ].reduce(merge, {});
};