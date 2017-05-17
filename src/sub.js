import {unDef} from './helper';

export const getSub = ({tag, json}) => {
    if (hasSub({tag, json})) {
        const {elements} = json;
        if (unDef(elements)) {
            return [];
        }
        return tag ? getTag(elements) : elements;
    }
    return [];
};

export const getTag = elements => elements.filter(filterTag());

export const hasSub = ({tag, json}) => {
    if (unDef(json)) {
        return false;
    }

    if (unDef(tag)) {
        if (unDef(json.elements)) {
            return false;
        } else {
            return true;
        }
    } else {
        if (unDef(json.elements)) {
            return false;
        } else {
            return json.elements.length > 0;
        }
    }
};