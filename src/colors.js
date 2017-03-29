import { getGroupsWithId, nodeList2Array } from './parser';
import convertCssColorNameToHex from 'convert-css-color-name-to-hex';

export const capitalizeFirstLetter = string => `${string.toUpperCase().substr(0, 1)}${string.toLowerCase().substr(1)}`;

export const filterColorById = g => typeof g.id !== 'undefined' && g.id.indexOf('color') === 0;

export const getShortRgbValue = rawRgbValue => rawRgbValue.length < 6 ? rawRgbValue.split('').map(composant => `${composant}${composant}`).join('') : rawRgbValue;

export const getRgb = color => color.indexOf('#') === 0 ? color.replace(/#/g, '') : getRgb(convertCssColorNameToHex(color));

export const getGroupColorByText = text => text.getAttribute('fill');

export const parseColorType = explicitColorDeclaration => explicitColorDeclaration.indexOf(':') > 0 ? explicitColorDeclaration.split(':').slice(1) : explicitColorDeclaration;

export const getRgbFromColorPicker = group => {
    const colorPicker = group.querySelector('[fill]');
    // If the class used for a SVG element has no color value whatsoever, it will be assumed as black (#000000)
    return colorPicker === null ? '000000' : colorPicker.getAttribute('fill');
};

export const getColorTypeDeclaration = text => text.textContent.split(':');

export const filterColorPrefix = color => color !== 'color';

export const getColorsFromTexts = texts => {
    return nodeList2Array(texts).map(text => {
            const rawColorTypeDeclaration = getColorTypeDeclaration(text);
            const split = a => a.split(' ');
            const reduce = (a, b) => a.concat(b);
            const result = {
                colorType: rawColorTypeDeclaration.filter(filterColorPrefix).map(split).reduce(reduce, []),
                rgb: getRgb(getGroupColorByText(text))
            };
            return result;
        })
        .reduce((a, b) => a.concat(b.colorType.length ? b.colorType.map(colorType => ({...b, colorType })) : b), []);
};