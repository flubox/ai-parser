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

export const checkContent = svg => {
    console.info('...', 'checkContent', typeof svg);
    const toolkit = !!svg.querySelectorAll('g#toolkit').length;
    const designs = !!svg.querySelectorAll('g#designs').length;
    console.info('...', 'checkContent', {toolkit, designs});
    return {toolkit, designs};
};

export const nodeList2Array = nodeList => [].slice.call(nodeList);

export const parse = {
    toolkit: svg => options => {
        const { filename, S3, hashFunction, hashMethod } = options;
        const groups = nodeList2Array(svg.querySelectorAll('g#toolkit g'));
        const mode = checkMode(groups);
        const colorsGroup = nodeList2Array(svg.querySelectorAll('rect[id*="color"]'));
        const fontsGroup = nodeList2Array(svg.querySelectorAll('g[id="fonts"] text'));
        const imagesGroup = nodeList2Array(svg.querySelectorAll('[id="images"] [id="image"]'));
        const urlThumbPath = `${filename}/${filename.replace('.svg', '.thumb.svg')}`;
        return new Promise((resolve, reject) => {
            Promise.all([
                new Promise((resolve, reject) => S3.upload(getSvgUploadOptions(urlThumbPath)(svg.outerHTML)).promise().then(getLocation).then(urlThumb => resolve({ urlThumb }))),
                Promise.resolve({ title: svg.querySelector('title').textContent }),
                Promise.resolve({ colors: getColorsFromRects(colorsGroup)({hashFunction, hashMethod}) }),
                Promise.resolve({ fonts: getFontsFromGroups(fontsGroup)({hashFunction, hashMethod}) }),
                new Promise((resolve, reject) => parseImagesFromSVG(filename)(svg)(S3)({hashFunction, hashMethod}).then(images => resolve({ images }))),
            ]).then(values => resolve({toolkit: values.reduce(merge, {})}))
        });
    },
    designs: svg => options => {
      return new Promise((resolve, reject) => {
          resolve({designs: []});
      });
    }
};

export const parser = svg => options => {
    if (typeof svg === 'string') {
        const svgElement = document.createElement('div');
        svgElement.innerHtml = svg;
        return parser(svgElement)(options);
    }

    const { filename, S3, hashFunction, hashMethod } = options;

    return Promise.all([
        parse.toolkit(svg)(options),
        parse.designs(svg)(options)
    ])
    .then(values => values.reduce(merge, {}))
    ;

};

export default parser;
