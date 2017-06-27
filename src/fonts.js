import { capitalizeFirstLetter, getDeclaration, nodeList2Array } from './helper';
import {hashForFont} from './hash';

export const getFontTypeDeclaration = text => getDeclaration(text)('font-family').split(',');

export const getFontName = rawFontData => Array.isArray(rawFontData) ? rawFontData[0].trim() : getFontName(rawFontData.split(',').map(a => a.trim()));

export const getName = rawFontData => Array.isArray(rawFontData) ? rawFontData[1].trim() : getName(rawFontData.split(',').map(a => a.trim()));

export const getDisplayName = rawFontData => Array.isArray(rawFontData) ? rawFontData[1].trim() : getDisplayName(rawFontData.split(',').map(a => a.trim()));

export const merge = (a, b) => ({...a, ...b});

export const getFontsFromGroups = texts => ({fn, method}) => {
    const useHashFunction = typeof fn === 'function';
    return texts.map(text => {
        const rawFontTypeDeclaration = getFontTypeDeclaration(text);
        const fontName = capitalizeFirstLetter(getFontName(rawFontTypeDeclaration));
        return {
            displayName: capitalizeFirstLetter(getDisplayName(rawFontTypeDeclaration)),
            fontName,
            id: fontName,
            name: capitalizeFirstLetter(getName(rawFontTypeDeclaration))
        };
    })
    .map(
        font => useHashFunction ? {
            ...font,
            hash: {
                keys: Object.keys(font).sort(),
                method,
                value: fn(JSON.stringify(Object.keys(font).sort().reduce(merge, {})))
            }
        } : font
    );
};
