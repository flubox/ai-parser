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