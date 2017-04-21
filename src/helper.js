export const capitalizeFirstLetter = string => `${string.toUpperCase().substr(0, 1)}${string.toLowerCase().substr(1)}`;

export const nodeList2Array = nodeList => [].slice.call(nodeList);

export const merge = (a, b) => ({...a, ...b });

export const concat = (a, b) => a.concat(b);

export const reduceByConcat = list => list.reduce(concat, []);

export const reduceByMerge = list => list.reduce(merge, {});

export const getSubGroupsWithId = svg => svg.querySelectorAll('g[id]');

export const getSubGroups = svg => svg.querySelectorAll('g');

export const getRects = svg => svg.querySelectorAll('rect');

export const getTexts = svg => svg.querySelectorAll('text');