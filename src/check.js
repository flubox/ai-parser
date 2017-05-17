import {getGroupsWithId} from './group';
import {legacyClipartDeclaration, legacyColorDeclaration} from './parser';

export const checkMode = groups => {
    const groupsWithId = getGroupsWithId(groups);
    const hasLegacyColorDeclaration = groupsWithId.some(g => legacyColorDeclaration(g.id));
    const hasLegacyClipartDeclaration = groupsWithId.some(g => legacyClipartDeclaration(g.id));
    if (hasLegacyColorDeclaration && hasLegacyColorDeclaration) {
        return 'legacy';
    }
    return 'flu';
};

export const checkContent = svg => {
    const toolkit = !!svg.querySelectorAll('g#toolkit').length;
    const designs = !!svg.querySelectorAll('g#designs').length;
    return {toolkit, designs};
};

export const checkIfSvg = json => json.name === 'svg';

export const checkIfHasElements = json => json.elements && json.elements.length;
