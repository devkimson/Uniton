'use strict';
/**
 * @version 0.1.0-alpha
 */
const Uniton = (function () {
    function Controller() {
        let moduleTemplator = null;
        let moduleComponent = null;
        let moduleOptions = null;
        let uiElem = null;
        
        this.init = function ({component, templator, ui, options}) {
            moduleTemplator = templator;
            moduleComponent = component;
            moduleOptions = options;
            uiElem = ui;
            window.addEventListener('load', (ev) => {
                options.template.privateComponent?this.requireComponent(ev):null;
                this.requestTemplates(ev);
            });
        }

        this.requireComponent = function (ev) {
            moduleComponent.requireComponent(ev);
        }

        this.requestTemplates = function (ev) {
            moduleTemplator.requestTemplates(ev);
        }
    }

    function Templator() {
        let moduleOptions = null;
        let moduleException = null;

        this.init = function (exception, options) {
            moduleException = exception;
            moduleOptions = options;

            this.requestApiContext(moduleOptions.apiDataPath, true);
        }

        this.requestLocalFile = function(url, async = false){
            let xhr = new XMLHttpRequest();
            xhr.addEventListener('readystatechange', (ev) => {
                if (xhr.status == 200 || xhr.status == 201) {
                    if (xhr.readyState == 4) {
                        if(async)
                            window.API = JSON.parse(xhr.responseText);
                        else
                            return xhr.responseText;
                    }
                }
            });
            xhr.open('get', url, async);
            xhr.send();
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
            xhr.open("get", "_templates/layout.html", false);
            xhr.send();
        }

        this.drawHandler = function(documents){
            this.drawHeadWithValidate(documents.head);
            this.drawBodyWithValidate(documents.body);
        }

        this.drawHeadWithValidate = function(head){
            let parsingHtmlHead = this.parseElementsToString(head.innerHTML);
            let parsingElement = this.convertHtmlStringToElements(parsingHtmlHead);
            moduleException.drawHeadWithValidate([...parsingElement]);
        }
        
        this.drawBodyWithValidate = function(body){
            let parsingHtmlBody = this.parseElementsToString(body.innerHTML);
            let parsingElement = this.convertHtmlStringToElements(parsingHtmlBody);
            moduleException.drawBodyWithValidate([...parsingElement]);
        }

        this.parseElementsToString = function (element) {
            return this.unitonParser(element);
        }

        this.convertHtmlStringToElements = function (htmlString) {
            let dom = new DOMParser();
            let documents = dom.parseFromString(htmlString, "text/html");
            if(documents.head.children.length==0){
                return documents.body.children;
            } else {
                return documents.head.children;
            }
        }

        this.unitonParser = function (responseText) {
            let tmp = '';
            tmp = responseText.replace(/\{\#\s*[\s\S]+?\n*\s*\#\}/gim, e => {
                let commend = e.replace(/\{\#|\#\}/gm, '').trim();
                if (commend.includes('insert')) {
                    return this.requestLocalFile(commend.split('insert ')[1]);
                } else if (commend.trim() == 'API.url') {
                    if (API.url == "") return location.protocol + '//' + location.host + (API.baseurl != '' ? API.baseurl : '/');
                    else return this.evl(`${commend}`);
                } else {
                    return this.evl(`${commend}`);
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
        let moduleView = null;

        this.init = function (view) {
            moduleView = view;
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
                                root.unitonIf(this);
                            } else if (this.tagName == "U-FOR") {
                                root.unitonFor(this);
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

        this.init = function (view) {
            moduleView = view;
        }

        this.drawHeadWithValidate = function(heads){
            moduleView.drawFilteredElementsToHead(heads);
        }

        this.drawBodyWithValidate = function (elements) {
            let filteredElements = elements.filter(elem => elem.innerHTML != '' && elem.innerHTML != undefined && elem.innerHTML.indexOf('CDATA') == -1).map(elem=>{
                if(elem.tagName == 'SCRIPT'){
                    let s = document.createElement('script');
                    if(elem.innerHTML.trim()==''){
                        elem.src?s.src = elem.src:null;
                        elem.integrity?s.integrity = elem.integrity:null;
                        elem.crossOrigin?s.crossOrigin = elem.crossOrigin:null;
                    } else {
                        elem.innerHTML?s.innerHTML = elem.innerHTML:null;
                    }
                    return s;
                } else {
                    return elem;
                }
            });
            
            moduleView.drawFilteredElementsToBody(filteredElements);
        }
    }

    function View() {
        let uiElem = null;

        this.init = function (ui) {
            uiElem = ui;
        }

        this.drawFilteredElementsToHead = function (elements) {
            uiElem.head.prepend(...elements);
        }
        this.drawFilteredElementsToBody = function (elements) {
            uiElem.body.prepend(...elements);
        }
    }

    return {
        init: function (options) {
            const html = document.querySelector('html');
            const head = document.head;
            const body = document.body;

            const ui = {
                html,
                head,
                body,
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
            component.init(view);
            exception.init(view);
            templator.init(exception, options);
            controller.init(packages);
        }
    }
})();