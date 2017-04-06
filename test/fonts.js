import test from 'ava';
import * as fonts from '../src/fonts';
import md5 from 'blueimp-md5';

test('fonts.filterFontsById', t => {
    t.truthy(fonts.filterFontsById({ id: 'fonts' }));
    t.falsy(fonts.filterFontsById({}));
    t.falsy(fonts.filterFontsById({ id: 'lorem' }));
});

test('fonts.getFontTypeDeclaration', t => {
    const text = { getAttribute: a => a === 'font-family' ? 'Futura,Futura-medium' : '' };
    t.deepEqual(fonts.getFontTypeDeclaration(text), ['Futura', 'Futura-medium']);
});

test('fonts.getFontName', t => {
    const rawFontData = "Futura-medium,Futura";
    t.is(fonts.getFontName(rawFontData), "Futura-medium");
});

test('fonts.getName', t => {
    const rawFontData = "Futura-medium,Futura";
    t.is(fonts.getName(rawFontData), "Futura");
});

test('fonts.getDisplayName', t => {
    const rawFontData = "Futura-medium,Futura";
    t.is(fonts.getDisplayName(rawFontData), "Futura");
});

test('fonts.getFontsFromGroups', t => {
    t.deepEqual(fonts.getFontsFromGroups([
        { id: 'font', getAttribute: () => 'futura-medium,futura' },
        { id: 'font', getAttribute: () => 'Arial,Arial' }
    ])({hashMethod: 'md5', hashFunction: md5}), [
        { name: 'Futura', displayName: 'Futura', fontName: 'Futura-medium' },
        { name: 'Arial', displayName: 'Arial', fontName: 'Arial' }
    ].map(each => ({...each, hash: 'md5', md5: md5(JSON.stringify(each)) })));
});