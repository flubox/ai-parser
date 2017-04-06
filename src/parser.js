import convert from 'xml-js';
import { getColorsFromRects } from './colors';
import { getFontsFromGroups } from './fonts';
import { parseImagesFromSVG } from './images';
import { ACL, Bucket, getLocation, getSvgUploadOptions, mkUrl } from './upload';

export const merge = (a, b) => ({...a, ...b });

export const filterGroupById = token => g => typeof g.id !== 'undefined' && g.id.indexOf(token) === 0;

export const getDeclaration = element => attribute => element.getAttribute(attribute);

export const capitalizeFirstLetter = string => `${string.toUpperCase().substr(0, 1)}${string.toLowerCase().substr(1)}`;

export const legacyColorDeclaration = id => id.match(/COLOR_([\w]+)_([\d]+)?/i);
export const legacyClipartDeclaration = id => id.match(/CLIPART_([\d]+)?/i);

export const getGroupsWithId = groups => groups.filter(g => g.id);

export const checkMode = groups => {
    const groupsWithId = getGroupsWithId(groups);
    const hasLegacyColorDeclaration = groupsWithId.some(g => legacyColorDeclaration(g.id));
    const hasLegacyClipartDeclaration = groupsWithId.some(g => legacyClipartDeclaration(g.id));
    if (hasLegacyColorDeclaration && hasLegacyColorDeclaration) {
        return 'legacy';
    }
    return 'flu';
};

export const nodeList2Array = nodeList => [].slice.call(nodeList);

export const parser = svg => options => {
    const { filename, S3, hashFunction } = options;
    const groups = nodeList2Array(svg.querySelectorAll('g'));
    const mode = checkMode(groups);
    const colorsGroup = nodeList2Array(svg.querySelectorAll('rect[id*="color"]'));
    const fontsGroup = nodeList2Array(svg.querySelectorAll('g[id="fonts"] text'));
    const imagesGroup = nodeList2Array(svg.querySelectorAll('[id="images"] [id="image"]'));
    const urlThumbPath = `${filename}/${filename.replace('.svg', '.thumb.svg')}`;
    return Promise.all([
        new Promise((resolve, reject) => S3.upload(getSvgUploadOptions(urlThumbPath)(svg.outerHTML)).promise().then(getLocation).then(urlThumb => resolve({ urlThumb }))),
        Promise.resolve({ title: svg.querySelector('title').textContent }),
        Promise.resolve({ colors: getColorsFromRects(colorsGroup)(hashFunction) }),
        Promise.resolve({ fonts: getFontsFromGroups(fontsGroup)(hashFunction) }),
        new Promise((resolve, reject) => parseImagesFromSVG(filename)(svg)(S3)(hashFunction).then(images => resolve({ images }))),
    ]).then(values => values.reduce(merge, {}));
};

export default parser;
