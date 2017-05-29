import { capitalizeFirstLetter, nodeList2Array } from './helper';
import { ACL, Bucket, getLocation, getSvgUploadOptions } from './upload';
import {hashForImage} from './hash';

export const getImageType = image => capitalizeFirstLetter(image.id.split(':').reverse()[0].split('-')[0]);

export const makeSvg = svgClipart => {
    if (svgClipart.tagName === 'svg') {
        return svgClipart;
    }
    const svg = document.createElement('svg');
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svgClipart.setAttribute('transform', "scale(0.25, 0.25)");
    svg.appendChild(svgClipart);
    return svg;
};

export const svgAsString = svg => svg.outerHTML;

export const uploadSvg = filename => Body => S3 => S3.upload(getSvgUploadOptions(filename)(Body));

export const sameValue = keys => value => keys.reduce((all, key) => ({[key]: value}), {});

export const getSvgUrl = previous => data => ({...previous, ...sameValue(['urlSvg', 'urlThumb', 'urlScaled', 'urlFull'])(getLocation(data)) });

export const getS3Filepath = filename => image => image && image.id ? `${filename}/${image.id.match(/([a-z0-9])*/gi).join('_')}.svg` : filename;

export const getSvgThumbnails = filename => image => S3 => uploadSvg(getS3Filepath(filename)(image))(svgAsString(makeSvg(image)))(S3).promise();

export const parseImagesFromSVG = filename => svg => S3 => ({fn, method}) => {
    const useHashFunction = typeof fn === 'function';
    const bitmapGroup = nodeList2Array(svg.querySelectorAll('#images image')) || [];
    const vectorialGroup = nodeList2Array(svg.querySelectorAll('#images g')) || [];
    const resolveWithHash = data => image => useHashFunction ? hashForImage({method, fn})(data) : data;
    const imagesGroup = bitmapGroup.concat(vectorialGroup);
    return Promise.all(imagesGroup.map(image => getSvgThumbnails(filename)(image)(S3)
        .then(data => resolveWithHash(getSvgUrl({ imageType: getImageType(image) })(data))(image))
    ));
};
