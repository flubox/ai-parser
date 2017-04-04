export const Bucket = 'design-service';
export const ACL = 'public-read';

export const mkUrl = filename => `import/${filename}`;

export const getLocation = data => data.Location;

export const getUploadOptions = f => Body => ({ Key: mkUrl(f), Body, Bucket, ACL });

export const getSvgUploadOptions = f => Body => ({...getUploadOptions(f)(Body), ContentType: 'image/svg+xml' });

// const defaultHeaders = {
//     'Access-Control-Allow-Origin': '*'
// };

// const headersForText = {...defaultHeaders, 'Content-Type': 'text/plain' };
// const headersForJson = {...defaultHeaders, 'Content-Type': 'application/json' };
// export const defaultFetchOptions = body => ({ body, mode: 'cors', cache: 'default' });
// export const defaultPostOptions = body => ({...defaultFetchOptions(body), method: 'POST' });

// export const api = {
//     save: body => options => fetch(options.url, {...defaultPostOptions(body), headers: new Headers(headersForJson) })
// };