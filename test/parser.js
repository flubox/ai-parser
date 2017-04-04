import test from 'ava';
import * as parser from '../src/parser';
import md5 from 'blueimp-md5';

test('parser.merge', t => {
    const A = { lorem: 'ipsum' };
    const B = { hello: 'world' };
    const merged = {...A, ...B };
    t.deepEqual(parser.merge(A, B), merged);
});

test('parser.filterGroupById', t => {
    const A = {};
    const B = { id: 'lorem' };
    const C = { id: 'ipsum' };
    t.falsy(parser.filterGroupById('hello')(A));
    t.truthy(parser.filterGroupById('lorem')(B));
    t.false(parser.filterGroupById('lorem')(C));
});

test('parser.getDeclaration', t => {
    const attrs = {
        'fill': '#FF9900',
        'font-family': 'Arial'
    }
    const element = { getAttribute: attr => attrs[attr] };
    t.is(parser.getDeclaration(element)('fill'), attrs.fill);
    t.is(parser.getDeclaration(element)('font-family'), attrs['font-family']);
});

test('parser.capitalizeFirstLetter', t => {
    t.is(parser.capitalizeFirstLetter('lorem'), 'Lorem');
});

// test('parser.legacyColorDeclaration', t => {
//     t.truthy(parser.legacyClipartDeclaration('COLOR_BACK_01'));
//     t.falsy(parser.legacyClipartDeclaration('color'));
// });

test('parser.legacyColorDeclaration', t => {
    t.truthy(parser.legacyClipartDeclaration('CLIPART_08'));
    t.falsy(parser.legacyClipartDeclaration('image'));
});

test('parser.getGroupWithId', t => {
    const groups = [
        { id: 'lorem' },
        { notId: 'ipsum' },
        { id: 'dolor' }
    ];
    const result = parser.getGroupsWithId(groups);
    t.deepEqual(result, [
        { id: 'lorem' },
        { id: 'dolor' }
    ]);
    t.is(result.length, 2);
});

test('parser.checkMode', t => {
    const A = [{ id: 'color' }, { id: 'font' }, { id: 'image' }];
    const B = [{ id: 'COLOR_BACK_01' }];
    t.is(parser.checkMode(A), 'flu');
    t.is(parser.checkMode(B), 'legacy');
});