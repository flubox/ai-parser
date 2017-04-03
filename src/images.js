import { capitalizeFirstLetter, nodeList2Array } from './parser';
import { ACL, Bucket, getLocation, getSvgUploadOptions } from './upload';

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

export const getSvgUrl = previous => data => ({...previous, urlSvg: getLocation(data) });

export const getS3Filepath = filename => image => image && image.id ? `${filename}/${image.id.match(/([a-z0-9])*/gi).join('_')}.svg` : filename;

export const getSvgThumbnails = filename => image => S3 => uploadSvg(getS3Filepath(filename)(image))(svgAsString(makeSvg(image)))(S3).promise();

export const getClipart = images => images.filter(image => image.id.indexOf(''));

export const parseImagesFromSVG = filename => svg => S3 => hashFunction => {
    const useHashFunction = typeof hashFunction === 'function';
    const imagesGroup = nodeList2Array(svg.querySelectorAll('g[id="images"] [id*="image"]'));
    return Promise.all(imagesGroup.map(image => getSvgThumbnails(filename)(image)(S3).then(getSvgUrl({ imageType: getImageType(image) }))));
};