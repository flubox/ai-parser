import test from 'ava';
import * as upload from '../src/upload';

const filename = 'lorem.ipsum.svg';
const { ACL, Bucket } = upload;
const Body = { lorem: 'ipsum' };
const uploadOptions = {
    Key: `import/${filename}`,
    Bucket,
    Body,
    ACL
};
const ContentType = 'image/svg+xml';

test('upload.mkUrl', t => {
    t.is(upload.mkUrl(filename), `import/${filename}`);
});

test('upload.getLocation', t => {
    t.is(upload.getLocation({ Location: 'lorem' }), 'lorem');
});

test('upload.getUploadOptions', t => {
    t.deepEqual(upload.getUploadOptions(filename)(Body), uploadOptions);
});

test('upload.getSvgUploadOptions', t => {
    t.deepEqual(upload.getSvgUploadOptions(filename)(Body), {...uploadOptions, ContentType });
});