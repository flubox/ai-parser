import { nodeList2Array } from './parser';

export const filterFontsById = g => typeof g.id !== 'undefined' && g.id.indexOf('fonts') === 0;

export const getFontTypeDeclaration = text => text.getAttribute('font-family').split(',');

export const getFontName = rawFontData => Array.isArray(rawFontData) ? rawFontData[0] : getFontName(rawFontData.split(',').map(a => a.trim()));

export const getName = rawFontData => Array.isArray(rawFontData) ? rawFontData[1] : getName(rawFontData.split(',').map(a => a.trim()));

export const getDisplayName = rawFontData => Array.isArray(rawFontData) ? rawFontData[1] : getDisplayName(rawFontData.split(',').map(a => a.trim()));

export const getFontsFromGroups = texts => {
    return texts.map(text => {
        const rawFontTypeDeclaration = getFontTypeDeclaration(text);
        return {
            name: getName(rawFontTypeDeclaration),
            displayName: getDisplayName(rawFontTypeDeclaration),
            fontName: getFontName(rawFontTypeDeclaration)
        };
    });
};