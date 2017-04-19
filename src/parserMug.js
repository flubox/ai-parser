export const parseMug = svg => options => {
    console.info('...', 'parseMug', svg);
    return new Promise((resolve, reject) => {
        reject({mug: false});
    });
};

export default parseMug;