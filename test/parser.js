import test from 'ava';
import {legacyClipartDeclaration, legacyColorDeclaration} from '../src/parser';
import md5 from 'blueimp-md5';

test('legacyClipartDeclaration', t => {
    t.truthy(legacyClipartDeclaration('CLIPART_08'));
    t.falsy(legacyClipartDeclaration('image'));
});

test('legacyColorDeclaration', t => {
    t.truthy(legacyColorDeclaration('COLOR_FONT_01'));
    t.falsy(legacyColorDeclaration('color'));
});
