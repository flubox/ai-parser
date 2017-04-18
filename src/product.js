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

export const lookForProductAttributes = svg => {
    return [
        checkDesignAsBook(svg)
    ].reduce(merge, {});
};