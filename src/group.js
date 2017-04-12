export const filterGroupById = token => g => typeof g.id !== 'undefined' && g.id.indexOf(token) === 0;

export const getDeclaration = element => attribute => element.getAttribute(attribute);

export const getGroupsWithId = groups => groups.filter(g => g.id);