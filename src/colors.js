import { capitalizeFirstLetter, nodeList2Array } from './helper';
import { getDeclaration, 
// filterGroupById, 
getGroupsWithId } from './group';
import convertCssColorNameToHex from 'convert-css-color-name-to-hex';

// export const filterColorById = g => filterGroupById('color')(g);

export const getRgb = color => color.indexOf('#') === 0 ? color.replace(/#/g, '') : getRgb(convertCssColorNameToHex(color));

export const getRectFillColor = rect => getDeclaration(rect)('fill');

export const parseColorType = explicitColorDeclaration => explicitColorDeclaration.indexOf(':') > 0 ? explicitColorDeclaration.split(':').slice(1)[0] : explicitColorDeclaration;

export const getRgbFromColorPicker = group => {
    const colorPicker = group.querySelector('[fill]');
    // If the class used for a SVG element has no color value whatsoever, it will be assumed as black (#000000)
    return colorPicker === null ? '000000' : colorPicker.getAttribute('fill');
};

export const getColorTypeDeclaration = ({ id }) => {
    if (id.indexOf(':') > -1) {
        return getColorTypeDeclaration({ id: id.split(':')[1] });
    }
    return id.split('_').map(a => a.trim()).filter(a => a.length);
};

export const filterColorPrefix = color => color !== 'color';

export const getColorsFromRects = rects => ({hashFunction, hashMethod}) => {
    const useHashFunction = typeof hashFunction === 'function';
    return nodeList2Array(rects).map(rect => {
            const reduce = (a, b) => a.concat(b);
            const colorType = getColorTypeDeclaration(rect).filter(a => a.length).map(a => {
                return a.toLowerCase() === 'coverbackground' ? 'CoverBackground' : capitalizeFirstLetter(a);
            });
            const rgb = getRgb(getRectFillColor(rect));
            return { colorType, rgb };
        })
        .reduce((a, b) => a.concat(b.colorType.length ? b.colorType.map(colorType => ({...b, colorType })) : b), [])
        .map(color => useHashFunction ? { hash: hashMethod, [hashMethod]: hashFunction(JSON.stringify(color)), ...color } : color);
};