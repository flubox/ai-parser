import test from 'ava';
import {getDeclaration} from '../src/group';

test('getDeclaration', t => {
    const attrs = {
        'fill': '#FF9900',
        'font-family': 'Arial'
    }
    const element = { getAttribute: attr => attrs[attr] };
    t.is(getDeclaration(element)('fill'), attrs.fill);
    t.is(getDeclaration(element)('font-family'), attrs['font-family']);
});