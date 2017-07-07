
export const generateFontsAsSvg = ({fonts}) => {
    const xOffset = 16;
    const yOffset = 32;
    return [
        '\t<g id="fonts">',
            fonts.map((font, i) => {
                return `\t\t<text font-size="24" font-family="${font.fontName}, ${font.name}">
                    <tspan x="${xOffset}" y="${i * yOffset}">
                        ${font.displayName}
                    </tspan>
                </text>`;
            }).join('\n'),
        '\t</g>'
    ].join('\n');
};

export const generateColorsAsSvg = ({colors, fonts}) => {
    const xOffset = 16;
    const yOffset = (fonts.length * 32) + 32;
    const width = 32;
    const height = 32;
    const margin = 4;
    return [
        '\t<g id="colors">',
        colors.map(({rgb, colorType, defaultColor}, i) => {
            return `\t\t<rect id="${defaultColor ? 'default_' : ''}${colorType}" x="${(i * (width + margin)) + xOffset}px" y="${yOffset}px" width="${width}px" height="${height}px" fill="#${rgb}"></rect>`;
        }).join('\n'),
        '\t</g>'
    ].join('\n');
};

export const generateImagesAsSvg = ({images}) => {
    return [
        '\t<g id="images">',
            images.map(image => {
                return '\tlorem'
            }),
        '\t</g>'
    ].join('\n');
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
    const svgContent = [
        `<title>${toolkit.id}</title>`,
        `<g id="${toolkitSvgId}">`,
        generateFontsAsSvg({fonts}),
        generateColorsAsSvg({colors, fonts}),
        `</g>`
    ].join('\n');
    svg.innerHTML = svgContent;
    return svg;

    // let title = document.createElement('title');
    // title.textContent = toolkit.id;

    // let colors = document.createElement('colors');
    // font.setAttribute('id', 'colors');

    // let images = document.createElement('images');
    // font.setAttribute('id', 'images');

    // let fonts = document.createElement('fonts');
    // font.setAttribute('id', 'fonts');

    // toolkit.colors.forEach((color, i) => {
    //     const tmpColor = document.createElement('rect');
    //     const id = `${color.defaultColor ? 'default ' : ''}${color.}`;
    //     tmpColor.setAttribute('id', [id, color.colorType].join(' '));
    //     tmpColor.setAttribute('x', `${i * 32}px`);
    //     tmpColor.setAttribute('y', '64px');
    //     tmpColor.setAttribute('width', '64px');
    //     tmpColor.setAttribute('width', '64px');
    //     tmpColor.setAttribute('height', '64px');
    //     tmpColor.setAttribute('fill', `#${color.rgb}`);
    //     title.appendChild(tmpColor);
    // });

    // toolkit.fonts.forEach(font => {
    //     const tmpFont = document.createElement('text');
    //     tmpFont.setAttribute('font-size', 24);
    //     tmpFont.setAttribute('font-family', `${font.fontFamily}, ${font.fontName}`);
    //     fonts.appendChild(tmpFont);
    // });

    // // toolkit.images.forEach(images => {
    // //     const tmpImage = document.createElement('text');
    // // });
};

export default generateToolkitAsSvg;