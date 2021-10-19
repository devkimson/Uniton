'use strict';
/**
 * @version 0.1.5
 */
const Uniton = (function () {
    function Controller() {
        let moduleTemplator = null;
        let moduleComponent = null;
        let moduleOptions = null;
        let uiElem = null;

        this.init = function ({
            component,
            templator,
            ui,
            options
        }) {
            moduleTemplator = templator;
            moduleComponent = component;
            moduleOptions = options;
            uiElem = ui;
            window.addEventListener('load', (ev) => {
                options.unitonComponent ? this.requireComponent(ev) : null;
                this.requestTemplates(ev);
                if(moduleOptions.unitonAnchor){
                    moduleTemplator.requestPageHandler();
                }
            });
            if(moduleOptions.unitonAnchor){
                uiElem.body.addEventListener('click', this.requestPageHandler);
            }
        }

        this.requireComponent = function (ev) {
            moduleComponent.requireComponent(ev);
        }

        this.requestTemplates = function (ev) {
            moduleTemplator.requestTemplates(ev);
        }

        this.requestPageHandler = function (ev) {
            moduleTemplator.requestPageHandler(ev);
        }
    }

    function Templator() {
        let moduleOptions = null;
        let moduleException = null;

        this.init = function (exception, options) {
            moduleException = exception;
            moduleOptions = options;
            window.PostList = [];
            this.scanLocalFolderPost();
            this.requestApiContext(moduleOptions.apiDataPath, true);
        }

        this.scanLocalFolderPost = function () {
            const localFile = this.requestLocalFile(moduleOptions.postpath).body.querySelector('#files').children;
            let [remove, ...postBundle] = [...localFile];
            const postMapping = post => {
                return {
                    title: post.title,
                    href: post.href,
                    name: post.name,
                    size: post.size,
                    date: post.date,
                }
            }
            postBundle.forEach(post => {
                let {
                    title,
                    href
                } = post.children[0];
                let [name, size, date] = [...post.children[0].children]
                name = name.textContent;
                size = size.textContent;
                date = date.textContent;
                PostList.push(postMapping({
                    title,
                    href,
                    name,
                    size,
                    date
                }));
            });
        }

        this.requestPageHandler = function (ev) {
            if (!ev) {
                window.history.pushState({
                    data: 1
                }, '', location.pathname);
                this.changeViewPage(location.pathname);
            } else {
                let target = ev.target;
                let link = target.getAttribute("href");
                ev.preventDefault();
                if (target.tagName !== 'A' || !target.getAttribute("href")) return;
                if(link.match(/http|https/gm)){
                    open(link, '_blank');
                } else {
                    window.history.pushState({
                        data: 1
                    }, '', link);
                    this.changeViewPage(link);
                }
            }
        }

        this.changeViewPage = function (url) {
            url = url.replace(/\#/gm, '');
            try{
                if(API.baseurl==undefined){
                    throw new Error('[ApiDataException] Please check if there is baseurl property of apiData.json.');
                }
            } catch(e){
                console.error(e.message);
            } finally{
                API.baseurl = '';
            }
            const home = `${API.baseurl}/home`;
            if (url == '/index') url = home;
            if (url == '/home') url = home;
            if (url == '/') url = home;
            if (url == '') url = home;
            const rootpath = `${location.protocol}//${location.host}${API.baseurl}`;
            let requestBody = this.requestLocalFile(`${rootpath}/_pages${url}.html`).body.innerHTML;
            let parsedElement = this.unitonParser(requestBody);
            let elements = this.convertHtmlStringToElements(parsedElement);
            moduleException.drawUnitonBody(elements);
        }

        this.requestLocalFile = function (url, async = false) {
            let xhr = new XMLHttpRequest();
            let documents;
            xhr.addEventListener('readystatechange', (ev) => {
                if (xhr.status == 200 || xhr.status == 201) {
                    if (xhr.readyState == 4) {
                        if (async)
                            window.API = JSON.parse(xhr.responseText);
                        else {
                            let dom = new DOMParser();
                            documents = dom.parseFromString(xhr.responseText, "text/html");
                        }
                    }
                }
            });
            xhr.open('get', url, async);
            xhr.send();
            return documents;
        }

        this.requestApiContext = function (url, async) {
            this.requestLocalFile(url, async);
        }

        this.requestTemplates = function (ev) {
            let dom, documents;
            let xhr = new XMLHttpRequest();
            xhr.addEventListener('readystatechange', () => {
                if (xhr.status == 200 || xhr.status == 201) {
                    if (xhr.readyState == 4) {
                        dom = new DOMParser();
                        documents = dom.parseFromString(xhr.responseText, "text/html");
                        this.drawHandler(documents);
                    }
                }
            });
            let target = "_templates/layout.html";
            if(!moduleOptions.unitonTemplate){
                target = location.pathname;
            }
            xhr.open("get", target, false);
            xhr.send();
        }

        this.drawHandler = function (documents) {
            this.drawHeadWithValidate(documents.head);
            this.drawBodyWithValidate(documents.body);
        }

        this.drawHeadWithValidate = function (head) {
            let parsingHtmlHead = this.parseElementsToString(head.innerHTML);
            let parsingElement = this.convertHtmlStringToElements(parsingHtmlHead);
            moduleException.drawHeadWithValidate([...parsingElement], moduleOptions.unitonTemplate);
        }

        this.drawBodyWithValidate = function (body) {
            let parsingHtmlBody = this.parseElementsToString(body.innerHTML);
            let parsingElement = this.convertHtmlStringToElements(parsingHtmlBody);
            moduleException.drawBodyWithValidate([...parsingElement], moduleOptions.unitonTemplate);
        }

        this.parseElementsToString = function (element) {
            return this.unitonParser(element);
        }

        this.convertHtmlStringToElements = function (htmlString) {
            let dom = new DOMParser();
            let documents = dom.parseFromString(htmlString, "text/html");
            if (documents.head.childNodes.length == 0) {
                return documents.body.childNodes;
            } else {
                return documents.head.childNodes;
            }
        }

        this.unitonParser = function (responseText) {
            let tmp = '';
            tmp = responseText.replace(/\{\#\s*[\s\S]+?\n*\s*\#\}/gim, e => {
                let command = e.replace(/\{\#|\#\}/gm, '').trim();
                if(command.match(/\s*\!\s*/gm)){
                    return '';
                }
                if (command.includes('insert')) {
                    let documents = this.requestLocalFile(command.split('insert ')[1]);
                    let htmlString = this.unitonParser(documents.body.innerHTML);
                    return htmlString;
                } else if (command.trim() == 'API.url') {
                    if (API.url == "") return location.protocol + '//' + location.host + (API.baseurl != '' ? API.baseurl : '/');
                    else return this.evl(`${command}`);
                } else if (command.trim() == 'set body') {
                    return `uniton-body`;
                } else {
                    return this.evl(`${command}`);
                }
            }) + '\n';
            return tmp;
        }

        this.evl = function (str) {
            let result = new Function('"use strict"; return ' + str + ';')();
            return result;
        }

    }

    function Component() {
        const tagNames = ["u-if", "u-for", "u-else", "u-elif"];

        this.init = function (view) {

        }

        this.requireComponent = function (ev) {
            this.replaceUnitonComponents(ev);
        }

        this.unitonIf = function (root) {
            let [test, content] = [root.getAttribute("test"), root.innerHTML];
            if (eval(test)) root.insertAdjacentHTML('beforebegin', content);
            root.remove();
        }

        this.unitonFor = function (root) {
            let [tmp, v, target, content] = ['', root.getAttribute("var"), root.getAttribute("target"), root.innerHTML];

            if (eval(`typeof ${target}`) == 'number') eval(`for(let ${v}=0; ${v}<${target}; ${v}++){tmp += \`${content}\`}`);

            else eval(`${target}.forEach(${v}=>{tmp += \`${content}\`})`);

            root.insertAdjacentHTML('beforebegin', tmp);
            root.remove();
        }

        this.replaceUnitonComponents = function () {
            tagNames.forEach(name => {
                let root = this;
                class baseUnitonElements extends HTMLElement {
                    connectedCallback() {
                        if (this.isConnected) {
                            if (this.tagName == "U-IF") {
                                if (this.getAttribute("test").length == 0) {
                                    console.error('[NoTestDataException] Please enter a value for the "test" attribute.')
                                } else {
                                    root.unitonIf(this);
                                }
                            } else if (this.tagName == "U-FOR") {
                                if (this.getAttribute("var") && this.getAttribute("target")) {
                                    root.unitonFor(this);
                                } else if (!this.getAttribute("var") && !this.getAttribute("target")) {
                                    console.error('[NoDataException] Set the variable and target.')
                                } else if (!this.getAttribute("var")) {
                                    console.error('[NoVarDataException] Set the variable.')
                                } else if (!this.getAttribute("target")) {
                                    console.error('[NoTargetDataException] Set the target.')
                                }
                            }
                        }
                    }
                }
                customElements.define(name, baseUnitonElements);
            });
        }
    }

    function Exception() {
        let moduleView = null;
        let Exceptions = null;

        this.init = function (view) {
            moduleView = view;
            this.exceptionGenerator();
        }

        this.exceptionGenerator = function () {
            const exceptionType = {
                Numeric: {
                    name: "NumericException",
                    message: "Wrong number input or out of range!",
                },
                LocalFile: {
                    name: "LocalFileNotFoudException",
                    message: "File not found. check the route.",
                },
                Command: {
                    name: "CommandNotFoudException",
                    message: "This is an unknown command.",
                },
            }

            function Exception(type, info) {
                this.type = exceptionType[type];
                this.name = this.type.name;
                this.message = this.type.message;
                this.alertException = function () {
                    console.error(`[${this.name}] ${this.message} at ${info}`);
                };
            }
            Exceptions = Exception;
        }

        this.drawUnitonBody = function (elements) {
            moduleView.drawUnitonBody(elements);
        }

        this.drawHeadWithValidate = function (heads, useTemplate) {
            moduleView.drawFilteredElementsToHead(heads, useTemplate);
        }

        this.drawBodyWithValidate = function (elements, useTemplate) {
            // elements.filter(x=>{
            //     if(!(x instanceof Text)){
            //         return x;
            //     }
            // });
            let filteredElements = elements.filter(elem => elem.nodeValue || elem.innerHTML.indexOf('CDATA') == -1).map(elem => {
                if (elem.tagName == 'SCRIPT') {
                    let s = document.createElement('script');
                    if (elem.innerHTML.trim() == '') {
                        elem.src ? s.src = elem.src : null;
                        elem.integrity ? s.integrity = elem.integrity : null;
                        elem.crossOrigin ? s.crossOrigin = elem.crossOrigin : null;
                    } else {
                        elem.innerHTML ? s.innerHTML = elem.innerHTML : null;
                    }
                    return s;
                } else {
                    return elem;
                }
            });
            filteredElements = filteredElements.filter(elem => {
                if (elem.nodeValue) {
                    if (elem instanceof Comment) {
                        if (elem.nodeValue.indexOf('live-server') == -1) {
                            return elem;
                        }
                    } else {
                        return elem;
                    }
                } else {
                    return elem;
                }
            });
            moduleView.drawFilteredElementsToBody(filteredElements, useTemplate);
        }
    }

    function View() {
        let uiElem = null;

        this.init = function (ui) {
            uiElem = ui;
        }

        this.drawUnitonBody = function (elements) {
            if (uiElem.ubody) {
                uiElem.ubody.innerHTML = '';
                uiElem.ubody.append(...elements);
            }
        }

        this.drawFilteredElementsToHead = function (elements) {
            uiElem.head.prepend(...elements);
        }

        this.drawFilteredElementsToBody = function (elements, useTemplate) {
            uiElem.body.innerHTML = '';
            let toText = '';
            elements = elements.filter(elem=> {
                if(elem.tagName=='SCRIPT'){
                    if(!elem.src.match(/index.js|uniton.js/gm)){
                        return elem;
                    } else {
                        toText += elem.outerHTML;
                    }
                } else {
                    return elem;
                }
            });
            uiElem.body.prepend(...elements);
            if(!useTemplate){
                uiElem.body.innerHTML += '';
            }
            uiElem.body.innerHTML += toText;
            uiElem.ubody = document.querySelector('[data-uniton-type="body"]');
            uiElem.html.removeAttribute("style");
        }
    }

    return {
        init: function (options) {
            !options.hasOwnProperty('unitonTemplate')?options.unitonTemplate = false:null;
            !options.hasOwnProperty('unitonComponent')?options.unitonComponent = true:null;
            !options.hasOwnProperty('unitonAnchor')?options.unitonAnchor = false:null;
            
            const html = document.querySelector('html');
            html.style.display = 'none';
            const head = document.head;
            const body = document.body;
            const ubody = document.querySelector('[data-uniton-type="body"]');
            
            const ui = {
                html,
                head,
                body,
                ubody,
            };

            const view = new View();
            const exception = new Exception();
            const component = new Component();
            const templator = new Templator();
            const controller = new Controller();

            const packages = {
                component,
                templator,
                ui,
                options,
            }

            view.init(ui);
            component.init();
            exception.init(view);
            templator.init(exception, options);
            controller.init(packages);
        }
    }
})();