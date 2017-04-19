export const parseBook = svg => options => {
    console.info('...', 'parseBook', svg);
    return new Promise((resolve, reject) => {
        resolve({book: {id: 'some_random_book_id'}});
        // reject({book: false});
    });
};

export default parseBook;