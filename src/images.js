import { capitalizeFirstLetter, nodeList2Array } from './helper';
import { ACL, Bucket, getLocation, getSvgUploadOptions, getBase64UploadOptions } from './upload';
import {hashForImage} from './hash';

export const getImageType = image => capitalizeFirstLetter(image.id.split(':').reverse()[0].split('-')[0]);

export const getImageId = image => image.id.split(':')[0];

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

export const uploadBase64 = filename => Body => S3 => {
    const headers = getBase64UploadOptions(filename)(Body);
    return S3.upload(headers);
}

export const getExtension = filename => filename.split('.').reverse()[0];

export const sameValue = keys => value => keys.reduce((all, key) => ({[key]: value}), {});

export const getSvgUrl = previous => data => ({...previous, urlSvg: data.Location, urlFull: data.Location});

export const getS3Filepath = filename => image => image && image.id ? `${filename}/${image.id.match(/([a-z0-9])*/gi).join('_')}.svg` : filename;

export const getSvgThumbnails = filename => image => S3 => uploadSvg(getS3Filepath(filename)(image))(svgAsString(makeSvg(image)))(S3).promise();

export const extractBase64 = svg => svg.getAttribute('xlink:href');

export const getBase64Images = filename => svg => S3 => ({fn, method}) =>{
    return new Promise(resolve => {
        const originalFilename = filename;
        let {width, height} = svg;
        const extension = getExtension(filename);
        const id = getImageId(svg);
        filename = filename + '/' + filename.replace('.svg', `.${id}.png`);
        width = width.baseVal.value;
        height = height.baseVal.value;
        const base64 = extractBase64(svg);
        const hash = fn ? {
            key: ['base64'],
            value: fn(base64),
            method
        } : false;
        const mapping = [
            {url: 'urlThumb', scale: 0.25}, {url: 'urlScaled', scale: 0.5}, {url: 'urlFull', scale: 1}
        ].map(({url, scale}) => {
            return {
                filename: filename.replace('.png', `.${width * scale}x${height * scale}.png`),
                base64, width: width * scale, height: height * scale
            };
        }).reduce((a, b) => a.concat(b), []);

        Promise.all(mapping.map(({base64, filename, height, image, scale, width}) => {
                return new Promise(resolve => {
                    let tmpImg = new Image();
                    tmpImg.onload = () => {
                        const canvas = document.createElement('canvas');
                        canvas.setAttribute('width', width);
                        canvas.setAttribute('height', height);
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(tmpImg, 0, 0, width, height);
                        ctx.scale(scale, scale);
                        const b64 = canvas.toDataURL();
                        const Body = new Buffer(b64.replace('data:image/png;base64,',''), 'base64');
                        const s3Promise = uploadBase64(filename)(Body)(S3).promise();
                        resolve(s3Promise);
                    }
                    tmpImg.src = base64;
                });
            })
        )
        .then(values => {
            const result = {
                id,
                urlThumb: values[0].Location,
                urlScaled: values[1].Location,
                urlFull: values[2].Location,
            };
            resolve(hash ? {...result, hash} : result)
        });
    });
};

export const isSvgWithBase64 = svg => {
    const xlink = svg.getAttribute('xlink:href');
    const base64 = !!svg && !!xlink && xlink.indexOf('base64') !== -1;
    return base64;
}

export const parseImagesFromSVG = filename => svg => S3 => ({fn, method}) => {
    const useHashFunction = typeof fn === 'function';
    const bitmapGroup = nodeList2Array(svg.querySelectorAll('#images image')) || [];
    const vectorialGroup = nodeList2Array(svg.querySelectorAll('#images g')) || [];
    const resolveWithHash = data => image =>  useHashFunction ? {...data, hash: {keys: [], value: fn(image), method}} : data;
    const imagesGroup = bitmapGroup.concat(vectorialGroup);
    return Promise.all(imagesGroup.map(image => {
        const isBase64 = isSvgWithBase64(image);
        if (isBase64) {
            return {...getBase64Images(filename)(image)(S3)({fn, method}), imageType: getImageType(image)};
        }
        return getSvgThumbnails(filename)(image)(S3).then(data => resolveWithHash(getSvgUrl({ id: getImageId(image), imageType: getImageType(image) })(data))(image))
    }));
};
