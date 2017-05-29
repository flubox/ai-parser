export const getSub = ({tag, json}) => {
    if (hasSub({tag, json})) {
        const {elements} = json;
        if (typeof elements === 'undefined') {
            return [];
        }
        return tag ? elements.filter(filterTag(tag)) : elements;
    }
    return [];
};

export const hasSub = ({tag, json}) => {
    if (typeof json === 'undefined') {
        return false;
    }

    const noTag = typeof tag === 'undefined';
    const noElements = typeof json.elements === 'undefined';

    if (noTag) {
        if (noElements) {
            return false;
        } else {
            return true;
        }
    } else {
        if (noElements) {
            return false;
        } else {
            return json.elements.length > 0;
        }
    }
};