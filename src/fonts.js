import { capitalizeFirstLetter, filterGroupById, getDeclaration, nodeList2Array } from './parser';

export const filterFontsById = g => filterGroupById('fonts')(g);

// export const getFontTypeDeclaration = text => text.getAttribute('font-family').split(',');
export const getFontTypeDeclaration = text => getDeclaration(text)('font-family').split(',');
//  text => text.getAttribute('font-family').split(',');

export const getFontName = rawFontData => Array.isArray(rawFontData) ? rawFontData[0].trim() : getFontName(rawFontData.split(',').map(a => a.trim()));

export const getName = rawFontData => Array.isArray(rawFontData) ? rawFontData[1].trim() : getName(rawFontData.split(',').map(a => a.trim()));

export const getDisplayName = rawFontData => Array.isArray(rawFontData) ? rawFontData[1].trim() : getDisplayName(rawFontData.split(',').map(a => a.trim()));

export const getFontsFromGroups = texts => ({hashFunction, hashMethod}) => {
    const useHashFunction = typeof hashFunction === 'function';
    return texts.map(text => {
            const rawFontTypeDeclaration = getFontTypeDeclaration(text);
            return {
                name: capitalizeFirstLetter(getName(rawFontTypeDeclaration)),
                displayName: capitalizeFirstLetter(getDisplayName(rawFontTypeDeclaration)),
                fontName: capitalizeFirstLetter(getFontName(rawFontTypeDeclaration))
            };
        })
        .map(font => useHashFunction ? {...font, hash: hashMethod, [hashMethod]: hashFunction(JSON.stringify(font)) } : font);
};