import parser from './parser';
import s3config from '../s3.json';
import md5 from 'blueimp-md5';
AWS.config.update(s3config);

window.svgParserClient = domElement => endpoints => {
    let data = [];
    const onDrop = files => {
        const reader = new FileReader();
        files.map(file => {
            const loader = document.createElement('div');
            const info = document.createElement('div');
            const index = document.querySelectorAll('[id*="loader-"]').length;
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
                    const options = { filename: file.name, S3, hashFunction: md5, hashMethod: 'md5' };

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
                                lineEl.setAttribute('id', `${name}-${i}-${k}`);
                                lineEl.setAttribute('class', `${name} ${k}`);
                                lineEl.textContent = `${k} : ${each[k]}`;
                                tmpEl.appendChild(forEach(lineEl, i, each, tmpEl));
                            });
                            dom2link.appendChild(tmpEl);
                        });
                    };

                    const onParsed = {
                        toolkit: toolkit => {
                            console.info('####', 'toolkit', {...toolkit });
                            const tmpPreview = document.createElement('embed');
                            tmpPreview.setAttribute('src', toolkit.thumbUrl);
                            tmpPreview.style.width = '50%';
                            document.querySelector(`#${loaderId} svg`).outerHTML = tmpPreview.outerHTML;

                            const containerEl = document.createElement('div');
                            containerEl.setAttribute('class', 'mui-container-fluid');
                            const panelEl = document.createElement('div');
                            panelEl.setAttribute('class', 'mui-panel');
                            const titleEl = document.createElement('h2');
                            titleEl.textContent = `toolkit: ${toolkit.id}`;
                            panelEl.appendChild(titleEl);

                            titleForArray('colors')(panelEl);
                            Array2Dom('colors')(toolkit.colors)(panelEl)((el, i, each, tmpEl) => {
                                if (each.rgb && !tmpEl.querySelector('input')) {
                                    const tmpInput = document.createElement('input');
                                    tmpInput.setAttribute('type', 'color');
                                    tmpInput.setAttribute('disabled', 'disabled');
                                    tmpInput.value = `#${each.rgb}`;
                                    tmpEl.appendChild(tmpInput);
                                }
                                return el;
                            });

                            titleForArray('fonts')(panelEl);
                            Array2Dom('fonts')(toolkit.fonts)(panelEl)((el, i) => {
                                el.style.fontFamily = toolkit.fonts[i].fontName;
                                el.style.fontSize = '1.5em';
                                return el;
                            });

                            titleForArray('images')(panelEl);
                            Array2Dom('images')(toolkit.images)(panelEl)((el, i, each, tmpEl) => {
                                const urlSvg = el.classList.value.indexOf('urlSvg') > -1;
                                const urlThumb = el.classList.value.indexOf('urlThumb') > -1;
                                const urlScale = el.classList.value.indexOf('urlScale') > -1;
                                const urlFull = el.classList.value.indexOf('urlFull') > -1;
                                const url = urlSvg || urlThumb || urlScale || urlFull;

                                if (url) {
                                    const tmpAnchor = document.createElement('a');
                                    tmpAnchor.setAttribute('href', el.textContent.split(':').slice(1).join(':'));
                                    tmpAnchor.setAttribute('target', '_blank');
                                    tmpAnchor.innerHTML = el.outerHTML;
                                    return tmpAnchor;
                                }
                                if (each.urlSvg) {
                                    if (!tmpEl.querySelector('embed')) {
                                        const tmpPreview = document.createElement('embed');
                                        tmpPreview.setAttribute('class', 'preview');
                                        tmpPreview.setAttribute('src', each.urlSvg);
                                        tmpEl.appendChild(tmpPreview);
                                    }
                                }
                                return el;
                            });

                            containerEl.appendChild(panelEl);
                            document.querySelector(`#${infoId}`).appendChild(containerEl);
                        },
                        designs: design => {
                            console.info('<<<', 'designs', designs);
                            const containerEl = document.createElement('div');
                            containerEl.setAttribute('class', 'mui-container-fluid');
                            const panelEl = document.createElement('div');
                            panelEl.setAttribute('class', 'mui-panel');
                            const titleEl = document.createElement('h2');
                            titleEl.textContent = `designs`;
                            panelEl.appendChild(titleEl);

                            // const toHtml = parent => content => {
                            //     console.info('..........', 'content', content);
                            //     const tmpPanel = document.createElement('div');
                            //     tmpPanel.setAttribute('class', 'mui-panel');
                            //     tmpPanel.setAttribute('id', content.uuid);
                            //     const tmpTitle = document.createElement('h3');
                            //     tmpTitle.textContent = content.type;

                            //     tmpPanel.appendChild(tmpTitle);
                            //     parent.appendChild(tmpPanel);

                            //     if (content.surfaces) {
                            //         content.surfaces
                            //         .map(toHtml(document.querySelector(`[id=${content.uuid}]`)))
                            //         .(html => parent.appendChild(html));
                            //     }
                            // };

                            Object.keys(design).forEach(product => {
                                console.info('####', 'product', product);
                                const productElement = document.createElement('div');
                                productElement.setAttribute('class', 'mui-panel');
                                const productTitle = document.createElement('h3');
                                productTitle.textContent = product;

                                console.info('<<<', product, design[product].surfaces);

                                // Object.keys(design[product].surfaces).forEach(k => design[product].surfaces[k]).map(console.info);
                                for (const id in design[product].surfaces) {
                                    // console.info('.........', 'id', id, design[product].surfaces[id]);
                                    // toHtml(productElement)(design[product].surfaces[id]);
                                }

                                productElement.appendChild(productTitle);
                                panelEl.appendChild(productElement);
                            });

                            containerEl.appendChild(panelEl);
                            document.querySelector(`#${infoId}`).appendChild(containerEl);
                        },
                        errors: error => {
                            console.error(error);
                        }
                    }

                    parser(document.querySelector(`#${loaderId} svg`))(options).then(parsed => {
                        // const {book} = parsed.designs[0];
                        // const {surfaces} = book;
                        console.info('###', 'parsed', parsed);
                        // console.info('###', 'surfaces', {...surfaces.inner_01});
                        // console.info('###', 'surfaces', {...parsed.designs[0].book});
                        const filterErrors = key => key !== 'error';
                        const filterEmpty = parsed => key => Array.isArray(parsed[key]) ? !!parsed[key].length : !!Object.keys(parsed[key]).length;
                        Object.keys(parsed).filter(filterErrors).filter(filterEmpty(parsed)).map(key => {
                            console.info('...', `parsed[${key}]`, parsed[key], typeof onParsed[key]);
                            return Array.isArray(parsed[key]) ? parsed[key].map(onParsed[key]) : onParsed[key](parsed[key])
                        } );
                    });
                };
            })(file);
        });
    };
    document.addEventListener('DOMContentLoaded', () => {
        require("drag-and-drop-files")(document.querySelector(domElement), onDrop);
    });
}
