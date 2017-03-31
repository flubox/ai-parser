import convert from 'xml-js';
import { getColorsFromRects } from './colors';
// import { getColorsFromGroups as getColorsFromGroupsUsingLegacy } from './legacy/colors';
import { getFontsFromGroups } from './fonts';
import { parseImagesFromSVG } from './images';
import { ACL, Bucket, getLocation, getBase64SvgUploadOptions, mkUrl } from './upload';

export const merge = (a, b) => ({...a, ...b });

export const capitalizeFirstLetter = string => `${string.toUpperCase().substr(0, 1)}${string.toLowerCase().substr(1)}`;

export const extractData = mode => {}

export const groupsWalk = groups => mode => groups.map(extractData(mode));

export const legacyColorDeclaration = id => id.match(/COLOR_([\w]+)_([\d]+)/);
export const legacyClipartDeclaration = id => id.match(/CLIPART_([\w]+)_([\d]+)/);

export const getGroupsWithId = groups => groups.filter(g => g.id);

export const isLegacyMode = mode => mode === 'legacy';

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
    const { filename, endpoints, S3 } = options;
    // S3.getBucketCors({ Bucket: 'import' }, (err, data) => {
    //     console.info('...', 'err', err, 'data', data);
    // });
    // S3.listObjects({ Bucket }, (err, data) => {
    //     console.info('...', 'err', err, 'data', data);
    // });
    const groups = nodeList2Array(svg.querySelectorAll('g'));
    const mode = checkMode(groups);
    const colorsGroup = nodeList2Array(svg.querySelectorAll('rect[id*="color"]'));
    const fontsGroup = nodeList2Array(svg.querySelectorAll('g[id="fonts"] text'));
    const imagesGroup = nodeList2Array(svg.querySelectorAll('[id="images"] [id="image"]'));
    // console.info('###', 'groups', groups);
    const urlThumb = S3.upload(getBase64SvgUploadOptions(`${filename}/${filename.replace('.svg', '.thumb.svg')}`)(svg.outerHTML)).promise().then(data => {
        return data.Location;
    });
    console.info('...', 'urlThumb', urlThumb);
    const data = {
        urlThumb,
        title: svg.querySelector('title').textContent,
        colors: getColorsFromRects(colorsGroup),
        fonts: getFontsFromGroups(fontsGroup),
        images: parseImagesFromSVG(filename)(svg)(S3),
    };
    return data;
};

export default parser;