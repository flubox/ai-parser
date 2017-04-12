import test from 'ava';
import {checkMode} from '../src/check';

test('checkMode', t => {
    const A = [{ id: 'color' }, { id: 'font' }, { id: 'image' }];
    const B = [{ id: 'COLOR_BACK_01' }];
    t.is(checkMode(A), 'flu');
    t.is(checkMode(B), 'legacy');
});