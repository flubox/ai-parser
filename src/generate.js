
export const generateFontsAsSvg = ({fonts}) => {
    const xOffset = 16;
    const yOffset = 24;
    const tmpG = document.createElementNS("http://www.w3.org/2000/svg", 'g');
    tmpG.setAttribute('id', 'fonts');

    fonts.forEach((font, i) => {
        let tmp = document.createElementNS("http://www.w3.org/2000/svg", 'tspan');
        tmp.innerHTML = font.displayName;
        const tmp2 = document.createElementNS("http://www.w3.org/2000/svg", 'text');
        tmp2.setAttribute('font-size', 16);
        tmp2.setAttribute('font-family', `${font.displayName}, ${font.name}`)
        tmp2.setAttribute('transform', `translate(${xOffset} ${i * yOffset})`);
        tmp2.appendChild(tmp);
        tmpG.appendChild(tmp2);
    });
    return tmpG;
};

export const generateColorsAsSvg = ({colors, fonts}) => {
    const xOffset = 16;
    const yOffset = (fonts.length * 16) + 32;
    const width = 32;
    const height = 32;
    const margin = 4;
    let x = -1;
    let y = 0;
    const tmpG = document.createElementNS("http://www.w3.org/2000/svg", 'g');
    tmpG.setAttribute('id', 'colors');

    colors.forEach(({rgb, colorType, defaultColor}) => {
        if (x !== 0 && x % 3 === 0) {
            x = 0;
            y++;
        } else {
            x++;
        }
        const tmpRect = document.createElementNS("http://www.w3.org/2000/svg", 'rect');
        tmpRect.setAttribute('id', `${defaultColor ? 'default_' : ''}${colorType.replace(/\s/g, '_')}`);
        tmpRect.setAttribute('x', `${(x * (width + margin)) + xOffset}px`);
        tmpRect.setAttribute('y', `${yOffset + (y * (height + margin))}px`);
        tmpRect.setAttribute('width', `${width}px`);
        tmpRect.setAttribute('height', `${height}px`);
        tmpRect.setAttribute('fill', `#${rgb}`);
        tmpG.appendChild(tmpRect);
    });
    return tmpG;
};

export const generateImagesAsSvg = ({images, colors}) => {
    const tmpG = document.createElementNS("http://www.w3.org/2000/svg", 'g');
    tmpG.setAttribute('id', 'images');
    return new Promise(resolve => {
        const xOffset = 16;
        const yOffset = (colors.length * 32) + 32;
        const width = 32;
        const height = 32;
        const margin = 4;
        let x = -1;
        let y = 0;
        images = images.sort();
        const inc = () => {
            if (x !== 0 && x % 3 === 0) {
                x = 0;
                y++;
            } else {
                x++;
            }
        };

        Promise.all(
            images.map(image => {
                return new Promise(resolve2 => {
                    if (image.imageType === 'Clipart') {
                        fetch(image.urlFull).then(response => {
                            response.text().then(data => {
                                const extract = data.substr(data.indexOf('><')).replace('</svg>', '')

                                var tagString = extract;
                                var range = document.createRange();
                                // make the parent of the first div in the document becomes the context node
                                range.selectNode(document.getElementsByTagName("g").item(0));
                                var documentFragment = range.createContextualFragment(tagString);

                                documentFragment.id = `${image.id}:${image.imageType.toLowerCase()}`;
                                // documentFragment.setAttribute('id', `${image.id}:${image.imageType.toLowerCase()}`);
                                // tmp.setAttribute('transform', `translate(${(x * (width + margin)) + xOffset} ${yOffset + (y * (height + margin))}) scale(0.1 0.1)`);
                                // tmp.setAttribute('width', `${width}px`);
                                // tmp.setAttribute('height', `${height}px`);
                                resolve2(documentFragment);
                                inc();
                            });
                        });
                    } else {
                        const tmpImg = new Image();
                        tmpImg.crossOrigin = "anonymous";
                        tmpImg.onload = () => {
                            const tmpCanvas = document.createElement('canvas');
                            tmpCanvas.width = tmpImg.width;
                            tmpCanvas.height = tmpImg.height;
                            const ctx = tmpCanvas.getContext('2d');
                            ctx.drawImage(tmpImg, 0, 0);
                            const tmp = document.createElementNS("http://www.w3.org/2000/svg", 'img');
                            tmp.setAttribute('id', `${image.id}:${image.imageType.toLowerCase()}`);
                            // tmp.setAttribute('transform', `translate(${(x * (tmpImg.width + margin)) + xOffset} ${yOffset + (y * (tmpImg.height + margin))}) scale(0.1 0.1)`);
                            tmp.setAttribute('transform', `scale(0.1 0.1)`);
                            tmp.setAttribute('width', `${tmpImg.width}`);
                            tmp.setAttribute('height', `${tmpImg.height}`);
                            tmp.setAttribute('xlink:href', `${tmpCanvas.toDataURL()}`);
                            resolve2(tmp);
                            inc();
                        };
                        tmpImg.src = image.urlFull;
                    }
                });
            })
        )
        .then(tmps => {
            tmps.forEach(tmpG.appendChild.bind(tmpG));
            resolve(tmpG);
        });
    });
};

export const generateToolkitAsSvg = toolkit => {
    let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('id', 'toolkits');
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
    svg.setAttribute('width', '2100mm');
    svg.setAttribute('height', '2970mm');
    svg.setAttribute('viewBox', '0 -105 210 297');
    const toolkitSvgId = `toolkit_${toolkit.useDefaultToolkit ? 'default_' : ''}${toolkit.id}`;
    const {fonts, images} = toolkit;
    let colors = toolkit.colors.sort((a, b) => a.rgb < b.rgb ? -1 : a.rgb > b.rgb ? 1 : 0)
    .reduce((all, a, i, arr) => {
        if (arr[i - 1] && arr[i - 1].rgb === a.rgb) {
            return all;
        }
        return arr[i + 1] && arr[i + 1].rgb === a.rgb ? all.concat([{...a, colorType: [a.colorType, arr[i + 1].colorType]}]) : all.concat([a]);
    }, [])
    .map(c => ({...c, colorType: Array.isArray(c.colorType) ? c.colorType.join(' ') : c.colorType}));
    console.warn('colors', colors);
    
    const elTitle = document.createElementNS("http://www.w3.org/2000/svg", 'title');
    elTitle.innerHTML = toolkit.id;
    svg.appendChild(elTitle);

    const elG = document.createElementNS("http://www.w3.org/2000/svg", 'g');
    elG.setAttribute('id', toolkitSvgId);

    elG.appendChild(generateFontsAsSvg({fonts}));
    elG.appendChild(generateColorsAsSvg({colors, fonts}));
    generateImagesAsSvg({images, colors}).then(elG.appendChild.bind(elG));

    svg.appendChild(elG);
    return svg;
};

export default generateToolkitAsSvg;