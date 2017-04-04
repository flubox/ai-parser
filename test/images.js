import test from 'ava';
import * as images from '../src/images';
const filename = 'lorem.ipsum.svg';

test('images.getImageType', t => {
    t.is(images.getImageType({ id: 'images:cover' }), 'Cover');
    t.is(images.getImageType({ id: 'images:clipart' }), 'Clipart');
});

test('images.svgAsString', t => {
    t.is(images.svgAsString({ outerHTML: 'lorem' }), 'lorem');
});

test('images.getS3Filepath', t => {
    t.is(images.getS3Filepath(filename)({ id: 'lol' }), `${filename}/lol_.svg`);
});