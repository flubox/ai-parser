import test from 'ava';
import * as colors from '../src/colors';
import md5 from 'blueimp-md5';

const getAttribute = attribute => rect.attributes[attribute]
const rect = { attributes: { fill: '#FF9900' }, getAttribute };

test('colors.getRgb', t => {
    const color = '#FF9900';
    const short = 'FF9900';
    t.is(colors.getRgb(color), short);
});

test('colors.getRectFillColor', t => {
    t.is(colors.getRectFillColor(rect), rect.attributes.fill);
});

test('colors.parseColorType', t => {
    const color = 'color:Background';
    const color2 = 'Background';
    t.is(colors.parseColorType(color), 'Background');
    t.is(colors.parseColorType(color2), 'Background');
});

test('colors.getRgbFromColorPicker', t => {
    const group = { querySelector: selector => rect };
    const group2 = { querySelector: selector => null };
    t.is(colors.getRgbFromColorPicker(group), rect.attributes.fill);
    t.is(colors.getRgbFromColorPicker(group2), '000000');
});

test('colors.getColorTypeDeclaration', t => {
    const group = { id: 'color:_background_font' };
    const group2 = { id: 'color:background' };
    t.deepEqual(colors.getColorTypeDeclaration(group), ['background', 'font']);
    t.deepEqual(colors.getColorTypeDeclaration(group2), ['background']);
});

test('colors.filterColorPrefix', t => {
    t.truthy(colors.filterColorPrefix('notcolor'));
    t.falsy(colors.filterColorPrefix('color'));
});
