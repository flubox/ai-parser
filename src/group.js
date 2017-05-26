import {unDef} from './helper';

export const getDeclaration = element => attribute => element.getAttribute(attribute);

export const getGroupsWithId = groups => groups.filter(g => g.id);