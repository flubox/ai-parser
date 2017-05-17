import { capitalizeFirstLetter, nodeList2Array } from './helper';
import { 
    // filterGroupById, 
    getDeclaration } from './group';

// export const filterFontsById = g => filterGroupById('fonts')(g);

export const getFontTypeDeclaration = text => getDeclaration(text)('font-family').split(',');

export const getFontName = rawFontData => Array.isArray(rawFontData) ? rawFontData[0].trim() : getFontName(rawFontData.split(',').map(a => a.trim()));

export const getName = rawFontData => Array.isArray(rawFontData) ? rawFontData[1].trim() : getName(rawFontData.split(',').map(a => a.trim()));

export const getDisplayName = rawFontData => Array.isArray(rawFontData) ? rawFontData[1].trim() : getDisplayName(rawFontData.split(',').map(a => a.trim()));

export const getFontsFromGroups = texts => ({hashFunction, hashMethod}) => {
    const useHashFunction = typeof hashFunction === 'function';
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
        .map(font => useHashFunction ? {...font, hash: hashMethod, [hashMethod]: hashFunction(JSON.stringify(font)) } : font);
};