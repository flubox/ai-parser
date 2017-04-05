export const Bucket = 'design-service';

export const ACL = 'public-read';

export const mkUrl = filename => `import/${filename}`;

export const getLocation = data => data.Location;

export const getUploadOptions = f => Body => ({ Key: mkUrl(f), Body, Bucket, ACL });

export const getSvgUploadOptions = f => Body => ({...getUploadOptions(f)(Body), ContentType: 'image/svg+xml' });
