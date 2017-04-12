export const capitalizeFirstLetter = string => `${string.toUpperCase().substr(0, 1)}${string.toLowerCase().substr(1)}`;

export const nodeList2Array = nodeList => [].slice.call(nodeList);

export const merge = (a, b) => ({...a, ...b });