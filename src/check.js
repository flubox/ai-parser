import {getGroupsWithId} from './group';

export const checkContent = svg => {
    const toolkit = !!svg.querySelectorAll('g#toolkit').length;
    const designs = !!svg.querySelectorAll('g#designs').length;
    return {toolkit, designs};
};

export const checkIfSvg = json => json.name === 'svg';

export const checkIfHasElements = json => json.elements && json.elements.length;
