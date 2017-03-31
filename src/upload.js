export const Bucket = 'design-service';
export const ACL = 'public-read';

export const mkUrl = filename => `import/${filename}`;

export const getLocation = data => data.Location;

export const getUploadOptions = f => Body => ({ Key: mkUrl(f), Body, Bucket, ACL });

export const getBase64UploadOptions = f => Body => ContentType => ({...getUploadOptions(f)(Body), ContentEncoding: 'base64', ContentType });

export const getBase64PngUploadOptions = f => Body => ({...getUploadOptions(f)(Body), ContentEncoding: 'base64', ContentType: 'image/png' });

export const getBase64SvgUploadOptions = f => Body => ({...getUploadOptions(f)(Body), ContentEncoding: 'base64', ContentType: 'image/svg+xml' });

export const getSvgUploadOptions = f => Body => ({...getUploadOptions(f)(Body) });

const defaultHeaders = {
    'Access-Control-Allow-Origin': '*'
};
const headersForText = {...defaultHeaders, 'Content-Type': 'text/plain' };
const headersForJson = {...defaultHeaders, 'Content-Type': 'application/json' };
export const defaultFetchOptions = body => ({ body, mode: 'cors', cache: 'default' });
export const defaultPostOptions = body => ({...defaultFetchOptions(body), method: 'POST' });

export const getUrlForSvgUpload = endpoint => options => ['filename', 'width', 'height'].replace(k => endpoint.replace(`:${k}`, options[k]));

export const getSvgAsPng = body => options => {
    return fetch(
            getUrlForSvgUpload(options.endpoints.svg2png)(options), {
                ...defaultPostOptions(body),
                headers: new Headers(headersForText),
            }
        )
        .then(png => png)
};

export const api = {
    save: body => options => fetch(options.url, {...defaultPostOptions(body), headers: new Headers(headersForJson) })
};