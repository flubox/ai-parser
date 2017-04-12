import test from 'ava';
import {getDeclaration, filterGroupById, getGroupsWithId} from '../src/group';

test('getDeclaration', t => {
    const attrs = {
        'fill': '#FF9900',
        'font-family': 'Arial'
    }
    const element = { getAttribute: attr => attrs[attr] };
    t.is(getDeclaration(element)('fill'), attrs.fill);
    t.is(getDeclaration(element)('font-family'), attrs['font-family']);
});

test('filterGroupById', t => {
    const A = {};
    const B = { id: 'lorem' };
    const C = { id: 'ipsum' };
    t.falsy(filterGroupById('hello')(A));
    t.truthy(filterGroupById('lorem')(B));
    t.false(filterGroupById('lorem')(C));
});

test('getGroupsWithId', t => {
    const groups = [
        { id: 'lorem' },
        { notId: 'ipsum' },
        { id: 'dolor' }
    ];
    const result = getGroupsWithId(groups);
    t.deepEqual(result, [
        { id: 'lorem' },
        { id: 'dolor' }
    ]);
    t.is(result.length, 2);
});