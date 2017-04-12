import test from 'ava';
import { merge, capitalizeFirstLetter } from '../src/helper';

test('merge', t => {
    const A = { lorem: 'ipsum' };
    const B = { hello: 'world' };
    const merged = {...A, ...B };
    t.deepEqual(merge(A, B), merged);
});

test('capitalizeFirstLetter', t => {
    t.is(capitalizeFirstLetter('lorem'), 'Lorem');
});
