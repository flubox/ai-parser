import parser from './parser';
import s3config from '../s3.json';
AWS.config.update(s3config);

window.svgParserClient = domElement => endpoints => {
    let data = [];
    const onDrop = files => {
        console.log("Got some files:", files)
        const reader = new FileReader();
        files.map((file, index) => {
            const loader = document.createElement('div');
            const info = document.createElement('div');
            const loaderId = `loader-${index}`;
            const infoId = `info-${index}`;
            loader.setAttribute('id', loaderId);
            loader.setAttribute('class', 'loader');
            info.setAttribute('id', infoId);
            info.setAttribute('class', 'info');
            const content = reader.readAsText(file);

            reader.onload = (theFile => {
                return ({ target }) => {
                    let png;
                    const svg = target.result;
                    loader.innerHTML = svg;
                    document.querySelector(domElement).appendChild(loader);
                    document.querySelector(`#${loaderId}`).appendChild(info);
                    const S3 = new AWS.S3();
                    const options = { filename: file.name, endpoints, S3 };
                    const parsed = parser(document.querySelector(`#${loaderId} svg`))(options);

                    const containerEl = document.createElement('div');
                    containerEl.setAttribute('class', 'mui-container-fluid');
                    const panelEl = document.createElement('div');
                    panelEl.setAttribute('class', 'mui-panel');
                    const titleEl = document.createElement('h2');
                    titleEl.textContent = parsed.title;
                    panelEl.appendChild(titleEl);

                    const titleForArray = text => dom2link => {
                        const tmpEl = document.createElement('h3');
                        tmpEl.textContent = text;
                        dom2link.appendChild(tmpEl);
                    }

                    const Array2Dom = name => arr => dom2link => (forEach = each => each) => {
                        arr.forEach((each, i) => {
                            const tmpEl = document.createElement('div');
                            tmpEl.setAttribute('class', 'mui-panel');

                            Object.keys(each).forEach(k => {
                                const lineEl = document.createElement('div');
                                lineEl.textContent = `${k} : ${each[k]}`;
                                tmpEl.appendChild(forEach(lineEl, i));
                            });

                            dom2link.appendChild(tmpEl);
                        });
                    };

                    titleForArray('colors')(panelEl);
                    Array2Dom('colors')(parsed.colors)(panelEl)();

                    titleForArray('fonts')(panelEl);
                    Array2Dom('fonts')(parsed.fonts)(panelEl)((el, i) => {
                        el.style.fontFamily = parsed.fonts[i].fontName;
                        return el;
                    });


                    titleForArray('images')(panelEl);
                    // Array2Dom(parsed.images)(panelEl);

                    // panelEl.innerHTML = JSON.stringify(parsed);

                    containerEl.appendChild(panelEl);
                    document.querySelector(`#${infoId}`).appendChild(containerEl);

                    console.info('...', 'parsed', parsed);
                    // sendSvgToPng(file.name)(svg)(response => {
                    //     png = response;
                    //     // console.info('########', response);
                    // });
                };
            })(file);
        });
    };
    document.addEventListener('DOMContentLoaded', () => {
        require("drag-and-drop-files")(document.querySelector(domElement), onDrop);
    });
}