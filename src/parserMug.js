export const parseMug = svg => options => {
    console.info('...', 'parseMug', svg);
    return new Promise((resolve, reject) => {
        resolve({id: 'some_random_mug_id'});
        // reject({mug: false});
    });
};

export default parseMug;