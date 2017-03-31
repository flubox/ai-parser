import { capitalizeFirstLetter, nodeList2Array } from './parser';
import { ACL, Bucket, getLocation, getUploadOptions, getBase64UploadOptions, mkUrl, getSvgAsPng } from './upload';

const dimensions = {
    'urlThumb': ({ width, height }) => ({ width: width * 0.2, height: height * 0.2 }),
    'urlScaled': ({ width, height }) => ({ width: width * 0.5, height: height * 0.5 }),
    'urlFull': d => d
};

export const getDimensions = image => type => dimensions[type](image.width ? { width: image.width, height: image.height } : image.getBBox());

export const getImageType = image => capitalizeFirstLetter(image.id.split(':').reverse()[0].split('-')[0]);

export const getFullSvg = svg => part => {
    const svgEl = document.createElement('svg');
    svgEl.innerHTML = part.outerHTML;
    return svgEl;
};

const options = filename => [
    { filename, width: 525, height: 732 }
];
const thumbnailsOptions = filename => image => [
    { filename: `${filename}.thumb.svg`, ...getDimensions(image)('urlThumb') },
    { filename: `${filename}.scaled.svg`, ...getDimensions(image)('urlScaled') },
    { filename: `${filename}.full.svg`, ...getDimensions(image)('urlFull') }
];

export const extractBase64FromImage = image => image.src;

export const makeFullSvgFromClipart = svgClipart => {
    if (svgClipart.tagName === 'svg') {
        return svgClipart;
    }
    const svg = document.createElement('svg');
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svg.appendChild(svgClipart);
    return svg;
};

export const getSvgAsString = svg => svg.outerHTML;

export const errorOut = err => console.error(err) || err;

export const uploadSvgClipart = filename => Body => S3 => S3.upload(getUploadOptions(filename)(Body));

export const getMimeType = data => {
    const result = data['xlink:href'].match(/data:(image\/\w+);.+/g);
    return result;
};

export const getSvgUrl = data => ({ urlSvg: getLocation(data) });

export const uploadBase64Img = filename => Body => S3 => S3.upload(getBase64UploadOptions(filename)(Body)(getMimeType(Body))).promise();

export const getS3Filepath = filename => image => image && image.id ? `${filename}/${image.id.match(/([a-z0-9])*/gi).join('_')}.svg` : filename;

export const getThumbnailsUrl = filename => image => S3 => resolve => {
    if (image.tagName === 'image')  {
        // return thumbnailsOptions(filename)(image).map(option => {
        //     console.info('getThumbnailsUrl', 'image', image, 'option', option);
        //     const canvas = document.createElement('canvas');
        //     const img = new Image();
        //     img.src = extractBase64FromImage(image);

        //     return Promise.all(
        //         uploadBase64Img(getS3Filepath(filename)(image))(canvas.toDataURL())(S3)
        //     ).map(values => {
        //         console.info('########', 'values', values);
        //     });

        //     // img.onload = () => {
        //     //     const { width, height } = options;
        //     //     canvas.setAttribute('width', width);
        //     //     canvas.setAttribute('height', height);
        //     //     const context = canvas.getContext('2d');
        //     //     context.drawImage(img, 0, 0, width, height);
        //     //     return uploadBase64Img(getS3Filepath(filename)(image))(canvas.toDataURL())(S3).then(getSvgUrl);
        //     // };
        // });
        // return {
        //     url: undefined
        // };
    }

    return uploadSvgClipart(getS3Filepath(filename)(image))(getSvgAsString(makeFullSvgFromClipart(image)))(S3).promise(resolve);
};

export const getClipart = images => images.filter(image => image.id.indexOf(''));

export const parseImagesFromSVG = filename => svg => S3 => {
    const imagesGroup = nodeList2Array(svg.querySelectorAll('g[id="images"] [id*="image"]'));
    // const clipartsGroup = nodeList2Array(svg.querySelectorAll('g[id="images"] [id*="clipart"]'));
    // const cliparts = clipartsGroup.map(getClipartThumbnails(S3));

    return imagesGroup.map(image => {
        const imageType = getImageType(image);
        const urlSvg = data => getLocation(data);
        const resolve = data => ({ imageType })
        return getThumbnailsUrl(filename)(image)(S3)(resolve);
    });
};