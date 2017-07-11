export const Bucket = 'design-service';

export const ACL = 'public-read';

export const mkUrl = toolkitId => `import/${toolkitId}`;

export const getLocation = data => data.Location;

export const getUploadOptions = toolkitId => Body => ({ Key: mkUrl(toolkitId), Body, Bucket, ACL });

export const getSvgUploadOptions = toolkitId => Body => ({...getUploadOptions(toolkitId)(Body), ContentType: 'image/svg+xml' });

export const getBase64UploadOptions = toolkitId => Body => ({...getUploadOptions(toolkitId)(Body), ContentEncoding: 'base64', ContentType: 'image/png'});
