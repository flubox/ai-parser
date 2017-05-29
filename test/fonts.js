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
