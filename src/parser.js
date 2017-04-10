import convert from 'xml-js';
import { getColorsFromRects } from './colors';
import { getFontsFromGroups } from './fonts';
import { parseImagesFromSVG } from './images';
import { lookForProductAttributes } from './product';
import { ACL, Bucket, getLocation, getSvgUploadOptions, mkUrl } from './upload';
import {merge, nodeList2Array} from './helper';
import {checkMode, checkContent} from './check';
import {getDeclaration} from './group';

export const legacyColorDeclaration = id => id.match(/COLOR_([\w]+)_([\d]+)?/i);
export const legacyClipartDeclaration = id => id.match(/CLIPART_([\d]+)?/i);

export const parse = {
    toolkit: svg => options => {
        const { filename, S3, hashFunction, hashMethod } = options;
        const groups = nodeList2Array(svg.querySelectorAll('g#toolkit g'));
        console.info('...', 'groups', groups);
        if (groups.length === 0) {
            const errors = [{msg: 'TOOLKIT NOT PARSABLE : no matching toolkit attributes found'}];
            return Promise.resolve({then: resolve => resolve({toolkit: false, errors})});
        }
        const mode = checkMode(groups);
        const colorsGroup = nodeList2Array(svg.querySelectorAll('rect[id*="color"]'));
        const fontsGroup = nodeList2Array(svg.querySelectorAll('g[id="fonts"] text'));
        const imagesGroup = nodeList2Array(svg.querySelectorAll('[id="images"] [id="image"]'));
        const urlThumbPath = `${filename}/${filename.replace('.svg', '.thumb.svg')}`;
        return new Promise((resolve, reject) => {
            Promise.all([
                new Promise((resolve, reject) => S3.upload(getSvgUploadOptions(urlThumbPath)(svg.outerHTML)).promise().then(getLocation).then(thumbUrl => resolve({ thumbUrl }))),
                Promise.resolve({ id: filename }),
                Promise.resolve({ colors: getColorsFromRects(colorsGroup)({hashFunction, hashMethod}) }),
                Promise.resolve({ fonts: getFontsFromGroups(fontsGroup)({hashFunction, hashMethod}) }),
                new Promise((resolve, reject) => parseImagesFromSVG(filename)(svg)(S3)({hashFunction, hashMethod}).then(images => resolve({ images }))),
            ]).then(values => resolve({toolkit: values.reduce(merge, {})}))
        });
    },
    designs: svg => options => {
      return new Promise((resolve, reject) => {
          const designChecked = lookForProductAttributes(svg);
          const product = Object.keys(designChecked).find(key => designChecked[key]);
          console.info('###', 'designChecked', designChecked, 'product', product);
          const productFound = !!product && !!Object.keys(product).length;
          console.info('...', 'designChecked', designChecked, 'productFound', productFound, 'product', product);
          if (!productFound) {
              const errors = [{msg: 'DESIGN NOT PARSABLE : no matching product attributes found'}];
              return resolve({designs: false, errors});
          }
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
        new Promise((resolve, reject) => S3.upload(getSvgUploadOptions(urlThumbPath)(svg.outerHTML)).promise().then(getLocation).then(urlThumb => resolve({ urlThumb }))),
        Promise.resolve({ colors: getColorsFromRects(colorsGroup)({hashFunction, hashMethod}) }),
        Promise.resolve({ fonts: getFontsFromGroups(fontsGroup)({hashFunction, hashMethod}) }),
        new Promise((resolve, reject) => parseImagesFromSVG(filename)(svg)(S3)({hashFunction, hashMethod}).then(images => resolve({ images }))),
    ]).then(values => values.reduce(merge,
    {
        id: filename,
        title: svg.querySelector('title').textContent
    }));
};

export default parser;
