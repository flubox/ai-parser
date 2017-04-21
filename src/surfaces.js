export const getProductDeclaration = json => {
    if (json.attributes && json.attributes.id && json.attributes.id.indexOf('design:') === 0) {
        return json.attributes.id.split(':')[1];
    } else if (json.elements && json.elements.length === 1) {
        return getProductDeclaration(json.elements[0]);
    }
    return undefined;
};

export const getProductGroup = json => {
    return json.elements[0].elements.find(element => element.attributes && element.attributes.id.indexOf('design') > -1);
};

export const cleanedElementId = ({attributes}) => attributes.id.split('_').filter(isNaN).slice(0, 3);
