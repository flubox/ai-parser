import test from 'ava';
import * as fonts from '../src/fonts';
import md5 from 'blueimp-md5';

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
        { displayName: 'Futura', fontName: 'Futura-medium' , id: 'Futura-medium', name: 'Futura'},
        { displayName: 'Arial', fontName: 'Arial', id: 'Arial', name: 'Arial' }
    ].map(each => ({...each, hash: 'md5', md5: md5(JSON.stringify(each)) })));
});