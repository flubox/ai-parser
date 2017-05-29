import {merge} from './helper';

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
    if (json) {
        if (json.attributes && json.attributes.id && json.attributes.id.indexOf('design:') === 0) {
            return json.attributes.id.split(':')[1];
        } else if (json.elements && json.elements.length === 1) {
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