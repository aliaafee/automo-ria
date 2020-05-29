(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const status = require("./status")
const User = require("./user")


module.exports = class Connection {
    constructor(logger) {
        this.index_url = null
        this.resource_index = {}
        this.user = null;
        this.logger = logger;
    }


    login(index_url, username, password, on_success, on_failed, on_finally) {
        this.logger.log_spinner(`User '${username}' attemting to login...`);
        this.index_url = index_url;
        this.user = new User();
        this.user.login(
            index_url,
            username,
            password,
            (resource_index) => {
                this.resource_index = resource_index;
                on_success();
                on_finally != null ? on_finally() : false;
                this.logger.log_success(`User '${username}' logged in.`);
            },
            (error) => {
                on_failed(error);
                on_finally != null ? on_finally() : false;
                this.logger.log_error(`Login failed for '${username}'. ${error.message}`);
            }
        )
    }


    logout(on_success, on_failed) {
        this.user = null;
        on_success();
    }


    isLoggedIn() {
        if (this.user === null) {
            return false;
        }
        if (!(this.user.tokenValid())) {
            return false;
        }
        return true
    }


    _get(url, on_success, on_failed, on_finally, refetchTokenOnFail = true) {
        let headers = this.user.getAuthorizationHeaders();

        fetch(url, { method: 'GET', headers: headers })
            .then(status)
            .then(response => response.json())
            .then(data => {
                this.logger.log_success(`GET ${url}`)
                on_success(data);
                on_finally != null ? on_finally() : false;
            })
            .catch(error => {
                if (refetchTokenOnFail ? (error.status == 401) : false) {
                    this.user.getToken(
                        () => {
                            this._get(url, on_success, on_failed, on_finally, false)
                        },
                        (getTokenError) => {
                            this.logger.log_error(`GET ${url} failed. ${getTokenError.message}`);
                            on_failed(getTokenError);
                            on_finally != null ? on_finally() : false;
                        }
                    );
                } else {
                    this.logger.log_error(`GET ${url} failed. ${error.message}.`)
                    on_failed(error);
                    on_finally != null ? on_finally() : false;
                }
            })
    }


    get(url, on_success, on_failed, on_finally) {
        this.logger.log_spinner(`GET ${url}...`)
        if (this.user == null) {
            on_failed(new Error("User not logged in"));
            on_finally != null ? on_finally() : false;
            return;
        }
        if (!this.user.tokenValid()) {
            this.user.getToken(
                () => {
                    this._get(url, on_success, on_failed, on_finally)
                },
                (error) => {
                    this.logger.log_error(`GET ${url} failed. Failed to renew token.`)
                    on_failed(error)
                    on_finally != null ? on_finally() : false;
                }
            );
            return;
        }
        this._get(url, on_success, on_failed, on_finally);
    }


    post(url, post_data, on_success, on_failed, on_finally) {
        this.logger.log_spinner(`POST ${url}...`)
        if (this.user == null) {
            on_failed(new Error("User not logged in"));
            on_finally != null ? on_finally() : false;
            return;
        }
        if (!this.user.tokenValid()) {
            this.user.getToken(
                () => {
                    this._post(url, post_data, on_success, on_failed, on_finally)
                },
                (error) => {
                    this.logger.log_error(`POST ${url} failed. Failed to renew token.`)
                    on_failed(error)
                    on_finally != null ? on_finally() : false;
                }
            );
            return;
        }
        this._post(url, post_data, on_success, on_failed, on_finally);
    }


    _post(url, post_data, on_success, on_failed, on_finally, refetchTokenOnFail = true) {
        let headers = this.user.getAuthorizationHeaders();

        headers.set('Content-Type', 'application/json');

        fetch(url, { method: 'POST', body: JSON.stringify(post_data), headers: headers })
            .then(status)
            .then(response => response.json())
            .then(data => {
                this.logger.log_success(`POST ${url}`)
                on_success(data);
                on_finally != null ? on_finally() : false;
            })
            .catch(error => {
                if (refetchTokenOnFail ? (error.status == 401) : false) {
                    this.user.getToken(
                        () => {
                            this._post(url, post_data, on_success, on_failed, on_finally, false)
                        },
                        (getTokenError) => {
                            this.logger.log_error(`POST ${url} failed. ${getTokenError.message}`);
                            on_failed(getTokenError);
                            on_finally != null ? on_finally() : false;
                        }
                    );
                } else {
                    this.logger.log_error(`POST ${url} failed. ${error.message}.`)
                    on_failed(error);
                    on_finally != null ? on_finally() : false;
                }
            })
    }
}
},{"./status":6,"./user":7}],2:[function(require,module,exports){
const Form = require('../../controls/form/form');
const TextField = require('../../controls/form/text-field');
const FormDialog = require('../../controls/dialog/form-dialog');
const Spinner = require('../../controls/spinner');


module.exports = class LoginDialog extends FormDialog {
    constructor(options={}) {
        var form = new Form();

        form.addField(new TextField(
            'index_url',
            {
                placeholder: 'Server URL',
                required: true
            }
        ));
        
        form.addField(new TextField(
            'username',
            {
                placeholder: 'Username',
                required: true
            }
        ));
        
        form.addField(new TextField(
            'password',
            {
                placeholder: 'Password',
                type: 'password',
                required: true
            }
        ));

        super(
            form, 
            {
                title: 'Login',
                okLabel: 'Login',
                width: '400px',
                centered: true
            }
        );

        this.spinner = new Spinner();

        this.statusElement = null;
    }


    _onOk(ev) {
        if (this.form.validate() == false) {
            return;
        }
        this.onOk(this.value());
    }


    tryLogin(onSuccess, onCancel) {
        this.show(
            (data) => {
                this.spinner.show();
                connection.login(
                    data.index_url, data.username, data.password,
                    () => {
                        this.hide();
                        onSuccess();
                    },
                    (error) => {
                        this.statusElement.innerText = error.message;
                        this.form._fields[1].focus();
                    },
                    () => {
                        this.spinner.hideSoft();
                    }
                )
            },
            () => {
                onCancel();
            }
        )
    }


    createElement() {
        super.createElement();

        this.headerElement.appendChild(this.spinner.createElement());
        this.spinner.hideSoft();

        this.statusElement = document.createElement('div');
        this.statusElement.className = 'dialog-status';
        this.bodyElement.appendChild(this.statusElement);

        this.btnCancel.hide();
        this._closeElement.style.display = 'none';

        return this.element;
    }
}
},{"../../controls/dialog/form-dialog":11,"../../controls/form/form":13,"../../controls/form/text-field":14,"../../controls/spinner":21}],3:[function(require,module,exports){
//const feather = require('feather-icons');


module.exports = class Logger {
    constructor () {
        this.statusElement = null;
    }

    setTarget(target) {
        this.statusElement = target;
    }

    log(message) {
        if (this.statusElement == null) {
            console.log(message);
            return;
        }
        this.statusElement.innerHtml = message;
    }

    log_spinner(message) {
        if (this.statusElement == null) {
            //console.log(message);
            return;
        }
        this.statusElement.innerHtml = message;
    }

    log_success(message) {
        if (this.statusElement == null) {
            console.log(message);
            return;
        }
        this.statusElement.innerHtml = message;
    }

    log_error(message) {
        if (this.statusElement == null) {
            console.log(message);
            return;
        }
        this.statusElement.innerHtml = message;
    }
}
},{}],4:[function(require,module,exports){
//const queryString = require('query-string');
const querystring = require('querystring');

const Control = require('../../controls/control');
const TextBox = require('../../controls/text-box');
//const ListBox = require('../../controls/list-box');
const ResourceList = require('../../controls/resource-list');
const Splitter = require('../../controls/splitter');
const PatientPanel = require('./patient-panel');



class PatientList extends Control {
    constructor(onSelectPatient, option={}) {
        super(option);

        this.searchBox = new TextBox({
            placeholder: 'Search'
        });
        this.resultList = new ResourceList(
            (item) => {
                return item.id;
            },
            (item) => {
                return this._getPatientLabel(item);
            },
            (item) => {
                onSelectPatient(item);
            }
        )
    }

    _getPatientLabel(patient) {
        return `
            <div class="patient-label">
                <div class="patient-id-number">
                    ${patient.national_id_no}
                </div>
                <div class="patient-name">
                    ${patient.name}
                </div>
                <div class="patient-age">
                    ${patient.age}
                </div>
                <div class="patient-sex">
                    ${patient.sex}
                </div>
            </div>
        `
    }

    _search() {
        this.resultList.setResourceUrl(
            connection.resource_index.patients + '?' + querystring.stringify(
                {
                    'q': this.searchBox.value()
                }
            )
        )
    }

    createElement() {
        super.createElement();

        this.element.className = 'patient-list';

        this.element.appendChild(this.searchBox.createElement());

        this.element.appendChild(this.resultList.createElement());

        this.element.style.display = 'flex';
        
        this.searchBox.element.addEventListener('keyup', (ev) => {
            this._search();
        })

        this._search();

        return this.element;
    }
}


module.exports = class PatientBrowser extends Splitter {
    constructor(options={}) {
        var patientPanel = new PatientPanel();
        var patientList = new PatientList((patient) => {
            patientPanel.setPatient(patient);
        });

        options.pane1Size = '260px';
        options.resizable = true;

        super(
            patientList,
            patientPanel,
            options
        )
    }

    createElement() {
        return super.createElement()
    }
};
},{"../../controls/control":9,"../../controls/resource-list":18,"../../controls/splitter":22,"../../controls/text-box":23,"./patient-panel":5,"querystring":28}],5:[function(require,module,exports){
const Scrolled = require('../../controls/scrolled');
const Tile =  require('../../controls/tile');
const ResourceAccordion = require('../../controls/resource-accordion');
const ResourceAccordionItem = require('../../controls/resource-accordion-item');



class ProblemsTile extends Tile {
    constructor(options={}) {
        super('Diagnosis', options);

        this.resourceList = new ResourceAccordion(
            (item) => {
                return item.id;
            },
            ResourceAccordionItem
        );
    }

    setPatient(patient) {
        this.resourceList.setResourceUrl(patient.problems);
    }

    createElement() {
        super.createElement();

        this._tileBodyElement.appendChild(this.resourceList.createElement());

        return this.element
    }
}


class AdmissionsItem extends ResourceAccordionItem {
    constructor(itemData, options={}) {
        super(itemData, options);
    }

    displayResource() {
        this.startTime.innerHTML = this.resourceData.start_time;
    }

    createHeaderElement() {
        super.createHeaderElement();

        this.headerElement.innerHTML = `
            <div>Admission</div>
            <div>${this.itemData.start_time}</div>
            <div>${this.itemData.end_time}</div>
            <div>${this.itemData.personnel.name}</div>
        `;

        return this.headerElement;
    }

    createBodyElement() {
        super.createBodyElement();

        this.startTime = document.createElement('div');
        this.bodyElement.appendChild(this.startTime);

        return this.bodyElement;
    }
}


class AdmissionsTile extends Tile {
    constructor(options={}) {
        super('Admissions', options);

        this.resourceList = new ResourceAccordion(
            (item) => {
                return item.id;
            },
            AdmissionsItem
        );
    }

    setPatient(patient) {
        this.resourceList.setResourceUrl(patient.admissions);
    }

    createElement() {
        super.createElement();

        this._tileBodyElement.appendChild(this.resourceList.createElement());

        return this.element
    }
}


module.exports = class PatientPanel extends Scrolled {
    constructor(options={}) {
        super(options)

        this.patient = null;

        this.problemsTile = new ProblemsTile();
        this.admissionsTile = new AdmissionsTile();
    }

    _setPatient(patient) {
        this.patient = patient;

        this._idNumberElement.innerHTML = "NIC No.: " + patient.national_id_no;
        this._hospNumberElement.innerHTML = ", Hospital No.: " +patient.hospital_no;
        this._phoneNumberElement.innerHTML = ", Phone No.: " +patient.phone_no;
        this._nameElement.innerHTML = patient.name;
        this._ageSexElement.innerHTML = patient.age + "/" + patient.sex;

        this._headerElement.style.display = 'flex';
        this._bodyElement.style.display = 'flex';

        this.problemsTile.setPatient(patient);
        this.admissionsTile.setPatient(patient);
    }

    setPatient(patient) {
        this._idNumberElement.innerHTML = "NIC No.: " + patient.national_id_no;
        this._hospNumberElement.innerHTML = ", Hospital No.: " +patient.hospital_no;
        this._phoneNumberElement.innerHTML = "";
        this._nameElement.innerHTML = patient.name;
        this._ageSexElement.innerHTML = patient.age + "/" + patient.sex;
        
        this._bodyElement.style.display = 'none';

        connection.get(
            patient.url,
            patient => {
                this._setPatient(patient)
            },
            (error) => {
                console.log(error);
            },
            () => {
                
            }
        )
    }

    createElement() {
        super.createElement();

        
        this.element.className = 'patient-panel';
        this.element.style.flexDirection = 'column';

        this._headerElement = document.createElement('div');
        this._headerElement.className = 'header';
        this._headerElement.style.flexDirection = 'column';
        this.element.appendChild(this._headerElement);

        var detailsElement = document.createElement('div')
        detailsElement.style.display = 'flex';
        detailsElement.style.flexDirection = 'row';
        detailsElement.style.alignItems = 'baseline';
        this._headerElement.appendChild(detailsElement);

        this._nameElement = document.createElement('h1');
        detailsElement.appendChild(this._nameElement);

        this._ageSexElement = document.createElement('span');
        detailsElement.appendChild(this._ageSexElement);

        var numberElement = document.createElement('div');
        numberElement.className = 'number';
        numberElement.style.display = 'flex';
        numberElement.style.flexDirection = 'row';
        this._headerElement.appendChild(numberElement);

        this._idNumberElement = document.createElement('div');
        numberElement.appendChild(this._idNumberElement);

        this._hospNumberElement = document.createElement('div');
        numberElement.appendChild(this._hospNumberElement);

        this._phoneNumberElement = document.createElement('div');
        numberElement.appendChild(this._phoneNumberElement);

        this._bodyElement = document.createElement('div');
        this._bodyElement.className = 'body';
        this._bodyElement.style.flexDirection = 'column';
        this.element.appendChild(this._bodyElement);

        /*
        this._problemsElement = document.createElement('div');
        this._problemsElement.classList = 'tile problems'
        this._problemsElement.innerHTML = '<h1>Problems</h1><div class="tile-body">Problems<br>Problems<br>Problems<br></div>'
        this._bodyElement.appendChild(this._problemsElement)

        this._admissionsElement = document.createElement('div');
        this._admissionsElement.classList = 'tile admissions'
        this._admissionsElement.innerHTML = '<h1>Admissions</h1><div class="tile-body">Admissions<br>Admissions<br>Admissions<br></div>'
        this._bodyElement.appendChild(this._admissionsElement)
        */

        this._bodyElement.appendChild(this.problemsTile.createElement());
        this._bodyElement.appendChild(this.admissionsTile.createElement());

        this._headerElement.style.display = 'none';
        this._bodyElement.style.display = 'none';
        
        return this.element;
    }

}
},{"../../controls/resource-accordion":17,"../../controls/resource-accordion-item":16,"../../controls/scrolled":19,"../../controls/tile":24}],6:[function(require,module,exports){
class ResponseError extends Error {
	constructor(response) {
		var message = `Response Error ${response.status} ${response.statusText}`;
		super(message);
		this.status = response.status;
	}
}

module.exports = function status(response) {
	if (!response.ok) {
		return Promise.reject(new ResponseError(response));
	}
	return Promise.resolve(response);
}

},{}],7:[function(require,module,exports){
const status = require("./status");


module.exports = class User {
    constructor() {
        this.username = null;
        this.fullname = null
        this.password = null;
        this.token = null;
        this.token_expire_time = null;
        this.url = null;
        this.token_url = null;
    }


    tokenValid() {
        if (this.token === null) {
            return false;
        }
        if ((new Date().getTime() / 1000) > this.token_expire_time) {
            this.token = null;
            this.token_expire_time = null;
            return false;
        }
        return true;
    }

    getName() {
        if (this.fullname == null) {
            return this.username;
        }
        return this.fullname;
    }


    getToken(on_success, on_failed) {
        let headers = new Headers();
        headers.set(
            'Authorization',
            'Basic ' + btoa(this.username + ":" + this.password)
        );

        fetch(this.token_url, { method: 'GET', headers: headers })
            .then(status)
            .then(response => response.json())
            .then(data => {
                this.token = data['token'];
                this.token_expire_time = (new Date().getTime() / 1000) + data['expiration'];
                on_success();
            })
            .catch(error => {
                on_failed(new Error(`Failed to get token, ${error.message}.`));
            })
    }


    getAuthorizationHeaders() {
        let headers = new Headers();
        headers.set(
            'Authorization',
            'Basic ' + btoa(this.token + ":")
        );
        return headers;
    }


    getUserData(on_success, on_failed) {
        let headers = this.getAuthorizationHeaders();

        fetch(this.url, { method: 'GET', headers: headers })
            .then(status)
            .then(response => response.json())
            .then(data => {
                this.fullname = data.fullname;
                on_success();
            })
            .catch(error => {
                on_failed(new Error(`Failed to get user data. ${error.message}`));
            })
    }


    login(index_url, username, password, on_success, on_failed) {
        this.username = username;
        this.password = password;

        let headers = new Headers();
        headers.set(
            'Authorization',
            'Basic ' + btoa(this.username + ":" + this.password)
        );

        function checkCredentials(data) {
            if (!("auth_token" in data)) {
                return Promise.reject(new Error("Unexpected data."));
            }
            return Promise.resolve(data)
        }

        fetch(index_url, { method: 'GET', headers: headers })
            .then(status)
            .then(response => response.json())
            .then(data => checkCredentials(data))
            .then(resource_index => {
                this.token_url = resource_index['auth_token'];
                this.getToken(
                    () => {
                        this.url = resource_index['user'];
                        this.getUserData(
                            () => {
                                on_success(resource_index)
                            }, 
                            on_failed
                        );
                    },
                    on_failed
                );
            })
            .catch((error) => {
                if (error.status == 401) {
                    on_failed(new Error('Invalid Username or Password'));
                } else {
                    on_failed(new Error(`Login error. ${error.message}`));
                }
            })
    }
}
},{"./status":6}],8:[function(require,module,exports){
const Control = require("./control");

module.exports = class Button extends Control {
    constructor(label, onClick, options) {
        super(options);
        this.label = label;
        this.onClick = onClick;
    }

    createElement() {
        this.element = document.createElement('button');
        this.element.style.minWidth = this.options.width;
        this.element.style.minHeight = this.options.height;
        
        this.element.innerHTML = this.label;

        this.element.addEventListener('click', (ev) => {
            ev.preventDefault();
            this.onClick(ev);
        })

        return this.element
    }

}

},{"./control":9}],9:[function(require,module,exports){

module.exports = class Control {
    constructor(options = {}) {
        /* Options
         *  widht, height =  css size
         */
        this.element = null;
        this.options = options;
    }

    focus() {
        this.element.focus();
    }

    removeElement() {
        if (this.element == null) {
            return
        }
        parent = this.element.parentElement

        if (parent == null) {
            return
        }

        parent.removeChild(this.element);
    }

    createElement() {
        //Create the element
        this.element = document.createElement('div');

        //Add styles
        this.element.style.display = "flex";
        this.element.style.userSelect = "none";
        this.element.style.width = this.options.width;
        this.element.style.height = this.options.height;

        //Attache events

        return this.element;
    }

    hideSoft() {
        this.element.style.visibility = 'hidden';
    }

    hide() {
        this.element.style.display = "none";
    }

    show(display = 'flex') {
        this.element.style.display = display;
        this.element.style.visibility = '';
    }
}

},{}],10:[function(require,module,exports){
const Control = require("../control");


module.exports = class Dialog extends Control {
    constructor(options={}) {
        /* Options
         *  centered=false
         */
        super(options);

        this.onCancel = null;
        this.onOk = null;

        this.headerElement = null;
        this.bodyElement = null;
        this.footerElement = null;

        this._dialogElement = null;
        this._closeElement = null;
    }

    value() {
        return null;
    }

    show(onOk, onCancel) {
        this.onOk = onOk;
        this.onCancel = onCancel;

        super.show();
    }

    _onCancel(ev) {
        this.hide();
        this.onCancel();
    }

    _onOk(ev) {
        this.hide();
        this.onOk(this.value());
    }

    createElement() {
        this.element = document.createElement('div');

        if (this.options.centered == true){
            this.element.className = 'foreground-centered';
        } else {
            this.element.className = 'foreground';
        }

        this._dialogElement = document.createElement('div');
        this._dialogElement.className = 'dialog';
        this._dialogElement.style.userSelect = "none";
        this._dialogElement.style.display = "flex";
        this._dialogElement.style.flexDirection = "column"
        this._dialogElement.style.width = this.options.width;
        this._dialogElement.style.height = this.options.height;
        this.element.appendChild(this._dialogElement);

        var header = document.createElement('div');
        header.className = 'dialog-header';
        header.style.display = 'flex';
        //header.style.flexDirection = 'row';
        this._dialogElement.appendChild(header);
        
        this.headerElement = document.createElement('div');
        this.headerElement.style.display = 'flex';
        this.headerElement.style.flexGrow = 1;
        header.appendChild(this.headerElement);

        this._closeElement = document.createElement('div');
        this._closeElement.className = 'dialog-close';
        this._closeElement.innerHTML = '&times;'
        header.appendChild(this._closeElement);

        this.bodyElement = document.createElement('div');
        this.bodyElement.className = 'dialog-body';
        this.bodyElement.style.flexGrow = 1;
        this._dialogElement.appendChild(this.bodyElement);

        this.footerElement = document.createElement('div');
        this.footerElement.className = 'dialog-footer';
        this._dialogElement.appendChild(this.footerElement);

        this.hide();

        this.element.addEventListener('click', (ev) => {
            //this._onCancel();
        });

        this._dialogElement.addEventListener('click', (ev) => {
            ;
        })

        this._closeElement.addEventListener('click', (ev) => {
            this._onCancel();
        });

        if (this.options.title != null) {
            var title = document.createElement('h1');
            title.innerText = this.options.title;
            this.headerElement.appendChild(title);
        }

        //this.bodyElement.innerHTML = 'Some shit that is in a dialog is here now';
        //this.footerElement.innerText = 'This is the footer'

        return this.element;
    }

}
},{"../control":9}],11:[function(require,module,exports){
const Dialog = require("./dialog");
const Button = require("../button");


module.exports = class FormDialog extends Dialog {
    constructor(form, options={}) {
        super(options)

        this.form = form;

        this.btnOk = new Button(
            options.okLabel != null ? options.okLabel : 'Ok',
            (ev) => {
                this._onOk(ev);
            },
            {
                width: '80px'
            }
        );

        this.btnCancel = new Button(
            options.cancelLabel != null ? options.cancelLabel : 'Cancel',
            (ev) => {
                this._onCancel(ev);
            },
            {
                width: '80px'
            }
        )
    }

    value() {
        return this.form.value();
    }

    _onOk(ev) {
        if (this.form.validate() == false) {
            return;
        }

        super._onOk(ev);
    }

    createElement() {
        super.createElement();

        this.bodyElement.className = 'dialog-body-padded';
        this.bodyElement.appendChild(this.form.createElement());

        this.footerElement.appendChild(this.btnCancel.createElement());
        this.footerElement.appendChild(this.btnOk.createElement());

        return this.element;
    }

}
},{"../button":8,"./dialog":10}],12:[function(require,module,exports){

const Control = require("../control");

module.exports = class Field extends Control {
    constructor(name, options = {}) {
        /*Options
         *  label=""
         *  labelSize=in css units
         *  labelTop=false
         *  required=true|false
         *  invalidFeedback=""
         *  helpText=""
         *  placeholder=""
         */
        super(options);
        this.name = name;
        //this.label = label;

        this._labelElement = null;
        this._placeholderElement = null;
        this._helpElement = null;
        this._invalidElement = null;
    }

    value() {
        return;
    }

    setValue(value) {
        return;
    }

    setLabel(text) {
        if (this._labelElement != null) {
            this._labelElement.innerText = text;
        }
    }

    setData(data) {
        //Expects a dictionary with key equal to name
        this.setValue(
            data[this.name]
        );
    }

    isBlank() {
        return false;
    }

    isValid() {
        if (this.options.required == true) {
            if (this.isBlank()) {
                return false;
            }
        }
        return true;
    }

    validate() {
        this.markValid();

        var isValid = this.isValid();
        if (!isValid) {
            this.markInvalid();
        }

        return isValid;
    }

    markInvalid() {
        this.element.classList.add('invalid');
    }

    markValid() {
        this.element.classList.remove('invalid');
    }

    lock() {
        return;
    }

    unlock() {
        return;
    }

    createElement() {
        super.createElement()

        this.element.classList.add('field');

        if (this.options.label != null) {
            this._labelElement = document.createElement('label');
            this._labelElement.innerHTML = this.options.label;
            this._labelElement.style.width = this.options.labelSize;
            //this.element.appendChild(this._labelElement);
        }
        
        var content = document.createElement('div');
        content.style.display = 'flex';
        content.style.flexDirection = 'column';
        content.style.flexGrow = 1;
        //this.element.appendChild(content);

        if (this.options.label == null) {
            this.element.appendChild(content);
        } else if (this.options.labelTop == true) {
            content.appendChild(this._labelElement);
            this.element.appendChild(content);
        } else {
            this.element.appendChild(this._labelElement);
            this.element.appendChild(content);
        }

        this._placeholderElement = document.createElement('div');
        this._placeholderElement.style.display = 'flex';
        this._placeholderElement.style.flexGrow = 1;
        content.appendChild(this._placeholderElement);

        if (this.options.helpText != null) {
            this._helpElement = document.createElement('div');
            this._helpElement.className = 'help-text';
            this._helpElement.innerHTML = this.options.helpText;
            content.appendChild(this._helpElement);
        }

        if (this.options.invalidFeedback != null) {
            this._invalidElement = document.createElement('div');
            this._invalidElement.className = 'invalid-feedback';
            this._invalidElement.innerHTML = this.options.invalidFeedback;
            content.appendChild(this._invalidElement);
        }
        
        return this.element
    }
}

},{"../control":9}],13:[function(require,module,exports){
const Control = require("../control");


module.exports = class Form extends Control {
    constructor(options={}) {
        /*Options
         *  labelSize=in css units
         *  labelTop=false
         *  flexDirection='column|row'
         */
        super(options);

        this._fields = [];
        this._fieldNames = [];
    }

    addField(field) {
        if (this.options.labelSize != null) {
            field.options.labelSize = this.options.labelSize;
        }
        if (this.options.labelTop != null) {
            field.options.labelTop = this.options.labelTop;
        }

        this._fields.push(field);
        this._fieldNames.push(field.name);
    }

    setValue(value) {
        //Value is dictionary with fieldName: value
        for (var i = 0; i < this._fieldNames.length; i++) {
            this._fields[i].setValue(
                value[this._fieldNames[i]]
            );
        }
    }

    value() {
        //Returns a dictionary with fieldName: value
        var result = {};
        for (var i = 0; i < this._fieldNames.length; i++) {
            result[this._fieldNames[i]] = this._fields[i].value();
        }
        return result;
    }

    getFieldByName(fieldName) {
        return this._fields[this._fieldNames.findIndex((value) => { return value == fieldName;})];
    }

    setFieldLabel(fieldName, label) {
        this.getFieldByName(fieldName).setLabel(label);
    }

    setFieldValue(fieldName, value) {
        this.getFieldByName(fieldName).setValue(value);
    }

    fieldValue(fieldName) {
        return this.getFieldByName(fieldName).value();
    }

    hideField(fieldName) {
        this.getFieldByName(fieldName).hide();
    }

    validate() {
        var isValid = true;

        this._fields.forEach((field) => {
            if (field.validate() == false) {
                isValid = false;
            }
        });

        return isValid;
    }

    lock() {
        this._fields.forEach((field) => {
            field.lock();
        });
    }

    unlock() {
        this._fields.forEach((field) => {
            field.unlock();
        });
    }

    clearValidation() {
        this._fields.forEach((field) => {
            field.markValid();
        });
    }

    createElement() {
        super.createElement();

        this.element.style.flexDirection = this.options.flexDirection ? this.options.flexDirection : 'column';

        this._fields.forEach((field) => {
            this.element.appendChild(field.createElement());
        })

        return this.element;
    }

}
},{"../control":9}],14:[function(require,module,exports){
const TextBox = require("../text-box");
const Field = require("./field");


module.exports = class TextField extends Field {
    constructor(name, options = {}) {
        super(name, options);

        this._textBox = new TextBox({
            placeholder: options.placeholder,
            type: options.type,
            rows: options.rows,
            resize: options.resize
        });
    }

    focus() {
        this._textBox.focus();
    }

    isBlank() {
        return this._textBox.isBlank();
    }

    value() {
        return this._textBox.value();
    }

    setValue(value) {
        this._textBox.setValue(value);
    }

    lock() {
        this._textBox.lock();
    }

    unlock() {
        this._textBox.unlock();
    }

    createElement() {
        super.createElement()

        this._placeholderElement.appendChild(
            this._textBox.createElement()
        );

        this._textBox.element.style.flexGrow = 1;

        return this.element;
    }
}

},{"../text-box":23,"./field":12}],15:[function(require,module,exports){
const Scrolled = require("./scrolled");

module.exports = class ListBox extends Scrolled {
    constructor(idFunction, labelFunction, onSelectItem, options) {
        /* idFunction(result) { return result.unique_id }
         * labelFunction(result) { return result.label }
         * onResultClicked(result) { do something using result }
         * 
         */
        super(options);

        this.idFunction = idFunction;
        this.labelFunction = labelFunction;
        this.onSelectItem = onSelectItem;

        this.data = [];
        this._itemIds = [];
        this._itemElements = [];

        this._listElement = null;

        this._selectedItem = null;
        this._selectedElement = null;

        this._onItemClicked = (event) => {
            this.clearSelection();

            this._selectedElement = event.currentTarget;
            
            this._highlightSelection();
            this._onSelectItem(event);
        }
    }

    _createListItem(itemid, label) {
        var item = document.createElement('li');
        item.setAttribute('item-id', itemid);
        item.innerHTML = label;

        item.addEventListener('click', this._onItemClicked);

        return item;
    }

    _clear() {
        while (this._listElement.firstChild) {
            this._listElement.firstChild.remove();
        }
    }

    _highlightSelection() {
        this._selectedElement.className = 'selected';
    }

    _onSelectItem(event) {
        this._selectedItem = null;
        var selectedId = this._selectedElement.getAttribute('item-id');
        for (var i = 0; i < this._itemIds.length; i++) {
            if (this._itemIds[i] == selectedId) {
                this._selectedItem = this.data[i];
                this.onSelectItem(this._selectedItem);
                return
            }
        }
    }

    value() {
        return this._selectedItem;
    }

    setSelection(itemId) {
        if (itemId == null || itemId == '') {
            this.clearSelection();
            return;
        }
        for (var i = 0; i < this._itemIds.length; i++) {
            if (this._itemIds[i] == itemId) {
                this.clearSelection();

                this._selectedElement = this._itemElements[i];
                this._selectedItem = this.data[i];
                
                this._highlightSelection();
                this._selectedElement.scrollIntoView();
            }
        }
    }

    clearSelection() {
        if (this._selectedElement != null) {
            this._selectedElement.className = null;
        }
        this._selectedElement = null;

        this._selectedItem = null;
    }

    setData(data) {
        this.data = data;
        this.displayData();
    }

    appendData(data) {
        if (!this.data) {
            this.data = data
        } else {
            this.data = this.data.concat(data);
        }
        this.displayData(true);
    }

    displayData(noScroll) {
        this._clear();
        
        this._itemIds = [];
        this._itemElements = [];
        this.data.forEach((item) => {
            var item_id = this.idFunction(item);

            this._itemIds.push(item_id);

            var elem = this._createListItem(
                item_id,
                this.labelFunction(item)
            );

            this._listElement.appendChild(elem);
            this._itemElements.push(elem);
        })

        if (!noScroll) {
            this.element.scrollTop = 0;
        }       
    }

    createElement() {
        super.createElement();

        this.element.classList.add('list-box');
        
        this._listElement =  document.createElement('ul');
        this.element.appendChild(this._listElement);

        return this.element;
    }
}
},{"./scrolled":19}],16:[function(require,module,exports){
const Control = require('./control');
const Spinner = require('./spinner');


module.exports = class ResourceAccordionItem extends Control {
    constructor(itemData, options) {
        super(options);

        this.itemData = itemData;

        this.resourceData = null;

        this.spinner = new Spinner();

        this._onClickHeader = (event) => {
            this.toggleBody();
        }
    }

    _showSpinner() {
        this.bodyElement.appendChild(this.spinner.createElement());
    }

    _hideSpinner() {
        this.spinner.removeElement();
    }

    toggleBody() {
        if (this.bodyElement.style.display == 'none') {
            this.showBody();
            return;
        }
        this.hideBody();
    }

    showBody() {
        this.bodyElement.style.display = 'flex';

        this.loadResource();
    }

    hideBody() {
        this.bodyElement.style.display = 'none';
        this._hideSpinner();
    }

    loadResource() {
        if (this.resourceData != null) {
            return;
        }

        this._showSpinner();
        connection.get(
            this.itemData.url,
            (data) => {
                this.resourceData = data;
                this.displayResource();
            },
            (error) => {
                console.log(error);
            },
            () => {
                this._hideSpinner();
            }
        )
    }

    displayResource() {
        return;
    }

    createHeaderElement() {
        this.headerElement = document.createElement('div');
        this.headerElement.className = 'root-item-head';
        this.headerElement.innerHTML = 'Title';
        this.headerElement.addEventListener('click', this._onClickHeader);

        return this.headerElement;

    }

    createBodyElement() {
        this.bodyElement = document.createElement('div');
        this.bodyElement.className = 'root-item-body';

        return this.bodyElement;
    }

    createElement() {
        this.element = document.createElement('li');
        this.element.className = 'root-item';

        this.element.appendChild(this.createHeaderElement());
        this.element.appendChild(this.createBodyElement());

        this.hideBody();

        return this.element;
    }
}
},{"./control":9,"./spinner":21}],17:[function(require,module,exports){
const Control = require('./control');
const Spinner = require('./spinner');
const ResourceAccordionItem = require('./resource-accordion-item');

module.exports = class ResourceAccordion extends Control {
    constructor(idFunction, itemClass=ResourceAccordionItem, options={}) {
        super(options);

        this.itemClass = itemClass;
        this.data = null;
        this.resourceData = null;
        this._itemData = {};
        this._itemChildren = {};

        this.idFunction = idFunction;
        //this.labelFunction = labelFunction;

        this.spinner = new Spinner();

        /*
        this._onItemClicked = (event) => {
            var selectedId = event.currentTarget.getAttribute('item-id');

            var selected_item = this._itemData[selectedId];

            console.log(selected_item);
        }
        */

        this._onNextItemClicked = (event) => {
            this._loadNext();
        }
    }

    _showSpinner() {
        var element = document.createElement('li');
        element.classList = 'root-item spinner-item';
        this._listElement.appendChild(element);

        element.appendChild(this.spinner.createElement())
    }

    _hideSpinner() {
        var element = this.spinner.element.parentElement;
        element.removeChild(this.spinner.element);
        element.parentElement.removeChild(element)
    }

    /*
    _createListItem(itemid, label) {
        var item = document.createElement('li');
        item.setAttribute('item-id', itemid);
        item.className = 'root-item';
        item.innerHTML = label;

        //item.addEventListener('click', this._onItemClicked);

        return item;
    }
    */

    _createNextItem() {
        this._nextElement = document.createElement('li');
        this._nextElement.classList = 'root-item next-item';
        this._nextElement.innerHTML = 'Load More...'

        this._nextElement.addEventListener('click', this._onNextItemClicked);
        
        return this._nextElement;
    }

    _removeNextItem() {
        this._nextElement.parentElement.removeChild(this._nextElement);
    }

    _clear() {
        for (var key in this._itemChildren) {
            this._listElement.removeChild(this._itemChildren[key].element);
        }
        if (this._nextElement != null) {
            this._listElement.removeChild(this._nextElement);
            this._nextElement = null;
        }
        this._data = null;
        this._itemChildren = {};
    }
    
    _setData(data) {
        this._clear();
        this._appendData(data);
    }

    _appendData(data) {
        if (this.data == null) {
            this.data = data;
        } else {
            this.data = this.data.concat(data);
        }

        data.forEach((item) => {
            var item_id = this.idFunction(item)

            this._itemChildren[item_id] = new this.itemClass(item);
            this._listElement.appendChild(this._itemChildren[item_id].createElement());
        })

        if (this.resourceData.next != null) {
            this._listElement.appendChild(this._createNextItem());
        } else {
            this._nextElement = null;
        }
    }

    _loadNext() {
        this._removeNextItem();
        this._showSpinner();
        connection.get(
            this.resourceData.next,
            (data) => {
                this.resourceData = data;
                this._appendData(this.resourceData.items);
            },
            (error) => {
                console.log(error);
            },
            () => {
                this._hideSpinner();
            }
        )
    }

    setResourceUrl(url) {
        //this._listElement.style.display = 'none';
        this._clear();
        this._showSpinner();
        connection.get(
            url,
            data => {
                this.resourceData = data;
                
                this._setData(this.resourceData.items);
            },
            (error) => {
                console.log(error);
            },
            () => {
                this._hideSpinner();;
            }
        )
    }

    createElement() {
        super.createElement()

        this.element.className = 'accordion';

        this._listElement = document.createElement('ul');
        this._listElement.style.flexDirection = 'column';
        this._listElement.className = 'root-list';
        this.element.appendChild(this._listElement);

        return this.element;
    }
}
},{"./control":9,"./resource-accordion-item":16,"./spinner":21}],18:[function(require,module,exports){
const ListBox = require("./list-box")
const Spinner = require("./spinner")
const SpinnerForeground = require("./spinner-foreground")

module.exports = class ResourceList extends ListBox {
    constructor(idFunction, labelFunction, onSelectItem, options) {
        /* idFunction(result) { return result.unique_id }
         * labelFunction(result) { return result.label }
         * onResultClicked(result) { do something using result }
         * 
         */
        super(idFunction, labelFunction, onSelectItem, options);

        this.spinner = new Spinner();

        this.resource_data = {}
    }

    setResourceUrl(url) {
        this.spinner.show();
        this._listElement.style.display = 'none';
        connection.get(
            url,
            data => {
                //console.log(data);
                this.resource_data = data;
                this.setData(data.items)
            },
            (error) => {
                console.log(error);
                if (error.status == 404) {
                    this.resource_data = {};
                    this.setData([]);
                    this.displayNotFound();
                }
            },
            () => {
                this.spinner.hide();
                this._listElement.style.display = 'flex';
            }
        )
    }

    _onLoadNextClicked(event) {
        event.target.style.display = 'none';
        this.spinner.show();
        connection.get(
            this.resource_data.next,
            data => {
                this.resource_data = data;
                this.appendData(data.items)
            },
            (error) => {
                console.log(error);
                this.displayData(true)
            },
            () => {
                this.spinner.hide();
            }
        )
    }

    displayNotFound() {
        var next_elem = document.createElement('li');
        next_elem.className = 'button'
        next_elem.innerHTML = 'Not Found.';
        this._listElement.appendChild(next_elem);
    }


    displayData(noScroll) {
        super.displayData(noScroll);

        if (this.resource_data.next) {
            var next_elem = document.createElement('li');
            next_elem.setAttribute('next-url', this.resource_data.next);
            next_elem.className = 'button'
            next_elem.innerHTML = 'Load More...';
            next_elem.addEventListener('click', (event) => { 
                this._onLoadNextClicked(event) 
            } )
            this._listElement.appendChild(next_elem);
        }
    }

    createElement() {
        super.createElement();

        this.element.style.flexDirection = 'column';
        this._listElement.style.flexGrow = 0;

        this.element.appendChild(this.spinner.createElement());
        this.spinner.hide();

        return this.element;
    }
}
},{"./list-box":15,"./spinner":21,"./spinner-foreground":20}],19:[function(require,module,exports){
const Control = require("./control");

module.exports = class Scrolled extends Control {
    constructor(options) {
        super(options);
    }

    scrollTo(position) {
        this.element.scrollTo(position);
    }

    createElement() {
        super.createElement();

        this.element.style.overflowX = 'none';
        this.element.style.overflowY = 'auto';
        this.element.style.flexGrow = 1;
        this.element.classList.add('scrolled');

        return this.element;
    }
}

},{"./control":9}],20:[function(require,module,exports){
const Control = require("./control");

module.exports = class SpinnerForground extends Control {
    constructor(options) {
        super(options);
    }

    createElement() {
        this.element = document.createElement('div');
        this.element.className = 'foreground';

        var spinner = document.createElement('div');
        spinner.className = 'spinner';

        this.element.appendChild(spinner);

        return(this.element);
    }
}

},{"./control":9}],21:[function(require,module,exports){
const Control = require("./control");

module.exports = class Spinner extends Control {
    constructor(options) {
        super(options);

        this._spinnerElement = null;
        this._labelElement = null;
    }

    setLabel(label) {
        this._labelElement.innerHtml = label;
    }

    

    show() {
        super.show();
    }

    createElement() {
        super.createElement();

        this.element.className = 'spinner-container';

        this._spinnerElement = document.createElement('div');
        this._spinnerElement.className = 'spinner';
        this.element.appendChild(this._spinnerElement);

        this._labelElement = document.createElement('div');
        this._labelElement.className = 'spinner-label';
        this.element.appendChild(this._labelElement);

        return this.element;
    }
}
},{"./control":9}],22:[function(require,module,exports){
const Control = require('./control');


module.exports = class Spitter extends Control {
    constructor(pane1, pane2, options = {}) {
        /* Options
         *  direction = 'row'|'column' (default='row')
         *  pane1Size = css size (if pane1Size is given, pane2Size is ignored)
         *  ((pane2Size = css size)) -> This Does not work
         *  minSize = int
         */
        super(options);

        this.pane1 = pane1;
        this.pane2 = pane2;

        this.resizerSize = 5;
        this.resizerElement = null;

        this.minSize = this.options.minSize != null ? this.options.minSize : 50;

        this.pos1 = null;
        this.pos2 = null;
        this.pos3 = null;
        this.pos4 = null;

        this._resizeMouseDown = (ev) => {
            ev.preventDefault();
            this.pos3 = ev.clientX;
            this.pos4 = ev.clientY;
            document.addEventListener('mousemove', this._resizeMouseMove);
            document.addEventListener('mouseup', this._resizeMouseUp);
        }

        this._resizeMouseMove = (ev) => {
            ev.preventDefault();
            this.pos1 = this.pos3 - ev.clientX;
            this.pos2 = this.pos4 - ev.clientY;
            this.pos3 = ev.clientX;
            this.pos4 = ev.clientY;
            this._resize();
        }

        this._resizeMouseUp = (ev) => {
            document.removeEventListener('mousemove', this._resizeMouseMove);
            document.removeEventListener('mouseup', this._resizeMouseUp);
        }
    }


    _setElementHeight(element, height) {
        element.style.height = height;
        element.style.minHeight = height;
        element.style.maxHeight = height;
    }


    _setElementWidth(element, width) {
        element.style.width = width;
        element.style.minWidth = width;
        element.style.maxWidth = width;
    }


    _resize() {
        if (this.options.direction == 'column') {
            var maxSize = this.element.offsetHeight - this.minSize;
            if (this.options.pane1Size != null) {
                var size = (this.pane1.element.offsetHeight - this.pos2);
                if (size > maxSize) { return }
                if (size < this.minSize) { return }
                this._setElementHeight(this.pane1.element, size + 'px');
            } else {
                var size = (this.pane2.element.offsetHeight + this.pos2);
                if (size > maxSize) { return }
                if (size < this.minSize) { return }
                this._setElementHeight(this.pane2.element, size + 'px');
            }
        } else {
            var maxSize = this.element.offsetWidth - this.minSize;
            if (this.options.pane1Size != null) {
                var size = (this.pane1.element.offsetWidth - this.pos1);
                if (size >= maxSize) { return }
                if (size < this.minSize) { return }
                this._setElementWidth(this.pane1.element, size +'px');
            } else {
                var size = (this.pane2.element.offsetWidth + this.pos1);
                if (size > maxSize) { return }
                if (size < this.minSize) { return }
                this._setElementWidth(this.pane2.element, size +'px');
            }
        }
    }


    _createResizerElement() {
        this.resizerElement = document.createElement('div');
        this.resizerElement.style.zIndex = '100';
        this.resizerElement.className = 'resizer';
        if (this.options.direction == 'column') {
            this.resizerElement.style.height = (this.resizerSize) + 'px';
            this.resizerElement.style.marginTop = '-' + (this.resizerSize / 2) + 'px';
            this.resizerElement.style.marginBottom = '-' + (this.resizerSize / 2) + 'px';
            this.resizerElement.style.width = '100%';
            this.resizerElement.style.cursor = 'ns-resize'
        } else {
            this.resizerElement.style.width = (this.resizerSize) +'px';
            this.resizerElement.style.marginLeft = '-' + (this.resizerSize / 2) +'px';
            this.resizerElement.style.marginRight = '-' + (this.resizerSize / 2) +'px';
            this.resizerElement.style.height = '100%';
            this.resizerElement.style.cursor = 'ew-resize'
        }
        //this.resizerElement.style.backgroundColor = 'red';
        this.resizerElement.addEventListener('mousedown', this._resizeMouseDown);

        return this.resizerElement;
    }


    createElement() {
        super.createElement();

        this.element.style.flexGrow = '1';

        if (this.options.direction == 'column') {
            this.element.style.flexDirection = 'column';
        }

        this.element.appendChild(this.pane1.createElement());

        if (this.options.pane1Size != null || this.options.pane2Size != null) {
            if (this.options.resizable == true) {
                this.element.appendChild(this._createResizerElement());
            }
        }
        
        this.element.appendChild(this.pane2.createElement());

        if (this.options.pane1Size != null) {
            this.pane2.element.style.flexGrow = 1;

            if (this.options.direction == 'column') {
                this._setElementHeight(this.pane1.element, this.options.pane1Size);
            } else {
                this._setElementWidth(this.pane1.element, this.options.pane1Size);
            }
        } else {
            if (this.options.pane2Size != null) {
                this.pane1.element.style.flexGrow = 1;
                
                if (this.options.direction == 'column') {
                    //This works now
                    this._setElementHeight(this.pane2.element, this.options.pane2Size);
                } else {
                    this._setElementWidth(this.pane2.element, this.options.pane2Size);
                }
            } else {
                this.pane1.element.style.flexGrow = 1;
                this.pane2.element.style.flexGrow = 1;
            }
        }

        this.pane1.element.style.flexDirection = 'column'
        this.pane2.element.style.flexDirection = 'column'

        return this.element;
    }
}
},{"./control":9}],23:[function(require,module,exports){
const Control = require("./control");

const VALID_TYPES = ['text', 'date', 'datetime-local', 'password', 'email', 'tel', 'number', 'time', 'url']

module.exports = class TextBox extends Control {
    constructor(options) {
        /* Options
         *  placeholder=""
         *  type=VALID_TYPE or textarea
         *  rows=2
         */
        super(options);
    }

    value() {
        return this.element.value;
    }

    setValue(value) {
        this.element.value = value;
    }

    isBlank() {
        if (this.element.value == '') {
            return true;
        }
        return false;
    }

    lock() {
        this.element.setAttribute('readonly', '');
    }

    unlock() {
        this.element.removeAttribute('readonly');
    }

    createElement() {
        if (this.options.type == 'textarea') {
            this.element = document.createElement('textarea');
            if (this.options.rows != null) {
                this.element.setAttribute('rows', this.options.rows);
            }
            if (this.options.resize != true) {
                this.element.style.resize = 'none'
            }
        } else {
            this.element = document.createElement('input');
            if (VALID_TYPES.includes(this.options.type)) {
                this.element.setAttribute('type', this.options.type);
            }
        }

        this.element.setAttribute('size', 1);

        if (this.options.onKeyUp) {
            this.element.addEventListener('keyup', (ev) => {
                this.options.onKeyUp(ev);
            })
        }

        if (this.options.placeholder != null) {
            this.element.setAttribute('placeholder', this.options.placeholder);
        }

        return this.element
    }

}

},{"./control":9}],24:[function(require,module,exports){
const Control = require("./control");

module.exports = class Tile extends Control {
    constructor(title, options) {
        super(options)

        this.title = title
    }

    createElement() {
        super.createElement();

        this.element.className = 'tile';
        this.element.style.display = 'flex';
        this.element.style.flexDirection = 'column';
        
        this._titleElement = document.createElement('h1');
        this._titleElement.className = 'tile-title';
        this._titleElement.innerHTML = this.title;
        this.element.appendChild(this._titleElement);

        this._tileBodyElement = document.createElement('div');
        this._tileBodyElement.className = 'tile-body';
        this.element.appendChild(this._tileBodyElement);

        return this.element;
    }
}
},{"./control":9}],25:[function(require,module,exports){
const Logger = require("./app/logger");
const Connection = require("./app/connection");
const LoginDialog = require("./app/dialog/login-dialog");
const PatientBrowser = require('./app/panel/patient-browser');

logger = new Logger();
connection = new Connection(logger);

dlgLogin = new LoginDialog();
pnlPatientBrowser = new PatientBrowser()

displayPatients = (data) => {
    var result = "";
    
    data['patients'].forEach(element => {
        result += `<tr><td>${element['id']}</td><td>${element['name']}</td><td>${element['url']}</td></tr>`
    });

    document.body.innerHTML = (
        `<table class="table table-striped table-sm">
            <thead>
                <tr><td>Id</td><td>Name</td><td>URL</td></tr>
            </head>
            <tbody>
                ${result}
            </tbody>
        </table>`
    );
}

showMainWindow = () => {
    document.body.appendChild(pnlPatientBrowser.createElement());
}


document.body.appendChild(dlgLogin.createElement());

dlgLogin.form.setValue({
    index_url: 'http://127.0.0.1:5000/api/',
    username: 'admin',
    password: 'a'
})

dlgLogin.tryLogin(
    () => {
        console.log("Login Sucessful.");
        showMainWindow();
    },
    () => {
        console.log("Cancelled.")
    }
);


/*
const Icd10CoderDialog = require('./app/dialog/icd10coder-dialog');

icd10 = new Icd10CoderDialog();

document.body.appendChild(icd10.createElement());

icd10.show(
    (value) => {
        console.log(value);
    },
    () => {
        console.log("Cancelled");
    }
);*/


/*
const ListBox =  require('./controls/list-box');
const TextBox = require('./controls/text-box');

var lst = new ListBox(
    (item) => {
        return item.id;
    },
    (item) => {
        return item.label;
    },
    (item) => {
        console.log(item);
    },
    {
        height: '100px'
    }
);

document.body.appendChild(lst.createElement());
var data = []
for (var i = 0; i < 100; i++) {
    data.push({
        id: i,
        label: i
    })
}
lst.setData(data);

txt = new TextBox();
document.body.appendChild(txt.createElement());
txt.element.addEventListener('keyup', (evt) => {
    lst.setSelection(txt.value());
    console.log(txt.value());
})


const RadioListBox = require('./controls/radio-list-box');

var radlst = new RadioListBox(
    (item) => {
        return item.id;
    },
    (item) => {
        return item.label;
    },
    (item) => {
        console.log(item);
    },
    {
        height: '100px'
    }
);

document.body.appendChild(radlst.createElement());
var data = []
for (var i = 0; i < 100; i++) {
    data.push({
        id: i,
        label: 'LBL' + i
    })
}
radlst.setData(data);

radtxt = new TextBox();
document.body.appendChild(radtxt.createElement());
radtxt.element.addEventListener('keyup', (evt) => {
    radlst.setSelection(radtxt.value());
    console.log(txt.value());
})


//Select *********************************
const Select = require('./controls/select');

sel = new Select(
    (item) => {
        return item.id;
    },
    (item) => {
        return item.label;
    },
    {
        placeholder: 'Modifier'
    }
);

document.body.appendChild(sel.createElement());

sel.setData(data);


const Button = require('./controls/button');

btn = new Button(
    'Select Value',
    (ev) => {
        console.log(sel.value());
    }
)

document.body.appendChild(btn.createElement());


btn = new Button(
    'Set',
    (ev) => {
        sel.setSelection(20);
    }
)
document.body.appendChild(btn.createElement());


//Select Field ************************************

const SelectField = require('./controls/form/select-field');

selF = new SelectField(
    'number',
    (item) => {
        return item.id;
    },
    (item) => {
        return item.label;
    },
    {
        placeholder: 'Modifier',
        label: 'Modifier'
    }
)

document.body.appendChild(selF.createElement());

selF.setData(data);

btn = new Button(
    'Lock',
    (ev) => {
        selF.lock();
    }
)
document.body.appendChild(btn.createElement());

btn = new Button(
    'unlock',
    (ev) => {
        selF.unlock();
    }
)
document.body.appendChild(btn.createElement());

btn = new Button(
    'Set',
    (ev) => {
        selF.setValue(data[10]);
    }
)
document.body.appendChild(btn.createElement());

btn = new Button(
    'Get',
    (ev) => {
        console.log(selF.value());
    }
)
document.body.appendChild(btn.createElement());
*/


//Splitter Windo
/*
const Control = require('./controls/control');
const Splitter = require('./controls/splitter');
const ListBox = require('./controls/list-box');

p01 = new ListBox();
p02 = new ListBox();

p1 = new ListBox(
    (item) => {
        return item.id;
    },
    (item) => {
        return item.label;
    },
    (item) => {
        console.log(item);
    },
);
p2 = new Splitter(p01, p02, {
    pane2Size: '200px',
    direction: 'column',
    resizable: true
})

//p2 = new Control();

spl = new Splitter(p1, p2, {
    pane2Size: '250px',
    //direction: 'column'
    resizable: true
});

document.body.appendChild(spl.createElement());


var data = []
for (var i = 0; i < 100; i++) {
    data.push({
        id: i,
        label: 'LBL' + i
    })
}
p1.setData(data);
p1.element.style.border = 'none';
p1.element.style.borderRadius = '0';

//p2.element.innerHTML = "LoL";
*/


/*
const PatientBrowser = require('./app/panel/patient-browser');

b = new PatientBrowser();

document.body.appendChild(b.createElement());
*/
},{"./app/connection":1,"./app/dialog/login-dialog":2,"./app/logger":3,"./app/panel/patient-browser":4}],26:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

// If obj.hasOwnProperty has been overridden, then calling
// obj.hasOwnProperty(prop) will break.
// See: https://github.com/joyent/node/issues/1707
function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

module.exports = function(qs, sep, eq, options) {
  sep = sep || '&';
  eq = eq || '=';
  var obj = {};

  if (typeof qs !== 'string' || qs.length === 0) {
    return obj;
  }

  var regexp = /\+/g;
  qs = qs.split(sep);

  var maxKeys = 1000;
  if (options && typeof options.maxKeys === 'number') {
    maxKeys = options.maxKeys;
  }

  var len = qs.length;
  // maxKeys <= 0 means that we should not limit keys count
  if (maxKeys > 0 && len > maxKeys) {
    len = maxKeys;
  }

  for (var i = 0; i < len; ++i) {
    var x = qs[i].replace(regexp, '%20'),
        idx = x.indexOf(eq),
        kstr, vstr, k, v;

    if (idx >= 0) {
      kstr = x.substr(0, idx);
      vstr = x.substr(idx + 1);
    } else {
      kstr = x;
      vstr = '';
    }

    k = decodeURIComponent(kstr);
    v = decodeURIComponent(vstr);

    if (!hasOwnProperty(obj, k)) {
      obj[k] = v;
    } else if (isArray(obj[k])) {
      obj[k].push(v);
    } else {
      obj[k] = [obj[k], v];
    }
  }

  return obj;
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

},{}],27:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

var stringifyPrimitive = function(v) {
  switch (typeof v) {
    case 'string':
      return v;

    case 'boolean':
      return v ? 'true' : 'false';

    case 'number':
      return isFinite(v) ? v : '';

    default:
      return '';
  }
};

module.exports = function(obj, sep, eq, name) {
  sep = sep || '&';
  eq = eq || '=';
  if (obj === null) {
    obj = undefined;
  }

  if (typeof obj === 'object') {
    return map(objectKeys(obj), function(k) {
      var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
      if (isArray(obj[k])) {
        return map(obj[k], function(v) {
          return ks + encodeURIComponent(stringifyPrimitive(v));
        }).join(sep);
      } else {
        return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
      }
    }).join(sep);

  }

  if (!name) return '';
  return encodeURIComponent(stringifyPrimitive(name)) + eq +
         encodeURIComponent(stringifyPrimitive(obj));
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

function map (xs, f) {
  if (xs.map) return xs.map(f);
  var res = [];
  for (var i = 0; i < xs.length; i++) {
    res.push(f(xs[i], i));
  }
  return res;
}

var objectKeys = Object.keys || function (obj) {
  var res = [];
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) res.push(key);
  }
  return res;
};

},{}],28:[function(require,module,exports){
'use strict';

exports.decode = exports.parse = require('./decode');
exports.encode = exports.stringify = require('./encode');

},{"./decode":26,"./encode":27}]},{},[25])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3Vzci9saWIvbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvYXBwL2Nvbm5lY3Rpb24uanMiLCJzcmMvYXBwL2RpYWxvZy9sb2dpbi1kaWFsb2cuanMiLCJzcmMvYXBwL2xvZ2dlci5qcyIsInNyYy9hcHAvcGFuZWwvcGF0aWVudC1icm93c2VyLmpzIiwic3JjL2FwcC9wYW5lbC9wYXRpZW50LXBhbmVsLmpzIiwic3JjL2FwcC9zdGF0dXMuanMiLCJzcmMvYXBwL3VzZXIuanMiLCJzcmMvY29udHJvbHMvYnV0dG9uLmpzIiwic3JjL2NvbnRyb2xzL2NvbnRyb2wuanMiLCJzcmMvY29udHJvbHMvZGlhbG9nL2RpYWxvZy5qcyIsInNyYy9jb250cm9scy9kaWFsb2cvZm9ybS1kaWFsb2cuanMiLCJzcmMvY29udHJvbHMvZm9ybS9maWVsZC5qcyIsInNyYy9jb250cm9scy9mb3JtL2Zvcm0uanMiLCJzcmMvY29udHJvbHMvZm9ybS90ZXh0LWZpZWxkLmpzIiwic3JjL2NvbnRyb2xzL2xpc3QtYm94LmpzIiwic3JjL2NvbnRyb2xzL3Jlc291cmNlLWFjY29yZGlvbi1pdGVtLmpzIiwic3JjL2NvbnRyb2xzL3Jlc291cmNlLWFjY29yZGlvbi5qcyIsInNyYy9jb250cm9scy9yZXNvdXJjZS1saXN0LmpzIiwic3JjL2NvbnRyb2xzL3Njcm9sbGVkLmpzIiwic3JjL2NvbnRyb2xzL3NwaW5uZXItZm9yZWdyb3VuZC5qcyIsInNyYy9jb250cm9scy9zcGlubmVyLmpzIiwic3JjL2NvbnRyb2xzL3NwbGl0dGVyLmpzIiwic3JjL2NvbnRyb2xzL3RleHQtYm94LmpzIiwic3JjL2NvbnRyb2xzL3RpbGUuanMiLCJzcmMvaW5kZXguanMiLCIuLi8uLi8uLi8uLi8uLi91c3IvbGliL25vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvcXVlcnlzdHJpbmctZXMzL2RlY29kZS5qcyIsIi4uLy4uLy4uLy4uLy4uL3Vzci9saWIvbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9xdWVyeXN0cmluZy1lczMvZW5jb2RlLmpzIiwiLi4vLi4vLi4vLi4vLi4vdXNyL2xpYi9ub2RlX21vZHVsZXMvd2F0Y2hpZnkvbm9kZV9tb2R1bGVzL3F1ZXJ5c3RyaW5nLWVzMy9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOU1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0dBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbktBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFTQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsImNvbnN0IHN0YXR1cyA9IHJlcXVpcmUoXCIuL3N0YXR1c1wiKVxuY29uc3QgVXNlciA9IHJlcXVpcmUoXCIuL3VzZXJcIilcblxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIENvbm5lY3Rpb24ge1xuICAgIGNvbnN0cnVjdG9yKGxvZ2dlcikge1xuICAgICAgICB0aGlzLmluZGV4X3VybCA9IG51bGxcbiAgICAgICAgdGhpcy5yZXNvdXJjZV9pbmRleCA9IHt9XG4gICAgICAgIHRoaXMudXNlciA9IG51bGw7XG4gICAgICAgIHRoaXMubG9nZ2VyID0gbG9nZ2VyO1xuICAgIH1cblxuXG4gICAgbG9naW4oaW5kZXhfdXJsLCB1c2VybmFtZSwgcGFzc3dvcmQsIG9uX3N1Y2Nlc3MsIG9uX2ZhaWxlZCwgb25fZmluYWxseSkge1xuICAgICAgICB0aGlzLmxvZ2dlci5sb2dfc3Bpbm5lcihgVXNlciAnJHt1c2VybmFtZX0nIGF0dGVtdGluZyB0byBsb2dpbi4uLmApO1xuICAgICAgICB0aGlzLmluZGV4X3VybCA9IGluZGV4X3VybDtcbiAgICAgICAgdGhpcy51c2VyID0gbmV3IFVzZXIoKTtcbiAgICAgICAgdGhpcy51c2VyLmxvZ2luKFxuICAgICAgICAgICAgaW5kZXhfdXJsLFxuICAgICAgICAgICAgdXNlcm5hbWUsXG4gICAgICAgICAgICBwYXNzd29yZCxcbiAgICAgICAgICAgIChyZXNvdXJjZV9pbmRleCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMucmVzb3VyY2VfaW5kZXggPSByZXNvdXJjZV9pbmRleDtcbiAgICAgICAgICAgICAgICBvbl9zdWNjZXNzKCk7XG4gICAgICAgICAgICAgICAgb25fZmluYWxseSAhPSBudWxsID8gb25fZmluYWxseSgpIDogZmFsc2U7XG4gICAgICAgICAgICAgICAgdGhpcy5sb2dnZXIubG9nX3N1Y2Nlc3MoYFVzZXIgJyR7dXNlcm5hbWV9JyBsb2dnZWQgaW4uYCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgKGVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgb25fZmFpbGVkKGVycm9yKTtcbiAgICAgICAgICAgICAgICBvbl9maW5hbGx5ICE9IG51bGwgPyBvbl9maW5hbGx5KCkgOiBmYWxzZTtcbiAgICAgICAgICAgICAgICB0aGlzLmxvZ2dlci5sb2dfZXJyb3IoYExvZ2luIGZhaWxlZCBmb3IgJyR7dXNlcm5hbWV9Jy4gJHtlcnJvci5tZXNzYWdlfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICApXG4gICAgfVxuXG5cbiAgICBsb2dvdXQob25fc3VjY2Vzcywgb25fZmFpbGVkKSB7XG4gICAgICAgIHRoaXMudXNlciA9IG51bGw7XG4gICAgICAgIG9uX3N1Y2Nlc3MoKTtcbiAgICB9XG5cblxuICAgIGlzTG9nZ2VkSW4oKSB7XG4gICAgICAgIGlmICh0aGlzLnVzZXIgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoISh0aGlzLnVzZXIudG9rZW5WYWxpZCgpKSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuXG5cbiAgICBfZ2V0KHVybCwgb25fc3VjY2Vzcywgb25fZmFpbGVkLCBvbl9maW5hbGx5LCByZWZldGNoVG9rZW5PbkZhaWwgPSB0cnVlKSB7XG4gICAgICAgIGxldCBoZWFkZXJzID0gdGhpcy51c2VyLmdldEF1dGhvcml6YXRpb25IZWFkZXJzKCk7XG5cbiAgICAgICAgZmV0Y2godXJsLCB7IG1ldGhvZDogJ0dFVCcsIGhlYWRlcnM6IGhlYWRlcnMgfSlcbiAgICAgICAgICAgIC50aGVuKHN0YXR1cylcbiAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHJlc3BvbnNlLmpzb24oKSlcbiAgICAgICAgICAgIC50aGVuKGRhdGEgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMubG9nZ2VyLmxvZ19zdWNjZXNzKGBHRVQgJHt1cmx9YClcbiAgICAgICAgICAgICAgICBvbl9zdWNjZXNzKGRhdGEpO1xuICAgICAgICAgICAgICAgIG9uX2ZpbmFsbHkgIT0gbnVsbCA/IG9uX2ZpbmFsbHkoKSA6IGZhbHNlO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaChlcnJvciA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHJlZmV0Y2hUb2tlbk9uRmFpbCA/IChlcnJvci5zdGF0dXMgPT0gNDAxKSA6IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudXNlci5nZXRUb2tlbihcbiAgICAgICAgICAgICAgICAgICAgICAgICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9nZXQodXJsLCBvbl9zdWNjZXNzLCBvbl9mYWlsZWQsIG9uX2ZpbmFsbHksIGZhbHNlKVxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIChnZXRUb2tlbkVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2dnZXIubG9nX2Vycm9yKGBHRVQgJHt1cmx9IGZhaWxlZC4gJHtnZXRUb2tlbkVycm9yLm1lc3NhZ2V9YCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25fZmFpbGVkKGdldFRva2VuRXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uX2ZpbmFsbHkgIT0gbnVsbCA/IG9uX2ZpbmFsbHkoKSA6IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubG9nZ2VyLmxvZ19lcnJvcihgR0VUICR7dXJsfSBmYWlsZWQuICR7ZXJyb3IubWVzc2FnZX0uYClcbiAgICAgICAgICAgICAgICAgICAgb25fZmFpbGVkKGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgb25fZmluYWxseSAhPSBudWxsID8gb25fZmluYWxseSgpIDogZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICB9XG5cblxuICAgIGdldCh1cmwsIG9uX3N1Y2Nlc3MsIG9uX2ZhaWxlZCwgb25fZmluYWxseSkge1xuICAgICAgICB0aGlzLmxvZ2dlci5sb2dfc3Bpbm5lcihgR0VUICR7dXJsfS4uLmApXG4gICAgICAgIGlmICh0aGlzLnVzZXIgPT0gbnVsbCkge1xuICAgICAgICAgICAgb25fZmFpbGVkKG5ldyBFcnJvcihcIlVzZXIgbm90IGxvZ2dlZCBpblwiKSk7XG4gICAgICAgICAgICBvbl9maW5hbGx5ICE9IG51bGwgPyBvbl9maW5hbGx5KCkgOiBmYWxzZTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRoaXMudXNlci50b2tlblZhbGlkKCkpIHtcbiAgICAgICAgICAgIHRoaXMudXNlci5nZXRUb2tlbihcbiAgICAgICAgICAgICAgICAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2dldCh1cmwsIG9uX3N1Y2Nlc3MsIG9uX2ZhaWxlZCwgb25fZmluYWxseSlcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIChlcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmxvZ2dlci5sb2dfZXJyb3IoYEdFVCAke3VybH0gZmFpbGVkLiBGYWlsZWQgdG8gcmVuZXcgdG9rZW4uYClcbiAgICAgICAgICAgICAgICAgICAgb25fZmFpbGVkKGVycm9yKVxuICAgICAgICAgICAgICAgICAgICBvbl9maW5hbGx5ICE9IG51bGwgPyBvbl9maW5hbGx5KCkgOiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2dldCh1cmwsIG9uX3N1Y2Nlc3MsIG9uX2ZhaWxlZCwgb25fZmluYWxseSk7XG4gICAgfVxuXG5cbiAgICBwb3N0KHVybCwgcG9zdF9kYXRhLCBvbl9zdWNjZXNzLCBvbl9mYWlsZWQsIG9uX2ZpbmFsbHkpIHtcbiAgICAgICAgdGhpcy5sb2dnZXIubG9nX3NwaW5uZXIoYFBPU1QgJHt1cmx9Li4uYClcbiAgICAgICAgaWYgKHRoaXMudXNlciA9PSBudWxsKSB7XG4gICAgICAgICAgICBvbl9mYWlsZWQobmV3IEVycm9yKFwiVXNlciBub3QgbG9nZ2VkIGluXCIpKTtcbiAgICAgICAgICAgIG9uX2ZpbmFsbHkgIT0gbnVsbCA/IG9uX2ZpbmFsbHkoKSA6IGZhbHNlO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICghdGhpcy51c2VyLnRva2VuVmFsaWQoKSkge1xuICAgICAgICAgICAgdGhpcy51c2VyLmdldFRva2VuKFxuICAgICAgICAgICAgICAgICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcG9zdCh1cmwsIHBvc3RfZGF0YSwgb25fc3VjY2Vzcywgb25fZmFpbGVkLCBvbl9maW5hbGx5KVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgKGVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubG9nZ2VyLmxvZ19lcnJvcihgUE9TVCAke3VybH0gZmFpbGVkLiBGYWlsZWQgdG8gcmVuZXcgdG9rZW4uYClcbiAgICAgICAgICAgICAgICAgICAgb25fZmFpbGVkKGVycm9yKVxuICAgICAgICAgICAgICAgICAgICBvbl9maW5hbGx5ICE9IG51bGwgPyBvbl9maW5hbGx5KCkgOiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3Bvc3QodXJsLCBwb3N0X2RhdGEsIG9uX3N1Y2Nlc3MsIG9uX2ZhaWxlZCwgb25fZmluYWxseSk7XG4gICAgfVxuXG5cbiAgICBfcG9zdCh1cmwsIHBvc3RfZGF0YSwgb25fc3VjY2Vzcywgb25fZmFpbGVkLCBvbl9maW5hbGx5LCByZWZldGNoVG9rZW5PbkZhaWwgPSB0cnVlKSB7XG4gICAgICAgIGxldCBoZWFkZXJzID0gdGhpcy51c2VyLmdldEF1dGhvcml6YXRpb25IZWFkZXJzKCk7XG5cbiAgICAgICAgaGVhZGVycy5zZXQoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XG5cbiAgICAgICAgZmV0Y2godXJsLCB7IG1ldGhvZDogJ1BPU1QnLCBib2R5OiBKU09OLnN0cmluZ2lmeShwb3N0X2RhdGEpLCBoZWFkZXJzOiBoZWFkZXJzIH0pXG4gICAgICAgICAgICAudGhlbihzdGF0dXMpXG4gICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiByZXNwb25zZS5qc29uKCkpXG4gICAgICAgICAgICAudGhlbihkYXRhID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmxvZ2dlci5sb2dfc3VjY2VzcyhgUE9TVCAke3VybH1gKVxuICAgICAgICAgICAgICAgIG9uX3N1Y2Nlc3MoZGF0YSk7XG4gICAgICAgICAgICAgICAgb25fZmluYWxseSAhPSBudWxsID8gb25fZmluYWxseSgpIDogZmFsc2U7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNhdGNoKGVycm9yID0+IHtcbiAgICAgICAgICAgICAgICBpZiAocmVmZXRjaFRva2VuT25GYWlsID8gKGVycm9yLnN0YXR1cyA9PSA0MDEpIDogZmFsc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy51c2VyLmdldFRva2VuKFxuICAgICAgICAgICAgICAgICAgICAgICAgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3Bvc3QodXJsLCBwb3N0X2RhdGEsIG9uX3N1Y2Nlc3MsIG9uX2ZhaWxlZCwgb25fZmluYWxseSwgZmFsc2UpXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgKGdldFRva2VuRXJyb3IpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxvZ2dlci5sb2dfZXJyb3IoYFBPU1QgJHt1cmx9IGZhaWxlZC4gJHtnZXRUb2tlbkVycm9yLm1lc3NhZ2V9YCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25fZmFpbGVkKGdldFRva2VuRXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uX2ZpbmFsbHkgIT0gbnVsbCA/IG9uX2ZpbmFsbHkoKSA6IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubG9nZ2VyLmxvZ19lcnJvcihgUE9TVCAke3VybH0gZmFpbGVkLiAke2Vycm9yLm1lc3NhZ2V9LmApXG4gICAgICAgICAgICAgICAgICAgIG9uX2ZhaWxlZChlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgIG9uX2ZpbmFsbHkgIT0gbnVsbCA/IG9uX2ZpbmFsbHkoKSA6IGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgfVxufSIsImNvbnN0IEZvcm0gPSByZXF1aXJlKCcuLi8uLi9jb250cm9scy9mb3JtL2Zvcm0nKTtcbmNvbnN0IFRleHRGaWVsZCA9IHJlcXVpcmUoJy4uLy4uL2NvbnRyb2xzL2Zvcm0vdGV4dC1maWVsZCcpO1xuY29uc3QgRm9ybURpYWxvZyA9IHJlcXVpcmUoJy4uLy4uL2NvbnRyb2xzL2RpYWxvZy9mb3JtLWRpYWxvZycpO1xuY29uc3QgU3Bpbm5lciA9IHJlcXVpcmUoJy4uLy4uL2NvbnRyb2xzL3NwaW5uZXInKTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIExvZ2luRGlhbG9nIGV4dGVuZHMgRm9ybURpYWxvZyB7XG4gICAgY29uc3RydWN0b3Iob3B0aW9ucz17fSkge1xuICAgICAgICB2YXIgZm9ybSA9IG5ldyBGb3JtKCk7XG5cbiAgICAgICAgZm9ybS5hZGRGaWVsZChuZXcgVGV4dEZpZWxkKFxuICAgICAgICAgICAgJ2luZGV4X3VybCcsXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI6ICdTZXJ2ZXIgVVJMJyxcbiAgICAgICAgICAgICAgICByZXF1aXJlZDogdHJ1ZVxuICAgICAgICAgICAgfVxuICAgICAgICApKTtcbiAgICAgICAgXG4gICAgICAgIGZvcm0uYWRkRmllbGQobmV3IFRleHRGaWVsZChcbiAgICAgICAgICAgICd1c2VybmFtZScsXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI6ICdVc2VybmFtZScsXG4gICAgICAgICAgICAgICAgcmVxdWlyZWQ6IHRydWVcbiAgICAgICAgICAgIH1cbiAgICAgICAgKSk7XG4gICAgICAgIFxuICAgICAgICBmb3JtLmFkZEZpZWxkKG5ldyBUZXh0RmllbGQoXG4gICAgICAgICAgICAncGFzc3dvcmQnLFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyOiAnUGFzc3dvcmQnLFxuICAgICAgICAgICAgICAgIHR5cGU6ICdwYXNzd29yZCcsXG4gICAgICAgICAgICAgICAgcmVxdWlyZWQ6IHRydWVcbiAgICAgICAgICAgIH1cbiAgICAgICAgKSk7XG5cbiAgICAgICAgc3VwZXIoXG4gICAgICAgICAgICBmb3JtLCBcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0aXRsZTogJ0xvZ2luJyxcbiAgICAgICAgICAgICAgICBva0xhYmVsOiAnTG9naW4nLFxuICAgICAgICAgICAgICAgIHdpZHRoOiAnNDAwcHgnLFxuICAgICAgICAgICAgICAgIGNlbnRlcmVkOiB0cnVlXG4gICAgICAgICAgICB9XG4gICAgICAgICk7XG5cbiAgICAgICAgdGhpcy5zcGlubmVyID0gbmV3IFNwaW5uZXIoKTtcblxuICAgICAgICB0aGlzLnN0YXR1c0VsZW1lbnQgPSBudWxsO1xuICAgIH1cblxuXG4gICAgX29uT2soZXYpIHtcbiAgICAgICAgaWYgKHRoaXMuZm9ybS52YWxpZGF0ZSgpID09IGZhbHNlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5vbk9rKHRoaXMudmFsdWUoKSk7XG4gICAgfVxuXG5cbiAgICB0cnlMb2dpbihvblN1Y2Nlc3MsIG9uQ2FuY2VsKSB7XG4gICAgICAgIHRoaXMuc2hvdyhcbiAgICAgICAgICAgIChkYXRhKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5zcGlubmVyLnNob3coKTtcbiAgICAgICAgICAgICAgICBjb25uZWN0aW9uLmxvZ2luKFxuICAgICAgICAgICAgICAgICAgICBkYXRhLmluZGV4X3VybCwgZGF0YS51c2VybmFtZSwgZGF0YS5wYXNzd29yZCxcbiAgICAgICAgICAgICAgICAgICAgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5oaWRlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBvblN1Y2Nlc3MoKTtcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgKGVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXR1c0VsZW1lbnQuaW5uZXJUZXh0ID0gZXJyb3IubWVzc2FnZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZm9ybS5fZmllbGRzWzFdLmZvY3VzKCk7XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc3Bpbm5lci5oaWRlU29mdCgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICgpID0+IHtcbiAgICAgICAgICAgICAgICBvbkNhbmNlbCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICApXG4gICAgfVxuXG5cbiAgICBjcmVhdGVFbGVtZW50KCkge1xuICAgICAgICBzdXBlci5jcmVhdGVFbGVtZW50KCk7XG5cbiAgICAgICAgdGhpcy5oZWFkZXJFbGVtZW50LmFwcGVuZENoaWxkKHRoaXMuc3Bpbm5lci5jcmVhdGVFbGVtZW50KCkpO1xuICAgICAgICB0aGlzLnNwaW5uZXIuaGlkZVNvZnQoKTtcblxuICAgICAgICB0aGlzLnN0YXR1c0VsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgdGhpcy5zdGF0dXNFbGVtZW50LmNsYXNzTmFtZSA9ICdkaWFsb2ctc3RhdHVzJztcbiAgICAgICAgdGhpcy5ib2R5RWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLnN0YXR1c0VsZW1lbnQpO1xuXG4gICAgICAgIHRoaXMuYnRuQ2FuY2VsLmhpZGUoKTtcbiAgICAgICAgdGhpcy5fY2xvc2VFbGVtZW50LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudDtcbiAgICB9XG59IiwiLy9jb25zdCBmZWF0aGVyID0gcmVxdWlyZSgnZmVhdGhlci1pY29ucycpO1xuXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgTG9nZ2VyIHtcbiAgICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgICAgIHRoaXMuc3RhdHVzRWxlbWVudCA9IG51bGw7XG4gICAgfVxuXG4gICAgc2V0VGFyZ2V0KHRhcmdldCkge1xuICAgICAgICB0aGlzLnN0YXR1c0VsZW1lbnQgPSB0YXJnZXQ7XG4gICAgfVxuXG4gICAgbG9nKG1lc3NhZ2UpIHtcbiAgICAgICAgaWYgKHRoaXMuc3RhdHVzRWxlbWVudCA9PSBudWxsKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhtZXNzYWdlKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnN0YXR1c0VsZW1lbnQuaW5uZXJIdG1sID0gbWVzc2FnZTtcbiAgICB9XG5cbiAgICBsb2dfc3Bpbm5lcihtZXNzYWdlKSB7XG4gICAgICAgIGlmICh0aGlzLnN0YXR1c0VsZW1lbnQgPT0gbnVsbCkge1xuICAgICAgICAgICAgLy9jb25zb2xlLmxvZyhtZXNzYWdlKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnN0YXR1c0VsZW1lbnQuaW5uZXJIdG1sID0gbWVzc2FnZTtcbiAgICB9XG5cbiAgICBsb2dfc3VjY2VzcyhtZXNzYWdlKSB7XG4gICAgICAgIGlmICh0aGlzLnN0YXR1c0VsZW1lbnQgPT0gbnVsbCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2cobWVzc2FnZSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zdGF0dXNFbGVtZW50LmlubmVySHRtbCA9IG1lc3NhZ2U7XG4gICAgfVxuXG4gICAgbG9nX2Vycm9yKG1lc3NhZ2UpIHtcbiAgICAgICAgaWYgKHRoaXMuc3RhdHVzRWxlbWVudCA9PSBudWxsKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhtZXNzYWdlKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnN0YXR1c0VsZW1lbnQuaW5uZXJIdG1sID0gbWVzc2FnZTtcbiAgICB9XG59IiwiLy9jb25zdCBxdWVyeVN0cmluZyA9IHJlcXVpcmUoJ3F1ZXJ5LXN0cmluZycpO1xuY29uc3QgcXVlcnlzdHJpbmcgPSByZXF1aXJlKCdxdWVyeXN0cmluZycpO1xuXG5jb25zdCBDb250cm9sID0gcmVxdWlyZSgnLi4vLi4vY29udHJvbHMvY29udHJvbCcpO1xuY29uc3QgVGV4dEJveCA9IHJlcXVpcmUoJy4uLy4uL2NvbnRyb2xzL3RleHQtYm94Jyk7XG4vL2NvbnN0IExpc3RCb3ggPSByZXF1aXJlKCcuLi8uLi9jb250cm9scy9saXN0LWJveCcpO1xuY29uc3QgUmVzb3VyY2VMaXN0ID0gcmVxdWlyZSgnLi4vLi4vY29udHJvbHMvcmVzb3VyY2UtbGlzdCcpO1xuY29uc3QgU3BsaXR0ZXIgPSByZXF1aXJlKCcuLi8uLi9jb250cm9scy9zcGxpdHRlcicpO1xuY29uc3QgUGF0aWVudFBhbmVsID0gcmVxdWlyZSgnLi9wYXRpZW50LXBhbmVsJyk7XG5cblxuXG5jbGFzcyBQYXRpZW50TGlzdCBleHRlbmRzIENvbnRyb2wge1xuICAgIGNvbnN0cnVjdG9yKG9uU2VsZWN0UGF0aWVudCwgb3B0aW9uPXt9KSB7XG4gICAgICAgIHN1cGVyKG9wdGlvbik7XG5cbiAgICAgICAgdGhpcy5zZWFyY2hCb3ggPSBuZXcgVGV4dEJveCh7XG4gICAgICAgICAgICBwbGFjZWhvbGRlcjogJ1NlYXJjaCdcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMucmVzdWx0TGlzdCA9IG5ldyBSZXNvdXJjZUxpc3QoXG4gICAgICAgICAgICAoaXRlbSkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBpdGVtLmlkO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIChpdGVtKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2dldFBhdGllbnRMYWJlbChpdGVtKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAoaXRlbSkgPT4ge1xuICAgICAgICAgICAgICAgIG9uU2VsZWN0UGF0aWVudChpdGVtKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgKVxuICAgIH1cblxuICAgIF9nZXRQYXRpZW50TGFiZWwocGF0aWVudCkge1xuICAgICAgICByZXR1cm4gYFxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cInBhdGllbnQtbGFiZWxcIj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwicGF0aWVudC1pZC1udW1iZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgJHtwYXRpZW50Lm5hdGlvbmFsX2lkX25vfVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJwYXRpZW50LW5hbWVcIj5cbiAgICAgICAgICAgICAgICAgICAgJHtwYXRpZW50Lm5hbWV9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInBhdGllbnQtYWdlXCI+XG4gICAgICAgICAgICAgICAgICAgICR7cGF0aWVudC5hZ2V9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInBhdGllbnQtc2V4XCI+XG4gICAgICAgICAgICAgICAgICAgICR7cGF0aWVudC5zZXh9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgYFxuICAgIH1cblxuICAgIF9zZWFyY2goKSB7XG4gICAgICAgIHRoaXMucmVzdWx0TGlzdC5zZXRSZXNvdXJjZVVybChcbiAgICAgICAgICAgIGNvbm5lY3Rpb24ucmVzb3VyY2VfaW5kZXgucGF0aWVudHMgKyAnPycgKyBxdWVyeXN0cmluZy5zdHJpbmdpZnkoXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAncSc6IHRoaXMuc2VhcmNoQm94LnZhbHVlKClcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApXG4gICAgICAgIClcbiAgICB9XG5cbiAgICBjcmVhdGVFbGVtZW50KCkge1xuICAgICAgICBzdXBlci5jcmVhdGVFbGVtZW50KCk7XG5cbiAgICAgICAgdGhpcy5lbGVtZW50LmNsYXNzTmFtZSA9ICdwYXRpZW50LWxpc3QnO1xuXG4gICAgICAgIHRoaXMuZWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLnNlYXJjaEJveC5jcmVhdGVFbGVtZW50KCkpO1xuXG4gICAgICAgIHRoaXMuZWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLnJlc3VsdExpc3QuY3JlYXRlRWxlbWVudCgpKTtcblxuICAgICAgICB0aGlzLmVsZW1lbnQuc3R5bGUuZGlzcGxheSA9ICdmbGV4JztcbiAgICAgICAgXG4gICAgICAgIHRoaXMuc2VhcmNoQm94LmVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLCAoZXYpID0+IHtcbiAgICAgICAgICAgIHRoaXMuX3NlYXJjaCgpO1xuICAgICAgICB9KVxuXG4gICAgICAgIHRoaXMuX3NlYXJjaCgpO1xuXG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnQ7XG4gICAgfVxufVxuXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgUGF0aWVudEJyb3dzZXIgZXh0ZW5kcyBTcGxpdHRlciB7XG4gICAgY29uc3RydWN0b3Iob3B0aW9ucz17fSkge1xuICAgICAgICB2YXIgcGF0aWVudFBhbmVsID0gbmV3IFBhdGllbnRQYW5lbCgpO1xuICAgICAgICB2YXIgcGF0aWVudExpc3QgPSBuZXcgUGF0aWVudExpc3QoKHBhdGllbnQpID0+IHtcbiAgICAgICAgICAgIHBhdGllbnRQYW5lbC5zZXRQYXRpZW50KHBhdGllbnQpO1xuICAgICAgICB9KTtcblxuICAgICAgICBvcHRpb25zLnBhbmUxU2l6ZSA9ICcyNjBweCc7XG4gICAgICAgIG9wdGlvbnMucmVzaXphYmxlID0gdHJ1ZTtcblxuICAgICAgICBzdXBlcihcbiAgICAgICAgICAgIHBhdGllbnRMaXN0LFxuICAgICAgICAgICAgcGF0aWVudFBhbmVsLFxuICAgICAgICAgICAgb3B0aW9uc1xuICAgICAgICApXG4gICAgfVxuXG4gICAgY3JlYXRlRWxlbWVudCgpIHtcbiAgICAgICAgcmV0dXJuIHN1cGVyLmNyZWF0ZUVsZW1lbnQoKVxuICAgIH1cbn07IiwiY29uc3QgU2Nyb2xsZWQgPSByZXF1aXJlKCcuLi8uLi9jb250cm9scy9zY3JvbGxlZCcpO1xuY29uc3QgVGlsZSA9ICByZXF1aXJlKCcuLi8uLi9jb250cm9scy90aWxlJyk7XG5jb25zdCBSZXNvdXJjZUFjY29yZGlvbiA9IHJlcXVpcmUoJy4uLy4uL2NvbnRyb2xzL3Jlc291cmNlLWFjY29yZGlvbicpO1xuY29uc3QgUmVzb3VyY2VBY2NvcmRpb25JdGVtID0gcmVxdWlyZSgnLi4vLi4vY29udHJvbHMvcmVzb3VyY2UtYWNjb3JkaW9uLWl0ZW0nKTtcblxuXG5cbmNsYXNzIFByb2JsZW1zVGlsZSBleHRlbmRzIFRpbGUge1xuICAgIGNvbnN0cnVjdG9yKG9wdGlvbnM9e30pIHtcbiAgICAgICAgc3VwZXIoJ0RpYWdub3NpcycsIG9wdGlvbnMpO1xuXG4gICAgICAgIHRoaXMucmVzb3VyY2VMaXN0ID0gbmV3IFJlc291cmNlQWNjb3JkaW9uKFxuICAgICAgICAgICAgKGl0ZW0pID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaXRlbS5pZDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBSZXNvdXJjZUFjY29yZGlvbkl0ZW1cbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICBzZXRQYXRpZW50KHBhdGllbnQpIHtcbiAgICAgICAgdGhpcy5yZXNvdXJjZUxpc3Quc2V0UmVzb3VyY2VVcmwocGF0aWVudC5wcm9ibGVtcyk7XG4gICAgfVxuXG4gICAgY3JlYXRlRWxlbWVudCgpIHtcbiAgICAgICAgc3VwZXIuY3JlYXRlRWxlbWVudCgpO1xuXG4gICAgICAgIHRoaXMuX3RpbGVCb2R5RWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLnJlc291cmNlTGlzdC5jcmVhdGVFbGVtZW50KCkpO1xuXG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnRcbiAgICB9XG59XG5cblxuY2xhc3MgQWRtaXNzaW9uc0l0ZW0gZXh0ZW5kcyBSZXNvdXJjZUFjY29yZGlvbkl0ZW0ge1xuICAgIGNvbnN0cnVjdG9yKGl0ZW1EYXRhLCBvcHRpb25zPXt9KSB7XG4gICAgICAgIHN1cGVyKGl0ZW1EYXRhLCBvcHRpb25zKTtcbiAgICB9XG5cbiAgICBkaXNwbGF5UmVzb3VyY2UoKSB7XG4gICAgICAgIHRoaXMuc3RhcnRUaW1lLmlubmVySFRNTCA9IHRoaXMucmVzb3VyY2VEYXRhLnN0YXJ0X3RpbWU7XG4gICAgfVxuXG4gICAgY3JlYXRlSGVhZGVyRWxlbWVudCgpIHtcbiAgICAgICAgc3VwZXIuY3JlYXRlSGVhZGVyRWxlbWVudCgpO1xuXG4gICAgICAgIHRoaXMuaGVhZGVyRWxlbWVudC5pbm5lckhUTUwgPSBgXG4gICAgICAgICAgICA8ZGl2PkFkbWlzc2lvbjwvZGl2PlxuICAgICAgICAgICAgPGRpdj4ke3RoaXMuaXRlbURhdGEuc3RhcnRfdGltZX08L2Rpdj5cbiAgICAgICAgICAgIDxkaXY+JHt0aGlzLml0ZW1EYXRhLmVuZF90aW1lfTwvZGl2PlxuICAgICAgICAgICAgPGRpdj4ke3RoaXMuaXRlbURhdGEucGVyc29ubmVsLm5hbWV9PC9kaXY+XG4gICAgICAgIGA7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuaGVhZGVyRWxlbWVudDtcbiAgICB9XG5cbiAgICBjcmVhdGVCb2R5RWxlbWVudCgpIHtcbiAgICAgICAgc3VwZXIuY3JlYXRlQm9keUVsZW1lbnQoKTtcblxuICAgICAgICB0aGlzLnN0YXJ0VGltZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICB0aGlzLmJvZHlFbGVtZW50LmFwcGVuZENoaWxkKHRoaXMuc3RhcnRUaW1lKTtcblxuICAgICAgICByZXR1cm4gdGhpcy5ib2R5RWxlbWVudDtcbiAgICB9XG59XG5cblxuY2xhc3MgQWRtaXNzaW9uc1RpbGUgZXh0ZW5kcyBUaWxlIHtcbiAgICBjb25zdHJ1Y3RvcihvcHRpb25zPXt9KSB7XG4gICAgICAgIHN1cGVyKCdBZG1pc3Npb25zJywgb3B0aW9ucyk7XG5cbiAgICAgICAgdGhpcy5yZXNvdXJjZUxpc3QgPSBuZXcgUmVzb3VyY2VBY2NvcmRpb24oXG4gICAgICAgICAgICAoaXRlbSkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBpdGVtLmlkO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIEFkbWlzc2lvbnNJdGVtXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgc2V0UGF0aWVudChwYXRpZW50KSB7XG4gICAgICAgIHRoaXMucmVzb3VyY2VMaXN0LnNldFJlc291cmNlVXJsKHBhdGllbnQuYWRtaXNzaW9ucyk7XG4gICAgfVxuXG4gICAgY3JlYXRlRWxlbWVudCgpIHtcbiAgICAgICAgc3VwZXIuY3JlYXRlRWxlbWVudCgpO1xuXG4gICAgICAgIHRoaXMuX3RpbGVCb2R5RWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLnJlc291cmNlTGlzdC5jcmVhdGVFbGVtZW50KCkpO1xuXG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnRcbiAgICB9XG59XG5cblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBQYXRpZW50UGFuZWwgZXh0ZW5kcyBTY3JvbGxlZCB7XG4gICAgY29uc3RydWN0b3Iob3B0aW9ucz17fSkge1xuICAgICAgICBzdXBlcihvcHRpb25zKVxuXG4gICAgICAgIHRoaXMucGF0aWVudCA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5wcm9ibGVtc1RpbGUgPSBuZXcgUHJvYmxlbXNUaWxlKCk7XG4gICAgICAgIHRoaXMuYWRtaXNzaW9uc1RpbGUgPSBuZXcgQWRtaXNzaW9uc1RpbGUoKTtcbiAgICB9XG5cbiAgICBfc2V0UGF0aWVudChwYXRpZW50KSB7XG4gICAgICAgIHRoaXMucGF0aWVudCA9IHBhdGllbnQ7XG5cbiAgICAgICAgdGhpcy5faWROdW1iZXJFbGVtZW50LmlubmVySFRNTCA9IFwiTklDIE5vLjogXCIgKyBwYXRpZW50Lm5hdGlvbmFsX2lkX25vO1xuICAgICAgICB0aGlzLl9ob3NwTnVtYmVyRWxlbWVudC5pbm5lckhUTUwgPSBcIiwgSG9zcGl0YWwgTm8uOiBcIiArcGF0aWVudC5ob3NwaXRhbF9ubztcbiAgICAgICAgdGhpcy5fcGhvbmVOdW1iZXJFbGVtZW50LmlubmVySFRNTCA9IFwiLCBQaG9uZSBOby46IFwiICtwYXRpZW50LnBob25lX25vO1xuICAgICAgICB0aGlzLl9uYW1lRWxlbWVudC5pbm5lckhUTUwgPSBwYXRpZW50Lm5hbWU7XG4gICAgICAgIHRoaXMuX2FnZVNleEVsZW1lbnQuaW5uZXJIVE1MID0gcGF0aWVudC5hZ2UgKyBcIi9cIiArIHBhdGllbnQuc2V4O1xuXG4gICAgICAgIHRoaXMuX2hlYWRlckVsZW1lbnQuc3R5bGUuZGlzcGxheSA9ICdmbGV4JztcbiAgICAgICAgdGhpcy5fYm9keUVsZW1lbnQuc3R5bGUuZGlzcGxheSA9ICdmbGV4JztcblxuICAgICAgICB0aGlzLnByb2JsZW1zVGlsZS5zZXRQYXRpZW50KHBhdGllbnQpO1xuICAgICAgICB0aGlzLmFkbWlzc2lvbnNUaWxlLnNldFBhdGllbnQocGF0aWVudCk7XG4gICAgfVxuXG4gICAgc2V0UGF0aWVudChwYXRpZW50KSB7XG4gICAgICAgIHRoaXMuX2lkTnVtYmVyRWxlbWVudC5pbm5lckhUTUwgPSBcIk5JQyBOby46IFwiICsgcGF0aWVudC5uYXRpb25hbF9pZF9ubztcbiAgICAgICAgdGhpcy5faG9zcE51bWJlckVsZW1lbnQuaW5uZXJIVE1MID0gXCIsIEhvc3BpdGFsIE5vLjogXCIgK3BhdGllbnQuaG9zcGl0YWxfbm87XG4gICAgICAgIHRoaXMuX3Bob25lTnVtYmVyRWxlbWVudC5pbm5lckhUTUwgPSBcIlwiO1xuICAgICAgICB0aGlzLl9uYW1lRWxlbWVudC5pbm5lckhUTUwgPSBwYXRpZW50Lm5hbWU7XG4gICAgICAgIHRoaXMuX2FnZVNleEVsZW1lbnQuaW5uZXJIVE1MID0gcGF0aWVudC5hZ2UgKyBcIi9cIiArIHBhdGllbnQuc2V4O1xuICAgICAgICBcbiAgICAgICAgdGhpcy5fYm9keUVsZW1lbnQuc3R5bGUuZGlzcGxheSA9ICdub25lJztcblxuICAgICAgICBjb25uZWN0aW9uLmdldChcbiAgICAgICAgICAgIHBhdGllbnQudXJsLFxuICAgICAgICAgICAgcGF0aWVudCA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5fc2V0UGF0aWVudChwYXRpZW50KVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIChlcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycm9yKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAoKSA9PiB7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICB9XG4gICAgICAgIClcbiAgICB9XG5cbiAgICBjcmVhdGVFbGVtZW50KCkge1xuICAgICAgICBzdXBlci5jcmVhdGVFbGVtZW50KCk7XG5cbiAgICAgICAgXG4gICAgICAgIHRoaXMuZWxlbWVudC5jbGFzc05hbWUgPSAncGF0aWVudC1wYW5lbCc7XG4gICAgICAgIHRoaXMuZWxlbWVudC5zdHlsZS5mbGV4RGlyZWN0aW9uID0gJ2NvbHVtbic7XG5cbiAgICAgICAgdGhpcy5faGVhZGVyRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICB0aGlzLl9oZWFkZXJFbGVtZW50LmNsYXNzTmFtZSA9ICdoZWFkZXInO1xuICAgICAgICB0aGlzLl9oZWFkZXJFbGVtZW50LnN0eWxlLmZsZXhEaXJlY3Rpb24gPSAnY29sdW1uJztcbiAgICAgICAgdGhpcy5lbGVtZW50LmFwcGVuZENoaWxkKHRoaXMuX2hlYWRlckVsZW1lbnQpO1xuXG4gICAgICAgIHZhciBkZXRhaWxzRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG4gICAgICAgIGRldGFpbHNFbGVtZW50LnN0eWxlLmRpc3BsYXkgPSAnZmxleCc7XG4gICAgICAgIGRldGFpbHNFbGVtZW50LnN0eWxlLmZsZXhEaXJlY3Rpb24gPSAncm93JztcbiAgICAgICAgZGV0YWlsc0VsZW1lbnQuc3R5bGUuYWxpZ25JdGVtcyA9ICdiYXNlbGluZSc7XG4gICAgICAgIHRoaXMuX2hlYWRlckVsZW1lbnQuYXBwZW5kQ2hpbGQoZGV0YWlsc0VsZW1lbnQpO1xuXG4gICAgICAgIHRoaXMuX25hbWVFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaDEnKTtcbiAgICAgICAgZGV0YWlsc0VsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5fbmFtZUVsZW1lbnQpO1xuXG4gICAgICAgIHRoaXMuX2FnZVNleEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgICAgIGRldGFpbHNFbGVtZW50LmFwcGVuZENoaWxkKHRoaXMuX2FnZVNleEVsZW1lbnQpO1xuXG4gICAgICAgIHZhciBudW1iZXJFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIG51bWJlckVsZW1lbnQuY2xhc3NOYW1lID0gJ251bWJlcic7XG4gICAgICAgIG51bWJlckVsZW1lbnQuc3R5bGUuZGlzcGxheSA9ICdmbGV4JztcbiAgICAgICAgbnVtYmVyRWxlbWVudC5zdHlsZS5mbGV4RGlyZWN0aW9uID0gJ3Jvdyc7XG4gICAgICAgIHRoaXMuX2hlYWRlckVsZW1lbnQuYXBwZW5kQ2hpbGQobnVtYmVyRWxlbWVudCk7XG5cbiAgICAgICAgdGhpcy5faWROdW1iZXJFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIG51bWJlckVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5faWROdW1iZXJFbGVtZW50KTtcblxuICAgICAgICB0aGlzLl9ob3NwTnVtYmVyRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICBudW1iZXJFbGVtZW50LmFwcGVuZENoaWxkKHRoaXMuX2hvc3BOdW1iZXJFbGVtZW50KTtcblxuICAgICAgICB0aGlzLl9waG9uZU51bWJlckVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgbnVtYmVyRWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLl9waG9uZU51bWJlckVsZW1lbnQpO1xuXG4gICAgICAgIHRoaXMuX2JvZHlFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIHRoaXMuX2JvZHlFbGVtZW50LmNsYXNzTmFtZSA9ICdib2R5JztcbiAgICAgICAgdGhpcy5fYm9keUVsZW1lbnQuc3R5bGUuZmxleERpcmVjdGlvbiA9ICdjb2x1bW4nO1xuICAgICAgICB0aGlzLmVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5fYm9keUVsZW1lbnQpO1xuXG4gICAgICAgIC8qXG4gICAgICAgIHRoaXMuX3Byb2JsZW1zRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICB0aGlzLl9wcm9ibGVtc0VsZW1lbnQuY2xhc3NMaXN0ID0gJ3RpbGUgcHJvYmxlbXMnXG4gICAgICAgIHRoaXMuX3Byb2JsZW1zRWxlbWVudC5pbm5lckhUTUwgPSAnPGgxPlByb2JsZW1zPC9oMT48ZGl2IGNsYXNzPVwidGlsZS1ib2R5XCI+UHJvYmxlbXM8YnI+UHJvYmxlbXM8YnI+UHJvYmxlbXM8YnI+PC9kaXY+J1xuICAgICAgICB0aGlzLl9ib2R5RWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLl9wcm9ibGVtc0VsZW1lbnQpXG5cbiAgICAgICAgdGhpcy5fYWRtaXNzaW9uc0VsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgdGhpcy5fYWRtaXNzaW9uc0VsZW1lbnQuY2xhc3NMaXN0ID0gJ3RpbGUgYWRtaXNzaW9ucydcbiAgICAgICAgdGhpcy5fYWRtaXNzaW9uc0VsZW1lbnQuaW5uZXJIVE1MID0gJzxoMT5BZG1pc3Npb25zPC9oMT48ZGl2IGNsYXNzPVwidGlsZS1ib2R5XCI+QWRtaXNzaW9uczxicj5BZG1pc3Npb25zPGJyPkFkbWlzc2lvbnM8YnI+PC9kaXY+J1xuICAgICAgICB0aGlzLl9ib2R5RWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLl9hZG1pc3Npb25zRWxlbWVudClcbiAgICAgICAgKi9cblxuICAgICAgICB0aGlzLl9ib2R5RWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLnByb2JsZW1zVGlsZS5jcmVhdGVFbGVtZW50KCkpO1xuICAgICAgICB0aGlzLl9ib2R5RWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLmFkbWlzc2lvbnNUaWxlLmNyZWF0ZUVsZW1lbnQoKSk7XG5cbiAgICAgICAgdGhpcy5faGVhZGVyRWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICB0aGlzLl9ib2R5RWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudDtcbiAgICB9XG5cbn0iLCJjbGFzcyBSZXNwb25zZUVycm9yIGV4dGVuZHMgRXJyb3Ige1xuXHRjb25zdHJ1Y3RvcihyZXNwb25zZSkge1xuXHRcdHZhciBtZXNzYWdlID0gYFJlc3BvbnNlIEVycm9yICR7cmVzcG9uc2Uuc3RhdHVzfSAke3Jlc3BvbnNlLnN0YXR1c1RleHR9YDtcblx0XHRzdXBlcihtZXNzYWdlKTtcblx0XHR0aGlzLnN0YXR1cyA9IHJlc3BvbnNlLnN0YXR1cztcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHN0YXR1cyhyZXNwb25zZSkge1xuXHRpZiAoIXJlc3BvbnNlLm9rKSB7XG5cdFx0cmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBSZXNwb25zZUVycm9yKHJlc3BvbnNlKSk7XG5cdH1cblx0cmV0dXJuIFByb21pc2UucmVzb2x2ZShyZXNwb25zZSk7XG59XG4iLCJjb25zdCBzdGF0dXMgPSByZXF1aXJlKFwiLi9zdGF0dXNcIik7XG5cblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBVc2VyIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy51c2VybmFtZSA9IG51bGw7XG4gICAgICAgIHRoaXMuZnVsbG5hbWUgPSBudWxsXG4gICAgICAgIHRoaXMucGFzc3dvcmQgPSBudWxsO1xuICAgICAgICB0aGlzLnRva2VuID0gbnVsbDtcbiAgICAgICAgdGhpcy50b2tlbl9leHBpcmVfdGltZSA9IG51bGw7XG4gICAgICAgIHRoaXMudXJsID0gbnVsbDtcbiAgICAgICAgdGhpcy50b2tlbl91cmwgPSBudWxsO1xuICAgIH1cblxuXG4gICAgdG9rZW5WYWxpZCgpIHtcbiAgICAgICAgaWYgKHRoaXMudG9rZW4gPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoKG5ldyBEYXRlKCkuZ2V0VGltZSgpIC8gMTAwMCkgPiB0aGlzLnRva2VuX2V4cGlyZV90aW1lKSB7XG4gICAgICAgICAgICB0aGlzLnRva2VuID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMudG9rZW5fZXhwaXJlX3RpbWUgPSBudWxsO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIGdldE5hbWUoKSB7XG4gICAgICAgIGlmICh0aGlzLmZ1bGxuYW1lID09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnVzZXJuYW1lO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLmZ1bGxuYW1lO1xuICAgIH1cblxuXG4gICAgZ2V0VG9rZW4ob25fc3VjY2Vzcywgb25fZmFpbGVkKSB7XG4gICAgICAgIGxldCBoZWFkZXJzID0gbmV3IEhlYWRlcnMoKTtcbiAgICAgICAgaGVhZGVycy5zZXQoXG4gICAgICAgICAgICAnQXV0aG9yaXphdGlvbicsXG4gICAgICAgICAgICAnQmFzaWMgJyArIGJ0b2EodGhpcy51c2VybmFtZSArIFwiOlwiICsgdGhpcy5wYXNzd29yZClcbiAgICAgICAgKTtcblxuICAgICAgICBmZXRjaCh0aGlzLnRva2VuX3VybCwgeyBtZXRob2Q6ICdHRVQnLCBoZWFkZXJzOiBoZWFkZXJzIH0pXG4gICAgICAgICAgICAudGhlbihzdGF0dXMpXG4gICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiByZXNwb25zZS5qc29uKCkpXG4gICAgICAgICAgICAudGhlbihkYXRhID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLnRva2VuID0gZGF0YVsndG9rZW4nXTtcbiAgICAgICAgICAgICAgICB0aGlzLnRva2VuX2V4cGlyZV90aW1lID0gKG5ldyBEYXRlKCkuZ2V0VGltZSgpIC8gMTAwMCkgKyBkYXRhWydleHBpcmF0aW9uJ107XG4gICAgICAgICAgICAgICAgb25fc3VjY2VzcygpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaChlcnJvciA9PiB7XG4gICAgICAgICAgICAgICAgb25fZmFpbGVkKG5ldyBFcnJvcihgRmFpbGVkIHRvIGdldCB0b2tlbiwgJHtlcnJvci5tZXNzYWdlfS5gKSk7XG4gICAgICAgICAgICB9KVxuICAgIH1cblxuXG4gICAgZ2V0QXV0aG9yaXphdGlvbkhlYWRlcnMoKSB7XG4gICAgICAgIGxldCBoZWFkZXJzID0gbmV3IEhlYWRlcnMoKTtcbiAgICAgICAgaGVhZGVycy5zZXQoXG4gICAgICAgICAgICAnQXV0aG9yaXphdGlvbicsXG4gICAgICAgICAgICAnQmFzaWMgJyArIGJ0b2EodGhpcy50b2tlbiArIFwiOlwiKVxuICAgICAgICApO1xuICAgICAgICByZXR1cm4gaGVhZGVycztcbiAgICB9XG5cblxuICAgIGdldFVzZXJEYXRhKG9uX3N1Y2Nlc3MsIG9uX2ZhaWxlZCkge1xuICAgICAgICBsZXQgaGVhZGVycyA9IHRoaXMuZ2V0QXV0aG9yaXphdGlvbkhlYWRlcnMoKTtcblxuICAgICAgICBmZXRjaCh0aGlzLnVybCwgeyBtZXRob2Q6ICdHRVQnLCBoZWFkZXJzOiBoZWFkZXJzIH0pXG4gICAgICAgICAgICAudGhlbihzdGF0dXMpXG4gICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiByZXNwb25zZS5qc29uKCkpXG4gICAgICAgICAgICAudGhlbihkYXRhID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmZ1bGxuYW1lID0gZGF0YS5mdWxsbmFtZTtcbiAgICAgICAgICAgICAgICBvbl9zdWNjZXNzKCk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNhdGNoKGVycm9yID0+IHtcbiAgICAgICAgICAgICAgICBvbl9mYWlsZWQobmV3IEVycm9yKGBGYWlsZWQgdG8gZ2V0IHVzZXIgZGF0YS4gJHtlcnJvci5tZXNzYWdlfWApKTtcbiAgICAgICAgICAgIH0pXG4gICAgfVxuXG5cbiAgICBsb2dpbihpbmRleF91cmwsIHVzZXJuYW1lLCBwYXNzd29yZCwgb25fc3VjY2Vzcywgb25fZmFpbGVkKSB7XG4gICAgICAgIHRoaXMudXNlcm5hbWUgPSB1c2VybmFtZTtcbiAgICAgICAgdGhpcy5wYXNzd29yZCA9IHBhc3N3b3JkO1xuXG4gICAgICAgIGxldCBoZWFkZXJzID0gbmV3IEhlYWRlcnMoKTtcbiAgICAgICAgaGVhZGVycy5zZXQoXG4gICAgICAgICAgICAnQXV0aG9yaXphdGlvbicsXG4gICAgICAgICAgICAnQmFzaWMgJyArIGJ0b2EodGhpcy51c2VybmFtZSArIFwiOlwiICsgdGhpcy5wYXNzd29yZClcbiAgICAgICAgKTtcblxuICAgICAgICBmdW5jdGlvbiBjaGVja0NyZWRlbnRpYWxzKGRhdGEpIHtcbiAgICAgICAgICAgIGlmICghKFwiYXV0aF90b2tlblwiIGluIGRhdGEpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcihcIlVuZXhwZWN0ZWQgZGF0YS5cIikpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShkYXRhKVxuICAgICAgICB9XG5cbiAgICAgICAgZmV0Y2goaW5kZXhfdXJsLCB7IG1ldGhvZDogJ0dFVCcsIGhlYWRlcnM6IGhlYWRlcnMgfSlcbiAgICAgICAgICAgIC50aGVuKHN0YXR1cylcbiAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHJlc3BvbnNlLmpzb24oKSlcbiAgICAgICAgICAgIC50aGVuKGRhdGEgPT4gY2hlY2tDcmVkZW50aWFscyhkYXRhKSlcbiAgICAgICAgICAgIC50aGVuKHJlc291cmNlX2luZGV4ID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLnRva2VuX3VybCA9IHJlc291cmNlX2luZGV4WydhdXRoX3Rva2VuJ107XG4gICAgICAgICAgICAgICAgdGhpcy5nZXRUb2tlbihcbiAgICAgICAgICAgICAgICAgICAgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy51cmwgPSByZXNvdXJjZV9pbmRleFsndXNlciddO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5nZXRVc2VyRGF0YShcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uX3N1Y2Nlc3MocmVzb3VyY2VfaW5kZXgpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25fZmFpbGVkXG4gICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBvbl9mYWlsZWRcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaCgoZXJyb3IpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyb3Iuc3RhdHVzID09IDQwMSkge1xuICAgICAgICAgICAgICAgICAgICBvbl9mYWlsZWQobmV3IEVycm9yKCdJbnZhbGlkIFVzZXJuYW1lIG9yIFBhc3N3b3JkJykpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG9uX2ZhaWxlZChuZXcgRXJyb3IoYExvZ2luIGVycm9yLiAke2Vycm9yLm1lc3NhZ2V9YCkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgfVxufSIsImNvbnN0IENvbnRyb2wgPSByZXF1aXJlKFwiLi9jb250cm9sXCIpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIEJ1dHRvbiBleHRlbmRzIENvbnRyb2wge1xuICAgIGNvbnN0cnVjdG9yKGxhYmVsLCBvbkNsaWNrLCBvcHRpb25zKSB7XG4gICAgICAgIHN1cGVyKG9wdGlvbnMpO1xuICAgICAgICB0aGlzLmxhYmVsID0gbGFiZWw7XG4gICAgICAgIHRoaXMub25DbGljayA9IG9uQ2xpY2s7XG4gICAgfVxuXG4gICAgY3JlYXRlRWxlbWVudCgpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnV0dG9uJyk7XG4gICAgICAgIHRoaXMuZWxlbWVudC5zdHlsZS5taW5XaWR0aCA9IHRoaXMub3B0aW9ucy53aWR0aDtcbiAgICAgICAgdGhpcy5lbGVtZW50LnN0eWxlLm1pbkhlaWdodCA9IHRoaXMub3B0aW9ucy5oZWlnaHQ7XG4gICAgICAgIFxuICAgICAgICB0aGlzLmVsZW1lbnQuaW5uZXJIVE1MID0gdGhpcy5sYWJlbDtcblxuICAgICAgICB0aGlzLmVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZXYpID0+IHtcbiAgICAgICAgICAgIGV2LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB0aGlzLm9uQ2xpY2soZXYpO1xuICAgICAgICB9KVxuXG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnRcbiAgICB9XG5cbn1cbiIsIlxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBDb250cm9sIHtcbiAgICBjb25zdHJ1Y3RvcihvcHRpb25zID0ge30pIHtcbiAgICAgICAgLyogT3B0aW9uc1xuICAgICAgICAgKiAgd2lkaHQsIGhlaWdodCA9ICBjc3Mgc2l6ZVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5lbGVtZW50ID0gbnVsbDtcbiAgICAgICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgICB9XG5cbiAgICBmb2N1cygpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50LmZvY3VzKCk7XG4gICAgfVxuXG4gICAgcmVtb3ZlRWxlbWVudCgpIHtcbiAgICAgICAgaWYgKHRoaXMuZWxlbWVudCA9PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICBwYXJlbnQgPSB0aGlzLmVsZW1lbnQucGFyZW50RWxlbWVudFxuXG4gICAgICAgIGlmIChwYXJlbnQgPT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cblxuICAgICAgICBwYXJlbnQucmVtb3ZlQ2hpbGQodGhpcy5lbGVtZW50KTtcbiAgICB9XG5cbiAgICBjcmVhdGVFbGVtZW50KCkge1xuICAgICAgICAvL0NyZWF0ZSB0aGUgZWxlbWVudFxuICAgICAgICB0aGlzLmVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblxuICAgICAgICAvL0FkZCBzdHlsZXNcbiAgICAgICAgdGhpcy5lbGVtZW50LnN0eWxlLmRpc3BsYXkgPSBcImZsZXhcIjtcbiAgICAgICAgdGhpcy5lbGVtZW50LnN0eWxlLnVzZXJTZWxlY3QgPSBcIm5vbmVcIjtcbiAgICAgICAgdGhpcy5lbGVtZW50LnN0eWxlLndpZHRoID0gdGhpcy5vcHRpb25zLndpZHRoO1xuICAgICAgICB0aGlzLmVsZW1lbnQuc3R5bGUuaGVpZ2h0ID0gdGhpcy5vcHRpb25zLmhlaWdodDtcblxuICAgICAgICAvL0F0dGFjaGUgZXZlbnRzXG5cbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudDtcbiAgICB9XG5cbiAgICBoaWRlU29mdCgpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50LnN0eWxlLnZpc2liaWxpdHkgPSAnaGlkZGVuJztcbiAgICB9XG5cbiAgICBoaWRlKCkge1xuICAgICAgICB0aGlzLmVsZW1lbnQuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgIH1cblxuICAgIHNob3coZGlzcGxheSA9ICdmbGV4Jykge1xuICAgICAgICB0aGlzLmVsZW1lbnQuc3R5bGUuZGlzcGxheSA9IGRpc3BsYXk7XG4gICAgICAgIHRoaXMuZWxlbWVudC5zdHlsZS52aXNpYmlsaXR5ID0gJyc7XG4gICAgfVxufVxuIiwiY29uc3QgQ29udHJvbCA9IHJlcXVpcmUoXCIuLi9jb250cm9sXCIpO1xuXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgRGlhbG9nIGV4dGVuZHMgQ29udHJvbCB7XG4gICAgY29uc3RydWN0b3Iob3B0aW9ucz17fSkge1xuICAgICAgICAvKiBPcHRpb25zXG4gICAgICAgICAqICBjZW50ZXJlZD1mYWxzZVxuICAgICAgICAgKi9cbiAgICAgICAgc3VwZXIob3B0aW9ucyk7XG5cbiAgICAgICAgdGhpcy5vbkNhbmNlbCA9IG51bGw7XG4gICAgICAgIHRoaXMub25PayA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5oZWFkZXJFbGVtZW50ID0gbnVsbDtcbiAgICAgICAgdGhpcy5ib2R5RWxlbWVudCA9IG51bGw7XG4gICAgICAgIHRoaXMuZm9vdGVyRWxlbWVudCA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5fZGlhbG9nRWxlbWVudCA9IG51bGw7XG4gICAgICAgIHRoaXMuX2Nsb3NlRWxlbWVudCA9IG51bGw7XG4gICAgfVxuXG4gICAgdmFsdWUoKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHNob3cob25Paywgb25DYW5jZWwpIHtcbiAgICAgICAgdGhpcy5vbk9rID0gb25PaztcbiAgICAgICAgdGhpcy5vbkNhbmNlbCA9IG9uQ2FuY2VsO1xuXG4gICAgICAgIHN1cGVyLnNob3coKTtcbiAgICB9XG5cbiAgICBfb25DYW5jZWwoZXYpIHtcbiAgICAgICAgdGhpcy5oaWRlKCk7XG4gICAgICAgIHRoaXMub25DYW5jZWwoKTtcbiAgICB9XG5cbiAgICBfb25Payhldikge1xuICAgICAgICB0aGlzLmhpZGUoKTtcbiAgICAgICAgdGhpcy5vbk9rKHRoaXMudmFsdWUoKSk7XG4gICAgfVxuXG4gICAgY3JlYXRlRWxlbWVudCgpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5jZW50ZXJlZCA9PSB0cnVlKXtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5jbGFzc05hbWUgPSAnZm9yZWdyb3VuZC1jZW50ZXJlZCc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQuY2xhc3NOYW1lID0gJ2ZvcmVncm91bmQnO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fZGlhbG9nRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICB0aGlzLl9kaWFsb2dFbGVtZW50LmNsYXNzTmFtZSA9ICdkaWFsb2cnO1xuICAgICAgICB0aGlzLl9kaWFsb2dFbGVtZW50LnN0eWxlLnVzZXJTZWxlY3QgPSBcIm5vbmVcIjtcbiAgICAgICAgdGhpcy5fZGlhbG9nRWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gXCJmbGV4XCI7XG4gICAgICAgIHRoaXMuX2RpYWxvZ0VsZW1lbnQuc3R5bGUuZmxleERpcmVjdGlvbiA9IFwiY29sdW1uXCJcbiAgICAgICAgdGhpcy5fZGlhbG9nRWxlbWVudC5zdHlsZS53aWR0aCA9IHRoaXMub3B0aW9ucy53aWR0aDtcbiAgICAgICAgdGhpcy5fZGlhbG9nRWxlbWVudC5zdHlsZS5oZWlnaHQgPSB0aGlzLm9wdGlvbnMuaGVpZ2h0O1xuICAgICAgICB0aGlzLmVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5fZGlhbG9nRWxlbWVudCk7XG5cbiAgICAgICAgdmFyIGhlYWRlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICBoZWFkZXIuY2xhc3NOYW1lID0gJ2RpYWxvZy1oZWFkZXInO1xuICAgICAgICBoZWFkZXIuc3R5bGUuZGlzcGxheSA9ICdmbGV4JztcbiAgICAgICAgLy9oZWFkZXIuc3R5bGUuZmxleERpcmVjdGlvbiA9ICdyb3cnO1xuICAgICAgICB0aGlzLl9kaWFsb2dFbGVtZW50LmFwcGVuZENoaWxkKGhlYWRlcik7XG4gICAgICAgIFxuICAgICAgICB0aGlzLmhlYWRlckVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgdGhpcy5oZWFkZXJFbGVtZW50LnN0eWxlLmRpc3BsYXkgPSAnZmxleCc7XG4gICAgICAgIHRoaXMuaGVhZGVyRWxlbWVudC5zdHlsZS5mbGV4R3JvdyA9IDE7XG4gICAgICAgIGhlYWRlci5hcHBlbmRDaGlsZCh0aGlzLmhlYWRlckVsZW1lbnQpO1xuXG4gICAgICAgIHRoaXMuX2Nsb3NlRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICB0aGlzLl9jbG9zZUVsZW1lbnQuY2xhc3NOYW1lID0gJ2RpYWxvZy1jbG9zZSc7XG4gICAgICAgIHRoaXMuX2Nsb3NlRWxlbWVudC5pbm5lckhUTUwgPSAnJnRpbWVzOydcbiAgICAgICAgaGVhZGVyLmFwcGVuZENoaWxkKHRoaXMuX2Nsb3NlRWxlbWVudCk7XG5cbiAgICAgICAgdGhpcy5ib2R5RWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICB0aGlzLmJvZHlFbGVtZW50LmNsYXNzTmFtZSA9ICdkaWFsb2ctYm9keSc7XG4gICAgICAgIHRoaXMuYm9keUVsZW1lbnQuc3R5bGUuZmxleEdyb3cgPSAxO1xuICAgICAgICB0aGlzLl9kaWFsb2dFbGVtZW50LmFwcGVuZENoaWxkKHRoaXMuYm9keUVsZW1lbnQpO1xuXG4gICAgICAgIHRoaXMuZm9vdGVyRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICB0aGlzLmZvb3RlckVsZW1lbnQuY2xhc3NOYW1lID0gJ2RpYWxvZy1mb290ZXInO1xuICAgICAgICB0aGlzLl9kaWFsb2dFbGVtZW50LmFwcGVuZENoaWxkKHRoaXMuZm9vdGVyRWxlbWVudCk7XG5cbiAgICAgICAgdGhpcy5oaWRlKCk7XG5cbiAgICAgICAgdGhpcy5lbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGV2KSA9PiB7XG4gICAgICAgICAgICAvL3RoaXMuX29uQ2FuY2VsKCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuX2RpYWxvZ0VsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZXYpID0+IHtcbiAgICAgICAgICAgIDtcbiAgICAgICAgfSlcblxuICAgICAgICB0aGlzLl9jbG9zZUVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZXYpID0+IHtcbiAgICAgICAgICAgIHRoaXMuX29uQ2FuY2VsKCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMudGl0bGUgIT0gbnVsbCkge1xuICAgICAgICAgICAgdmFyIHRpdGxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaDEnKTtcbiAgICAgICAgICAgIHRpdGxlLmlubmVyVGV4dCA9IHRoaXMub3B0aW9ucy50aXRsZTtcbiAgICAgICAgICAgIHRoaXMuaGVhZGVyRWxlbWVudC5hcHBlbmRDaGlsZCh0aXRsZSk7XG4gICAgICAgIH1cblxuICAgICAgICAvL3RoaXMuYm9keUVsZW1lbnQuaW5uZXJIVE1MID0gJ1NvbWUgc2hpdCB0aGF0IGlzIGluIGEgZGlhbG9nIGlzIGhlcmUgbm93JztcbiAgICAgICAgLy90aGlzLmZvb3RlckVsZW1lbnQuaW5uZXJUZXh0ID0gJ1RoaXMgaXMgdGhlIGZvb3RlcidcblxuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50O1xuICAgIH1cblxufSIsImNvbnN0IERpYWxvZyA9IHJlcXVpcmUoXCIuL2RpYWxvZ1wiKTtcbmNvbnN0IEJ1dHRvbiA9IHJlcXVpcmUoXCIuLi9idXR0b25cIik7XG5cblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBGb3JtRGlhbG9nIGV4dGVuZHMgRGlhbG9nIHtcbiAgICBjb25zdHJ1Y3Rvcihmb3JtLCBvcHRpb25zPXt9KSB7XG4gICAgICAgIHN1cGVyKG9wdGlvbnMpXG5cbiAgICAgICAgdGhpcy5mb3JtID0gZm9ybTtcblxuICAgICAgICB0aGlzLmJ0bk9rID0gbmV3IEJ1dHRvbihcbiAgICAgICAgICAgIG9wdGlvbnMub2tMYWJlbCAhPSBudWxsID8gb3B0aW9ucy5va0xhYmVsIDogJ09rJyxcbiAgICAgICAgICAgIChldikgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuX29uT2soZXYpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB3aWR0aDogJzgwcHgnXG4gICAgICAgICAgICB9XG4gICAgICAgICk7XG5cbiAgICAgICAgdGhpcy5idG5DYW5jZWwgPSBuZXcgQnV0dG9uKFxuICAgICAgICAgICAgb3B0aW9ucy5jYW5jZWxMYWJlbCAhPSBudWxsID8gb3B0aW9ucy5jYW5jZWxMYWJlbCA6ICdDYW5jZWwnLFxuICAgICAgICAgICAgKGV2KSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5fb25DYW5jZWwoZXYpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB3aWR0aDogJzgwcHgnXG4gICAgICAgICAgICB9XG4gICAgICAgIClcbiAgICB9XG5cbiAgICB2YWx1ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZm9ybS52YWx1ZSgpO1xuICAgIH1cblxuICAgIF9vbk9rKGV2KSB7XG4gICAgICAgIGlmICh0aGlzLmZvcm0udmFsaWRhdGUoKSA9PSBmYWxzZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgc3VwZXIuX29uT2soZXYpO1xuICAgIH1cblxuICAgIGNyZWF0ZUVsZW1lbnQoKSB7XG4gICAgICAgIHN1cGVyLmNyZWF0ZUVsZW1lbnQoKTtcblxuICAgICAgICB0aGlzLmJvZHlFbGVtZW50LmNsYXNzTmFtZSA9ICdkaWFsb2ctYm9keS1wYWRkZWQnO1xuICAgICAgICB0aGlzLmJvZHlFbGVtZW50LmFwcGVuZENoaWxkKHRoaXMuZm9ybS5jcmVhdGVFbGVtZW50KCkpO1xuXG4gICAgICAgIHRoaXMuZm9vdGVyRWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLmJ0bkNhbmNlbC5jcmVhdGVFbGVtZW50KCkpO1xuICAgICAgICB0aGlzLmZvb3RlckVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5idG5Pay5jcmVhdGVFbGVtZW50KCkpO1xuXG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnQ7XG4gICAgfVxuXG59IiwiXG5jb25zdCBDb250cm9sID0gcmVxdWlyZShcIi4uL2NvbnRyb2xcIik7XG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgRmllbGQgZXh0ZW5kcyBDb250cm9sIHtcbiAgICBjb25zdHJ1Y3RvcihuYW1lLCBvcHRpb25zID0ge30pIHtcbiAgICAgICAgLypPcHRpb25zXG4gICAgICAgICAqICBsYWJlbD1cIlwiXG4gICAgICAgICAqICBsYWJlbFNpemU9aW4gY3NzIHVuaXRzXG4gICAgICAgICAqICBsYWJlbFRvcD1mYWxzZVxuICAgICAgICAgKiAgcmVxdWlyZWQ9dHJ1ZXxmYWxzZVxuICAgICAgICAgKiAgaW52YWxpZEZlZWRiYWNrPVwiXCJcbiAgICAgICAgICogIGhlbHBUZXh0PVwiXCJcbiAgICAgICAgICogIHBsYWNlaG9sZGVyPVwiXCJcbiAgICAgICAgICovXG4gICAgICAgIHN1cGVyKG9wdGlvbnMpO1xuICAgICAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgICAgICAvL3RoaXMubGFiZWwgPSBsYWJlbDtcblxuICAgICAgICB0aGlzLl9sYWJlbEVsZW1lbnQgPSBudWxsO1xuICAgICAgICB0aGlzLl9wbGFjZWhvbGRlckVsZW1lbnQgPSBudWxsO1xuICAgICAgICB0aGlzLl9oZWxwRWxlbWVudCA9IG51bGw7XG4gICAgICAgIHRoaXMuX2ludmFsaWRFbGVtZW50ID0gbnVsbDtcbiAgICB9XG5cbiAgICB2YWx1ZSgpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHNldFZhbHVlKHZhbHVlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBzZXRMYWJlbCh0ZXh0KSB7XG4gICAgICAgIGlmICh0aGlzLl9sYWJlbEVsZW1lbnQgIT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5fbGFiZWxFbGVtZW50LmlubmVyVGV4dCA9IHRleHQ7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzZXREYXRhKGRhdGEpIHtcbiAgICAgICAgLy9FeHBlY3RzIGEgZGljdGlvbmFyeSB3aXRoIGtleSBlcXVhbCB0byBuYW1lXG4gICAgICAgIHRoaXMuc2V0VmFsdWUoXG4gICAgICAgICAgICBkYXRhW3RoaXMubmFtZV1cbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICBpc0JsYW5rKCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgaXNWYWxpZCgpIHtcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5yZXF1aXJlZCA9PSB0cnVlKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5pc0JsYW5rKCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgdmFsaWRhdGUoKSB7XG4gICAgICAgIHRoaXMubWFya1ZhbGlkKCk7XG5cbiAgICAgICAgdmFyIGlzVmFsaWQgPSB0aGlzLmlzVmFsaWQoKTtcbiAgICAgICAgaWYgKCFpc1ZhbGlkKSB7XG4gICAgICAgICAgICB0aGlzLm1hcmtJbnZhbGlkKCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gaXNWYWxpZDtcbiAgICB9XG5cbiAgICBtYXJrSW52YWxpZCgpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50LmNsYXNzTGlzdC5hZGQoJ2ludmFsaWQnKTtcbiAgICB9XG5cbiAgICBtYXJrVmFsaWQoKSB7XG4gICAgICAgIHRoaXMuZWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKCdpbnZhbGlkJyk7XG4gICAgfVxuXG4gICAgbG9jaygpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHVubG9jaygpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNyZWF0ZUVsZW1lbnQoKSB7XG4gICAgICAgIHN1cGVyLmNyZWF0ZUVsZW1lbnQoKVxuXG4gICAgICAgIHRoaXMuZWxlbWVudC5jbGFzc0xpc3QuYWRkKCdmaWVsZCcpO1xuXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMubGFiZWwgIT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5fbGFiZWxFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGFiZWwnKTtcbiAgICAgICAgICAgIHRoaXMuX2xhYmVsRWxlbWVudC5pbm5lckhUTUwgPSB0aGlzLm9wdGlvbnMubGFiZWw7XG4gICAgICAgICAgICB0aGlzLl9sYWJlbEVsZW1lbnQuc3R5bGUud2lkdGggPSB0aGlzLm9wdGlvbnMubGFiZWxTaXplO1xuICAgICAgICAgICAgLy90aGlzLmVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5fbGFiZWxFbGVtZW50KTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdmFyIGNvbnRlbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgY29udGVudC5zdHlsZS5kaXNwbGF5ID0gJ2ZsZXgnO1xuICAgICAgICBjb250ZW50LnN0eWxlLmZsZXhEaXJlY3Rpb24gPSAnY29sdW1uJztcbiAgICAgICAgY29udGVudC5zdHlsZS5mbGV4R3JvdyA9IDE7XG4gICAgICAgIC8vdGhpcy5lbGVtZW50LmFwcGVuZENoaWxkKGNvbnRlbnQpO1xuXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMubGFiZWwgPT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LmFwcGVuZENoaWxkKGNvbnRlbnQpO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMub3B0aW9ucy5sYWJlbFRvcCA9PSB0cnVlKSB7XG4gICAgICAgICAgICBjb250ZW50LmFwcGVuZENoaWxkKHRoaXMuX2xhYmVsRWxlbWVudCk7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQuYXBwZW5kQ2hpbGQoY29udGVudCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5fbGFiZWxFbGVtZW50KTtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5hcHBlbmRDaGlsZChjb250ZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX3BsYWNlaG9sZGVyRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICB0aGlzLl9wbGFjZWhvbGRlckVsZW1lbnQuc3R5bGUuZGlzcGxheSA9ICdmbGV4JztcbiAgICAgICAgdGhpcy5fcGxhY2Vob2xkZXJFbGVtZW50LnN0eWxlLmZsZXhHcm93ID0gMTtcbiAgICAgICAgY29udGVudC5hcHBlbmRDaGlsZCh0aGlzLl9wbGFjZWhvbGRlckVsZW1lbnQpO1xuXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuaGVscFRleHQgIT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5faGVscEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgICAgIHRoaXMuX2hlbHBFbGVtZW50LmNsYXNzTmFtZSA9ICdoZWxwLXRleHQnO1xuICAgICAgICAgICAgdGhpcy5faGVscEVsZW1lbnQuaW5uZXJIVE1MID0gdGhpcy5vcHRpb25zLmhlbHBUZXh0O1xuICAgICAgICAgICAgY29udGVudC5hcHBlbmRDaGlsZCh0aGlzLl9oZWxwRWxlbWVudCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmludmFsaWRGZWVkYmFjayAhPSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLl9pbnZhbGlkRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICAgICAgdGhpcy5faW52YWxpZEVsZW1lbnQuY2xhc3NOYW1lID0gJ2ludmFsaWQtZmVlZGJhY2snO1xuICAgICAgICAgICAgdGhpcy5faW52YWxpZEVsZW1lbnQuaW5uZXJIVE1MID0gdGhpcy5vcHRpb25zLmludmFsaWRGZWVkYmFjaztcbiAgICAgICAgICAgIGNvbnRlbnQuYXBwZW5kQ2hpbGQodGhpcy5faW52YWxpZEVsZW1lbnQpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50XG4gICAgfVxufVxuIiwiY29uc3QgQ29udHJvbCA9IHJlcXVpcmUoXCIuLi9jb250cm9sXCIpO1xuXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgRm9ybSBleHRlbmRzIENvbnRyb2wge1xuICAgIGNvbnN0cnVjdG9yKG9wdGlvbnM9e30pIHtcbiAgICAgICAgLypPcHRpb25zXG4gICAgICAgICAqICBsYWJlbFNpemU9aW4gY3NzIHVuaXRzXG4gICAgICAgICAqICBsYWJlbFRvcD1mYWxzZVxuICAgICAgICAgKiAgZmxleERpcmVjdGlvbj0nY29sdW1ufHJvdydcbiAgICAgICAgICovXG4gICAgICAgIHN1cGVyKG9wdGlvbnMpO1xuXG4gICAgICAgIHRoaXMuX2ZpZWxkcyA9IFtdO1xuICAgICAgICB0aGlzLl9maWVsZE5hbWVzID0gW107XG4gICAgfVxuXG4gICAgYWRkRmllbGQoZmllbGQpIHtcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5sYWJlbFNpemUgIT0gbnVsbCkge1xuICAgICAgICAgICAgZmllbGQub3B0aW9ucy5sYWJlbFNpemUgPSB0aGlzLm9wdGlvbnMubGFiZWxTaXplO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMubGFiZWxUb3AgIT0gbnVsbCkge1xuICAgICAgICAgICAgZmllbGQub3B0aW9ucy5sYWJlbFRvcCA9IHRoaXMub3B0aW9ucy5sYWJlbFRvcDtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2ZpZWxkcy5wdXNoKGZpZWxkKTtcbiAgICAgICAgdGhpcy5fZmllbGROYW1lcy5wdXNoKGZpZWxkLm5hbWUpO1xuICAgIH1cblxuICAgIHNldFZhbHVlKHZhbHVlKSB7XG4gICAgICAgIC8vVmFsdWUgaXMgZGljdGlvbmFyeSB3aXRoIGZpZWxkTmFtZTogdmFsdWVcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLl9maWVsZE5hbWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLl9maWVsZHNbaV0uc2V0VmFsdWUoXG4gICAgICAgICAgICAgICAgdmFsdWVbdGhpcy5fZmllbGROYW1lc1tpXV1cbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB2YWx1ZSgpIHtcbiAgICAgICAgLy9SZXR1cm5zIGEgZGljdGlvbmFyeSB3aXRoIGZpZWxkTmFtZTogdmFsdWVcbiAgICAgICAgdmFyIHJlc3VsdCA9IHt9O1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuX2ZpZWxkTmFtZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHJlc3VsdFt0aGlzLl9maWVsZE5hbWVzW2ldXSA9IHRoaXMuX2ZpZWxkc1tpXS52YWx1ZSgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgZ2V0RmllbGRCeU5hbWUoZmllbGROYW1lKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9maWVsZHNbdGhpcy5fZmllbGROYW1lcy5maW5kSW5kZXgoKHZhbHVlKSA9PiB7IHJldHVybiB2YWx1ZSA9PSBmaWVsZE5hbWU7fSldO1xuICAgIH1cblxuICAgIHNldEZpZWxkTGFiZWwoZmllbGROYW1lLCBsYWJlbCkge1xuICAgICAgICB0aGlzLmdldEZpZWxkQnlOYW1lKGZpZWxkTmFtZSkuc2V0TGFiZWwobGFiZWwpO1xuICAgIH1cblxuICAgIHNldEZpZWxkVmFsdWUoZmllbGROYW1lLCB2YWx1ZSkge1xuICAgICAgICB0aGlzLmdldEZpZWxkQnlOYW1lKGZpZWxkTmFtZSkuc2V0VmFsdWUodmFsdWUpO1xuICAgIH1cblxuICAgIGZpZWxkVmFsdWUoZmllbGROYW1lKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldEZpZWxkQnlOYW1lKGZpZWxkTmFtZSkudmFsdWUoKTtcbiAgICB9XG5cbiAgICBoaWRlRmllbGQoZmllbGROYW1lKSB7XG4gICAgICAgIHRoaXMuZ2V0RmllbGRCeU5hbWUoZmllbGROYW1lKS5oaWRlKCk7XG4gICAgfVxuXG4gICAgdmFsaWRhdGUoKSB7XG4gICAgICAgIHZhciBpc1ZhbGlkID0gdHJ1ZTtcblxuICAgICAgICB0aGlzLl9maWVsZHMuZm9yRWFjaCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgIGlmIChmaWVsZC52YWxpZGF0ZSgpID09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgaXNWYWxpZCA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gaXNWYWxpZDtcbiAgICB9XG5cbiAgICBsb2NrKCkge1xuICAgICAgICB0aGlzLl9maWVsZHMuZm9yRWFjaCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgIGZpZWxkLmxvY2soKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgdW5sb2NrKCkge1xuICAgICAgICB0aGlzLl9maWVsZHMuZm9yRWFjaCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgIGZpZWxkLnVubG9jaygpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBjbGVhclZhbGlkYXRpb24oKSB7XG4gICAgICAgIHRoaXMuX2ZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgZmllbGQubWFya1ZhbGlkKCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGNyZWF0ZUVsZW1lbnQoKSB7XG4gICAgICAgIHN1cGVyLmNyZWF0ZUVsZW1lbnQoKTtcblxuICAgICAgICB0aGlzLmVsZW1lbnQuc3R5bGUuZmxleERpcmVjdGlvbiA9IHRoaXMub3B0aW9ucy5mbGV4RGlyZWN0aW9uID8gdGhpcy5vcHRpb25zLmZsZXhEaXJlY3Rpb24gOiAnY29sdW1uJztcblxuICAgICAgICB0aGlzLl9maWVsZHMuZm9yRWFjaCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5hcHBlbmRDaGlsZChmaWVsZC5jcmVhdGVFbGVtZW50KCkpO1xuICAgICAgICB9KVxuXG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnQ7XG4gICAgfVxuXG59IiwiY29uc3QgVGV4dEJveCA9IHJlcXVpcmUoXCIuLi90ZXh0LWJveFwiKTtcbmNvbnN0IEZpZWxkID0gcmVxdWlyZShcIi4vZmllbGRcIik7XG5cblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBUZXh0RmllbGQgZXh0ZW5kcyBGaWVsZCB7XG4gICAgY29uc3RydWN0b3IobmFtZSwgb3B0aW9ucyA9IHt9KSB7XG4gICAgICAgIHN1cGVyKG5hbWUsIG9wdGlvbnMpO1xuXG4gICAgICAgIHRoaXMuX3RleHRCb3ggPSBuZXcgVGV4dEJveCh7XG4gICAgICAgICAgICBwbGFjZWhvbGRlcjogb3B0aW9ucy5wbGFjZWhvbGRlcixcbiAgICAgICAgICAgIHR5cGU6IG9wdGlvbnMudHlwZSxcbiAgICAgICAgICAgIHJvd3M6IG9wdGlvbnMucm93cyxcbiAgICAgICAgICAgIHJlc2l6ZTogb3B0aW9ucy5yZXNpemVcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZm9jdXMoKSB7XG4gICAgICAgIHRoaXMuX3RleHRCb3guZm9jdXMoKTtcbiAgICB9XG5cbiAgICBpc0JsYW5rKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fdGV4dEJveC5pc0JsYW5rKCk7XG4gICAgfVxuXG4gICAgdmFsdWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl90ZXh0Qm94LnZhbHVlKCk7XG4gICAgfVxuXG4gICAgc2V0VmFsdWUodmFsdWUpIHtcbiAgICAgICAgdGhpcy5fdGV4dEJveC5zZXRWYWx1ZSh2YWx1ZSk7XG4gICAgfVxuXG4gICAgbG9jaygpIHtcbiAgICAgICAgdGhpcy5fdGV4dEJveC5sb2NrKCk7XG4gICAgfVxuXG4gICAgdW5sb2NrKCkge1xuICAgICAgICB0aGlzLl90ZXh0Qm94LnVubG9jaygpO1xuICAgIH1cblxuICAgIGNyZWF0ZUVsZW1lbnQoKSB7XG4gICAgICAgIHN1cGVyLmNyZWF0ZUVsZW1lbnQoKVxuXG4gICAgICAgIHRoaXMuX3BsYWNlaG9sZGVyRWxlbWVudC5hcHBlbmRDaGlsZChcbiAgICAgICAgICAgIHRoaXMuX3RleHRCb3guY3JlYXRlRWxlbWVudCgpXG4gICAgICAgICk7XG5cbiAgICAgICAgdGhpcy5fdGV4dEJveC5lbGVtZW50LnN0eWxlLmZsZXhHcm93ID0gMTtcblxuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50O1xuICAgIH1cbn1cbiIsImNvbnN0IFNjcm9sbGVkID0gcmVxdWlyZShcIi4vc2Nyb2xsZWRcIik7XG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgTGlzdEJveCBleHRlbmRzIFNjcm9sbGVkIHtcbiAgICBjb25zdHJ1Y3RvcihpZEZ1bmN0aW9uLCBsYWJlbEZ1bmN0aW9uLCBvblNlbGVjdEl0ZW0sIG9wdGlvbnMpIHtcbiAgICAgICAgLyogaWRGdW5jdGlvbihyZXN1bHQpIHsgcmV0dXJuIHJlc3VsdC51bmlxdWVfaWQgfVxuICAgICAgICAgKiBsYWJlbEZ1bmN0aW9uKHJlc3VsdCkgeyByZXR1cm4gcmVzdWx0LmxhYmVsIH1cbiAgICAgICAgICogb25SZXN1bHRDbGlja2VkKHJlc3VsdCkgeyBkbyBzb21ldGhpbmcgdXNpbmcgcmVzdWx0IH1cbiAgICAgICAgICogXG4gICAgICAgICAqL1xuICAgICAgICBzdXBlcihvcHRpb25zKTtcblxuICAgICAgICB0aGlzLmlkRnVuY3Rpb24gPSBpZEZ1bmN0aW9uO1xuICAgICAgICB0aGlzLmxhYmVsRnVuY3Rpb24gPSBsYWJlbEZ1bmN0aW9uO1xuICAgICAgICB0aGlzLm9uU2VsZWN0SXRlbSA9IG9uU2VsZWN0SXRlbTtcblxuICAgICAgICB0aGlzLmRhdGEgPSBbXTtcbiAgICAgICAgdGhpcy5faXRlbUlkcyA9IFtdO1xuICAgICAgICB0aGlzLl9pdGVtRWxlbWVudHMgPSBbXTtcblxuICAgICAgICB0aGlzLl9saXN0RWxlbWVudCA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5fc2VsZWN0ZWRJdGVtID0gbnVsbDtcbiAgICAgICAgdGhpcy5fc2VsZWN0ZWRFbGVtZW50ID0gbnVsbDtcblxuICAgICAgICB0aGlzLl9vbkl0ZW1DbGlja2VkID0gKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICB0aGlzLmNsZWFyU2VsZWN0aW9uKCk7XG5cbiAgICAgICAgICAgIHRoaXMuX3NlbGVjdGVkRWxlbWVudCA9IGV2ZW50LmN1cnJlbnRUYXJnZXQ7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHRoaXMuX2hpZ2hsaWdodFNlbGVjdGlvbigpO1xuICAgICAgICAgICAgdGhpcy5fb25TZWxlY3RJdGVtKGV2ZW50KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIF9jcmVhdGVMaXN0SXRlbShpdGVtaWQsIGxhYmVsKSB7XG4gICAgICAgIHZhciBpdGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcbiAgICAgICAgaXRlbS5zZXRBdHRyaWJ1dGUoJ2l0ZW0taWQnLCBpdGVtaWQpO1xuICAgICAgICBpdGVtLmlubmVySFRNTCA9IGxhYmVsO1xuXG4gICAgICAgIGl0ZW0uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLl9vbkl0ZW1DbGlja2VkKTtcblxuICAgICAgICByZXR1cm4gaXRlbTtcbiAgICB9XG5cbiAgICBfY2xlYXIoKSB7XG4gICAgICAgIHdoaWxlICh0aGlzLl9saXN0RWxlbWVudC5maXJzdENoaWxkKSB7XG4gICAgICAgICAgICB0aGlzLl9saXN0RWxlbWVudC5maXJzdENoaWxkLnJlbW92ZSgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX2hpZ2hsaWdodFNlbGVjdGlvbigpIHtcbiAgICAgICAgdGhpcy5fc2VsZWN0ZWRFbGVtZW50LmNsYXNzTmFtZSA9ICdzZWxlY3RlZCc7XG4gICAgfVxuXG4gICAgX29uU2VsZWN0SXRlbShldmVudCkge1xuICAgICAgICB0aGlzLl9zZWxlY3RlZEl0ZW0gPSBudWxsO1xuICAgICAgICB2YXIgc2VsZWN0ZWRJZCA9IHRoaXMuX3NlbGVjdGVkRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2l0ZW0taWQnKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLl9pdGVtSWRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5faXRlbUlkc1tpXSA9PSBzZWxlY3RlZElkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fc2VsZWN0ZWRJdGVtID0gdGhpcy5kYXRhW2ldO1xuICAgICAgICAgICAgICAgIHRoaXMub25TZWxlY3RJdGVtKHRoaXMuX3NlbGVjdGVkSXRlbSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB2YWx1ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3NlbGVjdGVkSXRlbTtcbiAgICB9XG5cbiAgICBzZXRTZWxlY3Rpb24oaXRlbUlkKSB7XG4gICAgICAgIGlmIChpdGVtSWQgPT0gbnVsbCB8fCBpdGVtSWQgPT0gJycpIHtcbiAgICAgICAgICAgIHRoaXMuY2xlYXJTZWxlY3Rpb24oKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuX2l0ZW1JZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9pdGVtSWRzW2ldID09IGl0ZW1JZCkge1xuICAgICAgICAgICAgICAgIHRoaXMuY2xlYXJTZWxlY3Rpb24oKTtcblxuICAgICAgICAgICAgICAgIHRoaXMuX3NlbGVjdGVkRWxlbWVudCA9IHRoaXMuX2l0ZW1FbGVtZW50c1tpXTtcbiAgICAgICAgICAgICAgICB0aGlzLl9zZWxlY3RlZEl0ZW0gPSB0aGlzLmRhdGFbaV07XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgdGhpcy5faGlnaGxpZ2h0U2VsZWN0aW9uKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5fc2VsZWN0ZWRFbGVtZW50LnNjcm9sbEludG9WaWV3KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjbGVhclNlbGVjdGlvbigpIHtcbiAgICAgICAgaWYgKHRoaXMuX3NlbGVjdGVkRWxlbWVudCAhPSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLl9zZWxlY3RlZEVsZW1lbnQuY2xhc3NOYW1lID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9zZWxlY3RlZEVsZW1lbnQgPSBudWxsO1xuXG4gICAgICAgIHRoaXMuX3NlbGVjdGVkSXRlbSA9IG51bGw7XG4gICAgfVxuXG4gICAgc2V0RGF0YShkYXRhKSB7XG4gICAgICAgIHRoaXMuZGF0YSA9IGRhdGE7XG4gICAgICAgIHRoaXMuZGlzcGxheURhdGEoKTtcbiAgICB9XG5cbiAgICBhcHBlbmREYXRhKGRhdGEpIHtcbiAgICAgICAgaWYgKCF0aGlzLmRhdGEpIHtcbiAgICAgICAgICAgIHRoaXMuZGF0YSA9IGRhdGFcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZGF0YSA9IHRoaXMuZGF0YS5jb25jYXQoZGF0YSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5kaXNwbGF5RGF0YSh0cnVlKTtcbiAgICB9XG5cbiAgICBkaXNwbGF5RGF0YShub1Njcm9sbCkge1xuICAgICAgICB0aGlzLl9jbGVhcigpO1xuICAgICAgICBcbiAgICAgICAgdGhpcy5faXRlbUlkcyA9IFtdO1xuICAgICAgICB0aGlzLl9pdGVtRWxlbWVudHMgPSBbXTtcbiAgICAgICAgdGhpcy5kYXRhLmZvckVhY2goKGl0ZW0pID0+IHtcbiAgICAgICAgICAgIHZhciBpdGVtX2lkID0gdGhpcy5pZEZ1bmN0aW9uKGl0ZW0pO1xuXG4gICAgICAgICAgICB0aGlzLl9pdGVtSWRzLnB1c2goaXRlbV9pZCk7XG5cbiAgICAgICAgICAgIHZhciBlbGVtID0gdGhpcy5fY3JlYXRlTGlzdEl0ZW0oXG4gICAgICAgICAgICAgICAgaXRlbV9pZCxcbiAgICAgICAgICAgICAgICB0aGlzLmxhYmVsRnVuY3Rpb24oaXRlbSlcbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIHRoaXMuX2xpc3RFbGVtZW50LmFwcGVuZENoaWxkKGVsZW0pO1xuICAgICAgICAgICAgdGhpcy5faXRlbUVsZW1lbnRzLnB1c2goZWxlbSk7XG4gICAgICAgIH0pXG5cbiAgICAgICAgaWYgKCFub1Njcm9sbCkge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LnNjcm9sbFRvcCA9IDA7XG4gICAgICAgIH0gICAgICAgXG4gICAgfVxuXG4gICAgY3JlYXRlRWxlbWVudCgpIHtcbiAgICAgICAgc3VwZXIuY3JlYXRlRWxlbWVudCgpO1xuXG4gICAgICAgIHRoaXMuZWxlbWVudC5jbGFzc0xpc3QuYWRkKCdsaXN0LWJveCcpO1xuICAgICAgICBcbiAgICAgICAgdGhpcy5fbGlzdEVsZW1lbnQgPSAgZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndWwnKTtcbiAgICAgICAgdGhpcy5lbGVtZW50LmFwcGVuZENoaWxkKHRoaXMuX2xpc3RFbGVtZW50KTtcblxuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50O1xuICAgIH1cbn0iLCJjb25zdCBDb250cm9sID0gcmVxdWlyZSgnLi9jb250cm9sJyk7XG5jb25zdCBTcGlubmVyID0gcmVxdWlyZSgnLi9zcGlubmVyJyk7XG5cblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBSZXNvdXJjZUFjY29yZGlvbkl0ZW0gZXh0ZW5kcyBDb250cm9sIHtcbiAgICBjb25zdHJ1Y3RvcihpdGVtRGF0YSwgb3B0aW9ucykge1xuICAgICAgICBzdXBlcihvcHRpb25zKTtcblxuICAgICAgICB0aGlzLml0ZW1EYXRhID0gaXRlbURhdGE7XG5cbiAgICAgICAgdGhpcy5yZXNvdXJjZURhdGEgPSBudWxsO1xuXG4gICAgICAgIHRoaXMuc3Bpbm5lciA9IG5ldyBTcGlubmVyKCk7XG5cbiAgICAgICAgdGhpcy5fb25DbGlja0hlYWRlciA9IChldmVudCkgPT4ge1xuICAgICAgICAgICAgdGhpcy50b2dnbGVCb2R5KCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBfc2hvd1NwaW5uZXIoKSB7XG4gICAgICAgIHRoaXMuYm9keUVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5zcGlubmVyLmNyZWF0ZUVsZW1lbnQoKSk7XG4gICAgfVxuXG4gICAgX2hpZGVTcGlubmVyKCkge1xuICAgICAgICB0aGlzLnNwaW5uZXIucmVtb3ZlRWxlbWVudCgpO1xuICAgIH1cblxuICAgIHRvZ2dsZUJvZHkoKSB7XG4gICAgICAgIGlmICh0aGlzLmJvZHlFbGVtZW50LnN0eWxlLmRpc3BsYXkgPT0gJ25vbmUnKSB7XG4gICAgICAgICAgICB0aGlzLnNob3dCb2R5KCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5oaWRlQm9keSgpO1xuICAgIH1cblxuICAgIHNob3dCb2R5KCkge1xuICAgICAgICB0aGlzLmJvZHlFbGVtZW50LnN0eWxlLmRpc3BsYXkgPSAnZmxleCc7XG5cbiAgICAgICAgdGhpcy5sb2FkUmVzb3VyY2UoKTtcbiAgICB9XG5cbiAgICBoaWRlQm9keSgpIHtcbiAgICAgICAgdGhpcy5ib2R5RWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICB0aGlzLl9oaWRlU3Bpbm5lcigpO1xuICAgIH1cblxuICAgIGxvYWRSZXNvdXJjZSgpIHtcbiAgICAgICAgaWYgKHRoaXMucmVzb3VyY2VEYXRhICE9IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX3Nob3dTcGlubmVyKCk7XG4gICAgICAgIGNvbm5lY3Rpb24uZ2V0KFxuICAgICAgICAgICAgdGhpcy5pdGVtRGF0YS51cmwsXG4gICAgICAgICAgICAoZGF0YSkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMucmVzb3VyY2VEYXRhID0gZGF0YTtcbiAgICAgICAgICAgICAgICB0aGlzLmRpc3BsYXlSZXNvdXJjZSgpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIChlcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycm9yKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5faGlkZVNwaW5uZXIoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgKVxuICAgIH1cblxuICAgIGRpc3BsYXlSZXNvdXJjZSgpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNyZWF0ZUhlYWRlckVsZW1lbnQoKSB7XG4gICAgICAgIHRoaXMuaGVhZGVyRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICB0aGlzLmhlYWRlckVsZW1lbnQuY2xhc3NOYW1lID0gJ3Jvb3QtaXRlbS1oZWFkJztcbiAgICAgICAgdGhpcy5oZWFkZXJFbGVtZW50LmlubmVySFRNTCA9ICdUaXRsZSc7XG4gICAgICAgIHRoaXMuaGVhZGVyRWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMuX29uQ2xpY2tIZWFkZXIpO1xuXG4gICAgICAgIHJldHVybiB0aGlzLmhlYWRlckVsZW1lbnQ7XG5cbiAgICB9XG5cbiAgICBjcmVhdGVCb2R5RWxlbWVudCgpIHtcbiAgICAgICAgdGhpcy5ib2R5RWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICB0aGlzLmJvZHlFbGVtZW50LmNsYXNzTmFtZSA9ICdyb290LWl0ZW0tYm9keSc7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuYm9keUVsZW1lbnQ7XG4gICAgfVxuXG4gICAgY3JlYXRlRWxlbWVudCgpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcbiAgICAgICAgdGhpcy5lbGVtZW50LmNsYXNzTmFtZSA9ICdyb290LWl0ZW0nO1xuXG4gICAgICAgIHRoaXMuZWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLmNyZWF0ZUhlYWRlckVsZW1lbnQoKSk7XG4gICAgICAgIHRoaXMuZWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLmNyZWF0ZUJvZHlFbGVtZW50KCkpO1xuXG4gICAgICAgIHRoaXMuaGlkZUJvZHkoKTtcblxuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50O1xuICAgIH1cbn0iLCJjb25zdCBDb250cm9sID0gcmVxdWlyZSgnLi9jb250cm9sJyk7XG5jb25zdCBTcGlubmVyID0gcmVxdWlyZSgnLi9zcGlubmVyJyk7XG5jb25zdCBSZXNvdXJjZUFjY29yZGlvbkl0ZW0gPSByZXF1aXJlKCcuL3Jlc291cmNlLWFjY29yZGlvbi1pdGVtJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgUmVzb3VyY2VBY2NvcmRpb24gZXh0ZW5kcyBDb250cm9sIHtcbiAgICBjb25zdHJ1Y3RvcihpZEZ1bmN0aW9uLCBpdGVtQ2xhc3M9UmVzb3VyY2VBY2NvcmRpb25JdGVtLCBvcHRpb25zPXt9KSB7XG4gICAgICAgIHN1cGVyKG9wdGlvbnMpO1xuXG4gICAgICAgIHRoaXMuaXRlbUNsYXNzID0gaXRlbUNsYXNzO1xuICAgICAgICB0aGlzLmRhdGEgPSBudWxsO1xuICAgICAgICB0aGlzLnJlc291cmNlRGF0YSA9IG51bGw7XG4gICAgICAgIHRoaXMuX2l0ZW1EYXRhID0ge307XG4gICAgICAgIHRoaXMuX2l0ZW1DaGlsZHJlbiA9IHt9O1xuXG4gICAgICAgIHRoaXMuaWRGdW5jdGlvbiA9IGlkRnVuY3Rpb247XG4gICAgICAgIC8vdGhpcy5sYWJlbEZ1bmN0aW9uID0gbGFiZWxGdW5jdGlvbjtcblxuICAgICAgICB0aGlzLnNwaW5uZXIgPSBuZXcgU3Bpbm5lcigpO1xuXG4gICAgICAgIC8qXG4gICAgICAgIHRoaXMuX29uSXRlbUNsaWNrZWQgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIHZhciBzZWxlY3RlZElkID0gZXZlbnQuY3VycmVudFRhcmdldC5nZXRBdHRyaWJ1dGUoJ2l0ZW0taWQnKTtcblxuICAgICAgICAgICAgdmFyIHNlbGVjdGVkX2l0ZW0gPSB0aGlzLl9pdGVtRGF0YVtzZWxlY3RlZElkXTtcblxuICAgICAgICAgICAgY29uc29sZS5sb2coc2VsZWN0ZWRfaXRlbSk7XG4gICAgICAgIH1cbiAgICAgICAgKi9cblxuICAgICAgICB0aGlzLl9vbk5leHRJdGVtQ2xpY2tlZCA9IChldmVudCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5fbG9hZE5leHQoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIF9zaG93U3Bpbm5lcigpIHtcbiAgICAgICAgdmFyIGVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xuICAgICAgICBlbGVtZW50LmNsYXNzTGlzdCA9ICdyb290LWl0ZW0gc3Bpbm5lci1pdGVtJztcbiAgICAgICAgdGhpcy5fbGlzdEVsZW1lbnQuYXBwZW5kQ2hpbGQoZWxlbWVudCk7XG5cbiAgICAgICAgZWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLnNwaW5uZXIuY3JlYXRlRWxlbWVudCgpKVxuICAgIH1cblxuICAgIF9oaWRlU3Bpbm5lcigpIHtcbiAgICAgICAgdmFyIGVsZW1lbnQgPSB0aGlzLnNwaW5uZXIuZWxlbWVudC5wYXJlbnRFbGVtZW50O1xuICAgICAgICBlbGVtZW50LnJlbW92ZUNoaWxkKHRoaXMuc3Bpbm5lci5lbGVtZW50KTtcbiAgICAgICAgZWxlbWVudC5wYXJlbnRFbGVtZW50LnJlbW92ZUNoaWxkKGVsZW1lbnQpXG4gICAgfVxuXG4gICAgLypcbiAgICBfY3JlYXRlTGlzdEl0ZW0oaXRlbWlkLCBsYWJlbCkge1xuICAgICAgICB2YXIgaXRlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpJyk7XG4gICAgICAgIGl0ZW0uc2V0QXR0cmlidXRlKCdpdGVtLWlkJywgaXRlbWlkKTtcbiAgICAgICAgaXRlbS5jbGFzc05hbWUgPSAncm9vdC1pdGVtJztcbiAgICAgICAgaXRlbS5pbm5lckhUTUwgPSBsYWJlbDtcblxuICAgICAgICAvL2l0ZW0uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLl9vbkl0ZW1DbGlja2VkKTtcblxuICAgICAgICByZXR1cm4gaXRlbTtcbiAgICB9XG4gICAgKi9cblxuICAgIF9jcmVhdGVOZXh0SXRlbSgpIHtcbiAgICAgICAgdGhpcy5fbmV4dEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xuICAgICAgICB0aGlzLl9uZXh0RWxlbWVudC5jbGFzc0xpc3QgPSAncm9vdC1pdGVtIG5leHQtaXRlbSc7XG4gICAgICAgIHRoaXMuX25leHRFbGVtZW50LmlubmVySFRNTCA9ICdMb2FkIE1vcmUuLi4nXG5cbiAgICAgICAgdGhpcy5fbmV4dEVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLl9vbk5leHRJdGVtQ2xpY2tlZCk7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcy5fbmV4dEVsZW1lbnQ7XG4gICAgfVxuXG4gICAgX3JlbW92ZU5leHRJdGVtKCkge1xuICAgICAgICB0aGlzLl9uZXh0RWxlbWVudC5wYXJlbnRFbGVtZW50LnJlbW92ZUNoaWxkKHRoaXMuX25leHRFbGVtZW50KTtcbiAgICB9XG5cbiAgICBfY2xlYXIoKSB7XG4gICAgICAgIGZvciAodmFyIGtleSBpbiB0aGlzLl9pdGVtQ2hpbGRyZW4pIHtcbiAgICAgICAgICAgIHRoaXMuX2xpc3RFbGVtZW50LnJlbW92ZUNoaWxkKHRoaXMuX2l0ZW1DaGlsZHJlbltrZXldLmVsZW1lbnQpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLl9uZXh0RWxlbWVudCAhPSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLl9saXN0RWxlbWVudC5yZW1vdmVDaGlsZCh0aGlzLl9uZXh0RWxlbWVudCk7XG4gICAgICAgICAgICB0aGlzLl9uZXh0RWxlbWVudCA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fZGF0YSA9IG51bGw7XG4gICAgICAgIHRoaXMuX2l0ZW1DaGlsZHJlbiA9IHt9O1xuICAgIH1cbiAgICBcbiAgICBfc2V0RGF0YShkYXRhKSB7XG4gICAgICAgIHRoaXMuX2NsZWFyKCk7XG4gICAgICAgIHRoaXMuX2FwcGVuZERhdGEoZGF0YSk7XG4gICAgfVxuXG4gICAgX2FwcGVuZERhdGEoZGF0YSkge1xuICAgICAgICBpZiAodGhpcy5kYXRhID09IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMuZGF0YSA9IGRhdGE7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmRhdGEgPSB0aGlzLmRhdGEuY29uY2F0KGRhdGEpO1xuICAgICAgICB9XG5cbiAgICAgICAgZGF0YS5mb3JFYWNoKChpdGVtKSA9PiB7XG4gICAgICAgICAgICB2YXIgaXRlbV9pZCA9IHRoaXMuaWRGdW5jdGlvbihpdGVtKVxuXG4gICAgICAgICAgICB0aGlzLl9pdGVtQ2hpbGRyZW5baXRlbV9pZF0gPSBuZXcgdGhpcy5pdGVtQ2xhc3MoaXRlbSk7XG4gICAgICAgICAgICB0aGlzLl9saXN0RWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLl9pdGVtQ2hpbGRyZW5baXRlbV9pZF0uY3JlYXRlRWxlbWVudCgpKTtcbiAgICAgICAgfSlcblxuICAgICAgICBpZiAodGhpcy5yZXNvdXJjZURhdGEubmV4dCAhPSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLl9saXN0RWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLl9jcmVhdGVOZXh0SXRlbSgpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX25leHRFbGVtZW50ID0gbnVsbDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIF9sb2FkTmV4dCgpIHtcbiAgICAgICAgdGhpcy5fcmVtb3ZlTmV4dEl0ZW0oKTtcbiAgICAgICAgdGhpcy5fc2hvd1NwaW5uZXIoKTtcbiAgICAgICAgY29ubmVjdGlvbi5nZXQoXG4gICAgICAgICAgICB0aGlzLnJlc291cmNlRGF0YS5uZXh0LFxuICAgICAgICAgICAgKGRhdGEpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLnJlc291cmNlRGF0YSA9IGRhdGE7XG4gICAgICAgICAgICAgICAgdGhpcy5fYXBwZW5kRGF0YSh0aGlzLnJlc291cmNlRGF0YS5pdGVtcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgKGVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coZXJyb3IpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLl9oaWRlU3Bpbm5lcigpO1xuICAgICAgICAgICAgfVxuICAgICAgICApXG4gICAgfVxuXG4gICAgc2V0UmVzb3VyY2VVcmwodXJsKSB7XG4gICAgICAgIC8vdGhpcy5fbGlzdEVsZW1lbnQuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgdGhpcy5fY2xlYXIoKTtcbiAgICAgICAgdGhpcy5fc2hvd1NwaW5uZXIoKTtcbiAgICAgICAgY29ubmVjdGlvbi5nZXQoXG4gICAgICAgICAgICB1cmwsXG4gICAgICAgICAgICBkYXRhID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLnJlc291cmNlRGF0YSA9IGRhdGE7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgdGhpcy5fc2V0RGF0YSh0aGlzLnJlc291cmNlRGF0YS5pdGVtcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgKGVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coZXJyb3IpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLl9oaWRlU3Bpbm5lcigpOztcbiAgICAgICAgICAgIH1cbiAgICAgICAgKVxuICAgIH1cblxuICAgIGNyZWF0ZUVsZW1lbnQoKSB7XG4gICAgICAgIHN1cGVyLmNyZWF0ZUVsZW1lbnQoKVxuXG4gICAgICAgIHRoaXMuZWxlbWVudC5jbGFzc05hbWUgPSAnYWNjb3JkaW9uJztcblxuICAgICAgICB0aGlzLl9saXN0RWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3VsJyk7XG4gICAgICAgIHRoaXMuX2xpc3RFbGVtZW50LnN0eWxlLmZsZXhEaXJlY3Rpb24gPSAnY29sdW1uJztcbiAgICAgICAgdGhpcy5fbGlzdEVsZW1lbnQuY2xhc3NOYW1lID0gJ3Jvb3QtbGlzdCc7XG4gICAgICAgIHRoaXMuZWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLl9saXN0RWxlbWVudCk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudDtcbiAgICB9XG59IiwiY29uc3QgTGlzdEJveCA9IHJlcXVpcmUoXCIuL2xpc3QtYm94XCIpXG5jb25zdCBTcGlubmVyID0gcmVxdWlyZShcIi4vc3Bpbm5lclwiKVxuY29uc3QgU3Bpbm5lckZvcmVncm91bmQgPSByZXF1aXJlKFwiLi9zcGlubmVyLWZvcmVncm91bmRcIilcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBSZXNvdXJjZUxpc3QgZXh0ZW5kcyBMaXN0Qm94IHtcbiAgICBjb25zdHJ1Y3RvcihpZEZ1bmN0aW9uLCBsYWJlbEZ1bmN0aW9uLCBvblNlbGVjdEl0ZW0sIG9wdGlvbnMpIHtcbiAgICAgICAgLyogaWRGdW5jdGlvbihyZXN1bHQpIHsgcmV0dXJuIHJlc3VsdC51bmlxdWVfaWQgfVxuICAgICAgICAgKiBsYWJlbEZ1bmN0aW9uKHJlc3VsdCkgeyByZXR1cm4gcmVzdWx0LmxhYmVsIH1cbiAgICAgICAgICogb25SZXN1bHRDbGlja2VkKHJlc3VsdCkgeyBkbyBzb21ldGhpbmcgdXNpbmcgcmVzdWx0IH1cbiAgICAgICAgICogXG4gICAgICAgICAqL1xuICAgICAgICBzdXBlcihpZEZ1bmN0aW9uLCBsYWJlbEZ1bmN0aW9uLCBvblNlbGVjdEl0ZW0sIG9wdGlvbnMpO1xuXG4gICAgICAgIHRoaXMuc3Bpbm5lciA9IG5ldyBTcGlubmVyKCk7XG5cbiAgICAgICAgdGhpcy5yZXNvdXJjZV9kYXRhID0ge31cbiAgICB9XG5cbiAgICBzZXRSZXNvdXJjZVVybCh1cmwpIHtcbiAgICAgICAgdGhpcy5zcGlubmVyLnNob3coKTtcbiAgICAgICAgdGhpcy5fbGlzdEVsZW1lbnQuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgY29ubmVjdGlvbi5nZXQoXG4gICAgICAgICAgICB1cmwsXG4gICAgICAgICAgICBkYXRhID0+IHtcbiAgICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nKGRhdGEpO1xuICAgICAgICAgICAgICAgIHRoaXMucmVzb3VyY2VfZGF0YSA9IGRhdGE7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXREYXRhKGRhdGEuaXRlbXMpXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgKGVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coZXJyb3IpO1xuICAgICAgICAgICAgICAgIGlmIChlcnJvci5zdGF0dXMgPT0gNDA0KSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVzb3VyY2VfZGF0YSA9IHt9O1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNldERhdGEoW10pO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmRpc3BsYXlOb3RGb3VuZCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5zcGlubmVyLmhpZGUoKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9saXN0RWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gJ2ZsZXgnO1xuICAgICAgICAgICAgfVxuICAgICAgICApXG4gICAgfVxuXG4gICAgX29uTG9hZE5leHRDbGlja2VkKGV2ZW50KSB7XG4gICAgICAgIGV2ZW50LnRhcmdldC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICB0aGlzLnNwaW5uZXIuc2hvdygpO1xuICAgICAgICBjb25uZWN0aW9uLmdldChcbiAgICAgICAgICAgIHRoaXMucmVzb3VyY2VfZGF0YS5uZXh0LFxuICAgICAgICAgICAgZGF0YSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZXNvdXJjZV9kYXRhID0gZGF0YTtcbiAgICAgICAgICAgICAgICB0aGlzLmFwcGVuZERhdGEoZGF0YS5pdGVtcylcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAoZXJyb3IpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhlcnJvcik7XG4gICAgICAgICAgICAgICAgdGhpcy5kaXNwbGF5RGF0YSh0cnVlKVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLnNwaW5uZXIuaGlkZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICApXG4gICAgfVxuXG4gICAgZGlzcGxheU5vdEZvdW5kKCkge1xuICAgICAgICB2YXIgbmV4dF9lbGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcbiAgICAgICAgbmV4dF9lbGVtLmNsYXNzTmFtZSA9ICdidXR0b24nXG4gICAgICAgIG5leHRfZWxlbS5pbm5lckhUTUwgPSAnTm90IEZvdW5kLic7XG4gICAgICAgIHRoaXMuX2xpc3RFbGVtZW50LmFwcGVuZENoaWxkKG5leHRfZWxlbSk7XG4gICAgfVxuXG5cbiAgICBkaXNwbGF5RGF0YShub1Njcm9sbCkge1xuICAgICAgICBzdXBlci5kaXNwbGF5RGF0YShub1Njcm9sbCk7XG5cbiAgICAgICAgaWYgKHRoaXMucmVzb3VyY2VfZGF0YS5uZXh0KSB7XG4gICAgICAgICAgICB2YXIgbmV4dF9lbGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcbiAgICAgICAgICAgIG5leHRfZWxlbS5zZXRBdHRyaWJ1dGUoJ25leHQtdXJsJywgdGhpcy5yZXNvdXJjZV9kYXRhLm5leHQpO1xuICAgICAgICAgICAgbmV4dF9lbGVtLmNsYXNzTmFtZSA9ICdidXR0b24nXG4gICAgICAgICAgICBuZXh0X2VsZW0uaW5uZXJIVE1MID0gJ0xvYWQgTW9yZS4uLic7XG4gICAgICAgICAgICBuZXh0X2VsZW0uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZXZlbnQpID0+IHsgXG4gICAgICAgICAgICAgICAgdGhpcy5fb25Mb2FkTmV4dENsaWNrZWQoZXZlbnQpIFxuICAgICAgICAgICAgfSApXG4gICAgICAgICAgICB0aGlzLl9saXN0RWxlbWVudC5hcHBlbmRDaGlsZChuZXh0X2VsZW0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgY3JlYXRlRWxlbWVudCgpIHtcbiAgICAgICAgc3VwZXIuY3JlYXRlRWxlbWVudCgpO1xuXG4gICAgICAgIHRoaXMuZWxlbWVudC5zdHlsZS5mbGV4RGlyZWN0aW9uID0gJ2NvbHVtbic7XG4gICAgICAgIHRoaXMuX2xpc3RFbGVtZW50LnN0eWxlLmZsZXhHcm93ID0gMDtcblxuICAgICAgICB0aGlzLmVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5zcGlubmVyLmNyZWF0ZUVsZW1lbnQoKSk7XG4gICAgICAgIHRoaXMuc3Bpbm5lci5oaWRlKCk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudDtcbiAgICB9XG59IiwiY29uc3QgQ29udHJvbCA9IHJlcXVpcmUoXCIuL2NvbnRyb2xcIik7XG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgU2Nyb2xsZWQgZXh0ZW5kcyBDb250cm9sIHtcbiAgICBjb25zdHJ1Y3RvcihvcHRpb25zKSB7XG4gICAgICAgIHN1cGVyKG9wdGlvbnMpO1xuICAgIH1cblxuICAgIHNjcm9sbFRvKHBvc2l0aW9uKSB7XG4gICAgICAgIHRoaXMuZWxlbWVudC5zY3JvbGxUbyhwb3NpdGlvbik7XG4gICAgfVxuXG4gICAgY3JlYXRlRWxlbWVudCgpIHtcbiAgICAgICAgc3VwZXIuY3JlYXRlRWxlbWVudCgpO1xuXG4gICAgICAgIHRoaXMuZWxlbWVudC5zdHlsZS5vdmVyZmxvd1ggPSAnbm9uZSc7XG4gICAgICAgIHRoaXMuZWxlbWVudC5zdHlsZS5vdmVyZmxvd1kgPSAnYXV0byc7XG4gICAgICAgIHRoaXMuZWxlbWVudC5zdHlsZS5mbGV4R3JvdyA9IDE7XG4gICAgICAgIHRoaXMuZWxlbWVudC5jbGFzc0xpc3QuYWRkKCdzY3JvbGxlZCcpO1xuXG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnQ7XG4gICAgfVxufVxuIiwiY29uc3QgQ29udHJvbCA9IHJlcXVpcmUoXCIuL2NvbnRyb2xcIik7XG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgU3Bpbm5lckZvcmdyb3VuZCBleHRlbmRzIENvbnRyb2wge1xuICAgIGNvbnN0cnVjdG9yKG9wdGlvbnMpIHtcbiAgICAgICAgc3VwZXIob3B0aW9ucyk7XG4gICAgfVxuXG4gICAgY3JlYXRlRWxlbWVudCgpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIHRoaXMuZWxlbWVudC5jbGFzc05hbWUgPSAnZm9yZWdyb3VuZCc7XG5cbiAgICAgICAgdmFyIHNwaW5uZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgc3Bpbm5lci5jbGFzc05hbWUgPSAnc3Bpbm5lcic7XG5cbiAgICAgICAgdGhpcy5lbGVtZW50LmFwcGVuZENoaWxkKHNwaW5uZXIpO1xuXG4gICAgICAgIHJldHVybih0aGlzLmVsZW1lbnQpO1xuICAgIH1cbn1cbiIsImNvbnN0IENvbnRyb2wgPSByZXF1aXJlKFwiLi9jb250cm9sXCIpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFNwaW5uZXIgZXh0ZW5kcyBDb250cm9sIHtcbiAgICBjb25zdHJ1Y3RvcihvcHRpb25zKSB7XG4gICAgICAgIHN1cGVyKG9wdGlvbnMpO1xuXG4gICAgICAgIHRoaXMuX3NwaW5uZXJFbGVtZW50ID0gbnVsbDtcbiAgICAgICAgdGhpcy5fbGFiZWxFbGVtZW50ID0gbnVsbDtcbiAgICB9XG5cbiAgICBzZXRMYWJlbChsYWJlbCkge1xuICAgICAgICB0aGlzLl9sYWJlbEVsZW1lbnQuaW5uZXJIdG1sID0gbGFiZWw7XG4gICAgfVxuXG4gICAgXG5cbiAgICBzaG93KCkge1xuICAgICAgICBzdXBlci5zaG93KCk7XG4gICAgfVxuXG4gICAgY3JlYXRlRWxlbWVudCgpIHtcbiAgICAgICAgc3VwZXIuY3JlYXRlRWxlbWVudCgpO1xuXG4gICAgICAgIHRoaXMuZWxlbWVudC5jbGFzc05hbWUgPSAnc3Bpbm5lci1jb250YWluZXInO1xuXG4gICAgICAgIHRoaXMuX3NwaW5uZXJFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIHRoaXMuX3NwaW5uZXJFbGVtZW50LmNsYXNzTmFtZSA9ICdzcGlubmVyJztcbiAgICAgICAgdGhpcy5lbGVtZW50LmFwcGVuZENoaWxkKHRoaXMuX3NwaW5uZXJFbGVtZW50KTtcblxuICAgICAgICB0aGlzLl9sYWJlbEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgdGhpcy5fbGFiZWxFbGVtZW50LmNsYXNzTmFtZSA9ICdzcGlubmVyLWxhYmVsJztcbiAgICAgICAgdGhpcy5lbGVtZW50LmFwcGVuZENoaWxkKHRoaXMuX2xhYmVsRWxlbWVudCk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudDtcbiAgICB9XG59IiwiY29uc3QgQ29udHJvbCA9IHJlcXVpcmUoJy4vY29udHJvbCcpO1xuXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgU3BpdHRlciBleHRlbmRzIENvbnRyb2wge1xuICAgIGNvbnN0cnVjdG9yKHBhbmUxLCBwYW5lMiwgb3B0aW9ucyA9IHt9KSB7XG4gICAgICAgIC8qIE9wdGlvbnNcbiAgICAgICAgICogIGRpcmVjdGlvbiA9ICdyb3cnfCdjb2x1bW4nIChkZWZhdWx0PSdyb3cnKVxuICAgICAgICAgKiAgcGFuZTFTaXplID0gY3NzIHNpemUgKGlmIHBhbmUxU2l6ZSBpcyBnaXZlbiwgcGFuZTJTaXplIGlzIGlnbm9yZWQpXG4gICAgICAgICAqICAoKHBhbmUyU2l6ZSA9IGNzcyBzaXplKSkgLT4gVGhpcyBEb2VzIG5vdCB3b3JrXG4gICAgICAgICAqICBtaW5TaXplID0gaW50XG4gICAgICAgICAqL1xuICAgICAgICBzdXBlcihvcHRpb25zKTtcblxuICAgICAgICB0aGlzLnBhbmUxID0gcGFuZTE7XG4gICAgICAgIHRoaXMucGFuZTIgPSBwYW5lMjtcblxuICAgICAgICB0aGlzLnJlc2l6ZXJTaXplID0gNTtcbiAgICAgICAgdGhpcy5yZXNpemVyRWxlbWVudCA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5taW5TaXplID0gdGhpcy5vcHRpb25zLm1pblNpemUgIT0gbnVsbCA/IHRoaXMub3B0aW9ucy5taW5TaXplIDogNTA7XG5cbiAgICAgICAgdGhpcy5wb3MxID0gbnVsbDtcbiAgICAgICAgdGhpcy5wb3MyID0gbnVsbDtcbiAgICAgICAgdGhpcy5wb3MzID0gbnVsbDtcbiAgICAgICAgdGhpcy5wb3M0ID0gbnVsbDtcblxuICAgICAgICB0aGlzLl9yZXNpemVNb3VzZURvd24gPSAoZXYpID0+IHtcbiAgICAgICAgICAgIGV2LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB0aGlzLnBvczMgPSBldi5jbGllbnRYO1xuICAgICAgICAgICAgdGhpcy5wb3M0ID0gZXYuY2xpZW50WTtcbiAgICAgICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIHRoaXMuX3Jlc2l6ZU1vdXNlTW92ZSk7XG4gICAgICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgdGhpcy5fcmVzaXplTW91c2VVcCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9yZXNpemVNb3VzZU1vdmUgPSAoZXYpID0+IHtcbiAgICAgICAgICAgIGV2LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB0aGlzLnBvczEgPSB0aGlzLnBvczMgLSBldi5jbGllbnRYO1xuICAgICAgICAgICAgdGhpcy5wb3MyID0gdGhpcy5wb3M0IC0gZXYuY2xpZW50WTtcbiAgICAgICAgICAgIHRoaXMucG9zMyA9IGV2LmNsaWVudFg7XG4gICAgICAgICAgICB0aGlzLnBvczQgPSBldi5jbGllbnRZO1xuICAgICAgICAgICAgdGhpcy5fcmVzaXplKCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9yZXNpemVNb3VzZVVwID0gKGV2KSA9PiB7XG4gICAgICAgICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCB0aGlzLl9yZXNpemVNb3VzZU1vdmUpO1xuICAgICAgICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIHRoaXMuX3Jlc2l6ZU1vdXNlVXApO1xuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICBfc2V0RWxlbWVudEhlaWdodChlbGVtZW50LCBoZWlnaHQpIHtcbiAgICAgICAgZWxlbWVudC5zdHlsZS5oZWlnaHQgPSBoZWlnaHQ7XG4gICAgICAgIGVsZW1lbnQuc3R5bGUubWluSGVpZ2h0ID0gaGVpZ2h0O1xuICAgICAgICBlbGVtZW50LnN0eWxlLm1heEhlaWdodCA9IGhlaWdodDtcbiAgICB9XG5cblxuICAgIF9zZXRFbGVtZW50V2lkdGgoZWxlbWVudCwgd2lkdGgpIHtcbiAgICAgICAgZWxlbWVudC5zdHlsZS53aWR0aCA9IHdpZHRoO1xuICAgICAgICBlbGVtZW50LnN0eWxlLm1pbldpZHRoID0gd2lkdGg7XG4gICAgICAgIGVsZW1lbnQuc3R5bGUubWF4V2lkdGggPSB3aWR0aDtcbiAgICB9XG5cblxuICAgIF9yZXNpemUoKSB7XG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuZGlyZWN0aW9uID09ICdjb2x1bW4nKSB7XG4gICAgICAgICAgICB2YXIgbWF4U2l6ZSA9IHRoaXMuZWxlbWVudC5vZmZzZXRIZWlnaHQgLSB0aGlzLm1pblNpemU7XG4gICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLnBhbmUxU2l6ZSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgdmFyIHNpemUgPSAodGhpcy5wYW5lMS5lbGVtZW50Lm9mZnNldEhlaWdodCAtIHRoaXMucG9zMik7XG4gICAgICAgICAgICAgICAgaWYgKHNpemUgPiBtYXhTaXplKSB7IHJldHVybiB9XG4gICAgICAgICAgICAgICAgaWYgKHNpemUgPCB0aGlzLm1pblNpemUpIHsgcmV0dXJuIH1cbiAgICAgICAgICAgICAgICB0aGlzLl9zZXRFbGVtZW50SGVpZ2h0KHRoaXMucGFuZTEuZWxlbWVudCwgc2l6ZSArICdweCcpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB2YXIgc2l6ZSA9ICh0aGlzLnBhbmUyLmVsZW1lbnQub2Zmc2V0SGVpZ2h0ICsgdGhpcy5wb3MyKTtcbiAgICAgICAgICAgICAgICBpZiAoc2l6ZSA+IG1heFNpemUpIHsgcmV0dXJuIH1cbiAgICAgICAgICAgICAgICBpZiAoc2l6ZSA8IHRoaXMubWluU2l6ZSkgeyByZXR1cm4gfVxuICAgICAgICAgICAgICAgIHRoaXMuX3NldEVsZW1lbnRIZWlnaHQodGhpcy5wYW5lMi5lbGVtZW50LCBzaXplICsgJ3B4Jyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YXIgbWF4U2l6ZSA9IHRoaXMuZWxlbWVudC5vZmZzZXRXaWR0aCAtIHRoaXMubWluU2l6ZTtcbiAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMucGFuZTFTaXplICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICB2YXIgc2l6ZSA9ICh0aGlzLnBhbmUxLmVsZW1lbnQub2Zmc2V0V2lkdGggLSB0aGlzLnBvczEpO1xuICAgICAgICAgICAgICAgIGlmIChzaXplID49IG1heFNpemUpIHsgcmV0dXJuIH1cbiAgICAgICAgICAgICAgICBpZiAoc2l6ZSA8IHRoaXMubWluU2l6ZSkgeyByZXR1cm4gfVxuICAgICAgICAgICAgICAgIHRoaXMuX3NldEVsZW1lbnRXaWR0aCh0aGlzLnBhbmUxLmVsZW1lbnQsIHNpemUgKydweCcpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB2YXIgc2l6ZSA9ICh0aGlzLnBhbmUyLmVsZW1lbnQub2Zmc2V0V2lkdGggKyB0aGlzLnBvczEpO1xuICAgICAgICAgICAgICAgIGlmIChzaXplID4gbWF4U2l6ZSkgeyByZXR1cm4gfVxuICAgICAgICAgICAgICAgIGlmIChzaXplIDwgdGhpcy5taW5TaXplKSB7IHJldHVybiB9XG4gICAgICAgICAgICAgICAgdGhpcy5fc2V0RWxlbWVudFdpZHRoKHRoaXMucGFuZTIuZWxlbWVudCwgc2l6ZSArJ3B4Jyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIF9jcmVhdGVSZXNpemVyRWxlbWVudCgpIHtcbiAgICAgICAgdGhpcy5yZXNpemVyRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICB0aGlzLnJlc2l6ZXJFbGVtZW50LnN0eWxlLnpJbmRleCA9ICcxMDAnO1xuICAgICAgICB0aGlzLnJlc2l6ZXJFbGVtZW50LmNsYXNzTmFtZSA9ICdyZXNpemVyJztcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5kaXJlY3Rpb24gPT0gJ2NvbHVtbicpIHtcbiAgICAgICAgICAgIHRoaXMucmVzaXplckVsZW1lbnQuc3R5bGUuaGVpZ2h0ID0gKHRoaXMucmVzaXplclNpemUpICsgJ3B4JztcbiAgICAgICAgICAgIHRoaXMucmVzaXplckVsZW1lbnQuc3R5bGUubWFyZ2luVG9wID0gJy0nICsgKHRoaXMucmVzaXplclNpemUgLyAyKSArICdweCc7XG4gICAgICAgICAgICB0aGlzLnJlc2l6ZXJFbGVtZW50LnN0eWxlLm1hcmdpbkJvdHRvbSA9ICctJyArICh0aGlzLnJlc2l6ZXJTaXplIC8gMikgKyAncHgnO1xuICAgICAgICAgICAgdGhpcy5yZXNpemVyRWxlbWVudC5zdHlsZS53aWR0aCA9ICcxMDAlJztcbiAgICAgICAgICAgIHRoaXMucmVzaXplckVsZW1lbnQuc3R5bGUuY3Vyc29yID0gJ25zLXJlc2l6ZSdcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMucmVzaXplckVsZW1lbnQuc3R5bGUud2lkdGggPSAodGhpcy5yZXNpemVyU2l6ZSkgKydweCc7XG4gICAgICAgICAgICB0aGlzLnJlc2l6ZXJFbGVtZW50LnN0eWxlLm1hcmdpbkxlZnQgPSAnLScgKyAodGhpcy5yZXNpemVyU2l6ZSAvIDIpICsncHgnO1xuICAgICAgICAgICAgdGhpcy5yZXNpemVyRWxlbWVudC5zdHlsZS5tYXJnaW5SaWdodCA9ICctJyArICh0aGlzLnJlc2l6ZXJTaXplIC8gMikgKydweCc7XG4gICAgICAgICAgICB0aGlzLnJlc2l6ZXJFbGVtZW50LnN0eWxlLmhlaWdodCA9ICcxMDAlJztcbiAgICAgICAgICAgIHRoaXMucmVzaXplckVsZW1lbnQuc3R5bGUuY3Vyc29yID0gJ2V3LXJlc2l6ZSdcbiAgICAgICAgfVxuICAgICAgICAvL3RoaXMucmVzaXplckVsZW1lbnQuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gJ3JlZCc7XG4gICAgICAgIHRoaXMucmVzaXplckVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5fcmVzaXplTW91c2VEb3duKTtcblxuICAgICAgICByZXR1cm4gdGhpcy5yZXNpemVyRWxlbWVudDtcbiAgICB9XG5cblxuICAgIGNyZWF0ZUVsZW1lbnQoKSB7XG4gICAgICAgIHN1cGVyLmNyZWF0ZUVsZW1lbnQoKTtcblxuICAgICAgICB0aGlzLmVsZW1lbnQuc3R5bGUuZmxleEdyb3cgPSAnMSc7XG5cbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5kaXJlY3Rpb24gPT0gJ2NvbHVtbicpIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5zdHlsZS5mbGV4RGlyZWN0aW9uID0gJ2NvbHVtbic7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5wYW5lMS5jcmVhdGVFbGVtZW50KCkpO1xuXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMucGFuZTFTaXplICE9IG51bGwgfHwgdGhpcy5vcHRpb25zLnBhbmUyU2l6ZSAhPSBudWxsKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLnJlc2l6YWJsZSA9PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5lbGVtZW50LmFwcGVuZENoaWxkKHRoaXMuX2NyZWF0ZVJlc2l6ZXJFbGVtZW50KCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB0aGlzLmVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5wYW5lMi5jcmVhdGVFbGVtZW50KCkpO1xuXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMucGFuZTFTaXplICE9IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMucGFuZTIuZWxlbWVudC5zdHlsZS5mbGV4R3JvdyA9IDE7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMuZGlyZWN0aW9uID09ICdjb2x1bW4nKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fc2V0RWxlbWVudEhlaWdodCh0aGlzLnBhbmUxLmVsZW1lbnQsIHRoaXMub3B0aW9ucy5wYW5lMVNpemUpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9zZXRFbGVtZW50V2lkdGgodGhpcy5wYW5lMS5lbGVtZW50LCB0aGlzLm9wdGlvbnMucGFuZTFTaXplKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMucGFuZTJTaXplICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnBhbmUxLmVsZW1lbnQuc3R5bGUuZmxleEdyb3cgPSAxO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMuZGlyZWN0aW9uID09ICdjb2x1bW4nKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vVGhpcyB3b3JrcyBub3dcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fc2V0RWxlbWVudEhlaWdodCh0aGlzLnBhbmUyLmVsZW1lbnQsIHRoaXMub3B0aW9ucy5wYW5lMlNpemUpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3NldEVsZW1lbnRXaWR0aCh0aGlzLnBhbmUyLmVsZW1lbnQsIHRoaXMub3B0aW9ucy5wYW5lMlNpemUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wYW5lMS5lbGVtZW50LnN0eWxlLmZsZXhHcm93ID0gMTtcbiAgICAgICAgICAgICAgICB0aGlzLnBhbmUyLmVsZW1lbnQuc3R5bGUuZmxleEdyb3cgPSAxO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5wYW5lMS5lbGVtZW50LnN0eWxlLmZsZXhEaXJlY3Rpb24gPSAnY29sdW1uJ1xuICAgICAgICB0aGlzLnBhbmUyLmVsZW1lbnQuc3R5bGUuZmxleERpcmVjdGlvbiA9ICdjb2x1bW4nXG5cbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudDtcbiAgICB9XG59IiwiY29uc3QgQ29udHJvbCA9IHJlcXVpcmUoXCIuL2NvbnRyb2xcIik7XG5cbmNvbnN0IFZBTElEX1RZUEVTID0gWyd0ZXh0JywgJ2RhdGUnLCAnZGF0ZXRpbWUtbG9jYWwnLCAncGFzc3dvcmQnLCAnZW1haWwnLCAndGVsJywgJ251bWJlcicsICd0aW1lJywgJ3VybCddXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgVGV4dEJveCBleHRlbmRzIENvbnRyb2wge1xuICAgIGNvbnN0cnVjdG9yKG9wdGlvbnMpIHtcbiAgICAgICAgLyogT3B0aW9uc1xuICAgICAgICAgKiAgcGxhY2Vob2xkZXI9XCJcIlxuICAgICAgICAgKiAgdHlwZT1WQUxJRF9UWVBFIG9yIHRleHRhcmVhXG4gICAgICAgICAqICByb3dzPTJcbiAgICAgICAgICovXG4gICAgICAgIHN1cGVyKG9wdGlvbnMpO1xuICAgIH1cblxuICAgIHZhbHVlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50LnZhbHVlO1xuICAgIH1cblxuICAgIHNldFZhbHVlKHZhbHVlKSB7XG4gICAgICAgIHRoaXMuZWxlbWVudC52YWx1ZSA9IHZhbHVlO1xuICAgIH1cblxuICAgIGlzQmxhbmsoKSB7XG4gICAgICAgIGlmICh0aGlzLmVsZW1lbnQudmFsdWUgPT0gJycpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBsb2NrKCkge1xuICAgICAgICB0aGlzLmVsZW1lbnQuc2V0QXR0cmlidXRlKCdyZWFkb25seScsICcnKTtcbiAgICB9XG5cbiAgICB1bmxvY2soKSB7XG4gICAgICAgIHRoaXMuZWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUoJ3JlYWRvbmx5Jyk7XG4gICAgfVxuXG4gICAgY3JlYXRlRWxlbWVudCgpIHtcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy50eXBlID09ICd0ZXh0YXJlYScpIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RleHRhcmVhJyk7XG4gICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLnJvd3MgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHRoaXMuZWxlbWVudC5zZXRBdHRyaWJ1dGUoJ3Jvd3MnLCB0aGlzLm9wdGlvbnMucm93cyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLnJlc2l6ZSAhPSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5lbGVtZW50LnN0eWxlLnJlc2l6ZSA9ICdub25lJ1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcbiAgICAgICAgICAgIGlmIChWQUxJRF9UWVBFUy5pbmNsdWRlcyh0aGlzLm9wdGlvbnMudHlwZSkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmVsZW1lbnQuc2V0QXR0cmlidXRlKCd0eXBlJywgdGhpcy5vcHRpb25zLnR5cGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5lbGVtZW50LnNldEF0dHJpYnV0ZSgnc2l6ZScsIDEpO1xuXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMub25LZXlVcCkge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJywgKGV2KSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zLm9uS2V5VXAoZXYpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMucGxhY2Vob2xkZXIgIT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LnNldEF0dHJpYnV0ZSgncGxhY2Vob2xkZXInLCB0aGlzLm9wdGlvbnMucGxhY2Vob2xkZXIpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudFxuICAgIH1cblxufVxuIiwiY29uc3QgQ29udHJvbCA9IHJlcXVpcmUoXCIuL2NvbnRyb2xcIik7XG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgVGlsZSBleHRlbmRzIENvbnRyb2wge1xuICAgIGNvbnN0cnVjdG9yKHRpdGxlLCBvcHRpb25zKSB7XG4gICAgICAgIHN1cGVyKG9wdGlvbnMpXG5cbiAgICAgICAgdGhpcy50aXRsZSA9IHRpdGxlXG4gICAgfVxuXG4gICAgY3JlYXRlRWxlbWVudCgpIHtcbiAgICAgICAgc3VwZXIuY3JlYXRlRWxlbWVudCgpO1xuXG4gICAgICAgIHRoaXMuZWxlbWVudC5jbGFzc05hbWUgPSAndGlsZSc7XG4gICAgICAgIHRoaXMuZWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gJ2ZsZXgnO1xuICAgICAgICB0aGlzLmVsZW1lbnQuc3R5bGUuZmxleERpcmVjdGlvbiA9ICdjb2x1bW4nO1xuICAgICAgICBcbiAgICAgICAgdGhpcy5fdGl0bGVFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaDEnKTtcbiAgICAgICAgdGhpcy5fdGl0bGVFbGVtZW50LmNsYXNzTmFtZSA9ICd0aWxlLXRpdGxlJztcbiAgICAgICAgdGhpcy5fdGl0bGVFbGVtZW50LmlubmVySFRNTCA9IHRoaXMudGl0bGU7XG4gICAgICAgIHRoaXMuZWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLl90aXRsZUVsZW1lbnQpO1xuXG4gICAgICAgIHRoaXMuX3RpbGVCb2R5RWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICB0aGlzLl90aWxlQm9keUVsZW1lbnQuY2xhc3NOYW1lID0gJ3RpbGUtYm9keSc7XG4gICAgICAgIHRoaXMuZWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLl90aWxlQm9keUVsZW1lbnQpO1xuXG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnQ7XG4gICAgfVxufSIsImNvbnN0IExvZ2dlciA9IHJlcXVpcmUoXCIuL2FwcC9sb2dnZXJcIik7XG5jb25zdCBDb25uZWN0aW9uID0gcmVxdWlyZShcIi4vYXBwL2Nvbm5lY3Rpb25cIik7XG5jb25zdCBMb2dpbkRpYWxvZyA9IHJlcXVpcmUoXCIuL2FwcC9kaWFsb2cvbG9naW4tZGlhbG9nXCIpO1xuY29uc3QgUGF0aWVudEJyb3dzZXIgPSByZXF1aXJlKCcuL2FwcC9wYW5lbC9wYXRpZW50LWJyb3dzZXInKTtcblxubG9nZ2VyID0gbmV3IExvZ2dlcigpO1xuY29ubmVjdGlvbiA9IG5ldyBDb25uZWN0aW9uKGxvZ2dlcik7XG5cbmRsZ0xvZ2luID0gbmV3IExvZ2luRGlhbG9nKCk7XG5wbmxQYXRpZW50QnJvd3NlciA9IG5ldyBQYXRpZW50QnJvd3NlcigpXG5cbmRpc3BsYXlQYXRpZW50cyA9IChkYXRhKSA9PiB7XG4gICAgdmFyIHJlc3VsdCA9IFwiXCI7XG4gICAgXG4gICAgZGF0YVsncGF0aWVudHMnXS5mb3JFYWNoKGVsZW1lbnQgPT4ge1xuICAgICAgICByZXN1bHQgKz0gYDx0cj48dGQ+JHtlbGVtZW50WydpZCddfTwvdGQ+PHRkPiR7ZWxlbWVudFsnbmFtZSddfTwvdGQ+PHRkPiR7ZWxlbWVudFsndXJsJ119PC90ZD48L3RyPmBcbiAgICB9KTtcblxuICAgIGRvY3VtZW50LmJvZHkuaW5uZXJIVE1MID0gKFxuICAgICAgICBgPHRhYmxlIGNsYXNzPVwidGFibGUgdGFibGUtc3RyaXBlZCB0YWJsZS1zbVwiPlxuICAgICAgICAgICAgPHRoZWFkPlxuICAgICAgICAgICAgICAgIDx0cj48dGQ+SWQ8L3RkPjx0ZD5OYW1lPC90ZD48dGQ+VVJMPC90ZD48L3RyPlxuICAgICAgICAgICAgPC9oZWFkPlxuICAgICAgICAgICAgPHRib2R5PlxuICAgICAgICAgICAgICAgICR7cmVzdWx0fVxuICAgICAgICAgICAgPC90Ym9keT5cbiAgICAgICAgPC90YWJsZT5gXG4gICAgKTtcbn1cblxuc2hvd01haW5XaW5kb3cgPSAoKSA9PiB7XG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChwbmxQYXRpZW50QnJvd3Nlci5jcmVhdGVFbGVtZW50KCkpO1xufVxuXG5cbmRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoZGxnTG9naW4uY3JlYXRlRWxlbWVudCgpKTtcblxuZGxnTG9naW4uZm9ybS5zZXRWYWx1ZSh7XG4gICAgaW5kZXhfdXJsOiAnaHR0cDovLzEyNy4wLjAuMTo1MDAwL2FwaS8nLFxuICAgIHVzZXJuYW1lOiAnYWRtaW4nLFxuICAgIHBhc3N3b3JkOiAnYSdcbn0pXG5cbmRsZ0xvZ2luLnRyeUxvZ2luKFxuICAgICgpID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coXCJMb2dpbiBTdWNlc3NmdWwuXCIpO1xuICAgICAgICBzaG93TWFpbldpbmRvdygpO1xuICAgIH0sXG4gICAgKCkgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhcIkNhbmNlbGxlZC5cIilcbiAgICB9XG4pO1xuXG5cbi8qXG5jb25zdCBJY2QxMENvZGVyRGlhbG9nID0gcmVxdWlyZSgnLi9hcHAvZGlhbG9nL2ljZDEwY29kZXItZGlhbG9nJyk7XG5cbmljZDEwID0gbmV3IEljZDEwQ29kZXJEaWFsb2coKTtcblxuZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChpY2QxMC5jcmVhdGVFbGVtZW50KCkpO1xuXG5pY2QxMC5zaG93KFxuICAgICh2YWx1ZSkgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyh2YWx1ZSk7XG4gICAgfSxcbiAgICAoKSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiQ2FuY2VsbGVkXCIpO1xuICAgIH1cbik7Ki9cblxuXG4vKlxuY29uc3QgTGlzdEJveCA9ICByZXF1aXJlKCcuL2NvbnRyb2xzL2xpc3QtYm94Jyk7XG5jb25zdCBUZXh0Qm94ID0gcmVxdWlyZSgnLi9jb250cm9scy90ZXh0LWJveCcpO1xuXG52YXIgbHN0ID0gbmV3IExpc3RCb3goXG4gICAgKGl0ZW0pID0+IHtcbiAgICAgICAgcmV0dXJuIGl0ZW0uaWQ7XG4gICAgfSxcbiAgICAoaXRlbSkgPT4ge1xuICAgICAgICByZXR1cm4gaXRlbS5sYWJlbDtcbiAgICB9LFxuICAgIChpdGVtKSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKGl0ZW0pO1xuICAgIH0sXG4gICAge1xuICAgICAgICBoZWlnaHQ6ICcxMDBweCdcbiAgICB9XG4pO1xuXG5kb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGxzdC5jcmVhdGVFbGVtZW50KCkpO1xudmFyIGRhdGEgPSBbXVxuZm9yICh2YXIgaSA9IDA7IGkgPCAxMDA7IGkrKykge1xuICAgIGRhdGEucHVzaCh7XG4gICAgICAgIGlkOiBpLFxuICAgICAgICBsYWJlbDogaVxuICAgIH0pXG59XG5sc3Quc2V0RGF0YShkYXRhKTtcblxudHh0ID0gbmV3IFRleHRCb3goKTtcbmRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQodHh0LmNyZWF0ZUVsZW1lbnQoKSk7XG50eHQuZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXl1cCcsIChldnQpID0+IHtcbiAgICBsc3Quc2V0U2VsZWN0aW9uKHR4dC52YWx1ZSgpKTtcbiAgICBjb25zb2xlLmxvZyh0eHQudmFsdWUoKSk7XG59KVxuXG5cbmNvbnN0IFJhZGlvTGlzdEJveCA9IHJlcXVpcmUoJy4vY29udHJvbHMvcmFkaW8tbGlzdC1ib3gnKTtcblxudmFyIHJhZGxzdCA9IG5ldyBSYWRpb0xpc3RCb3goXG4gICAgKGl0ZW0pID0+IHtcbiAgICAgICAgcmV0dXJuIGl0ZW0uaWQ7XG4gICAgfSxcbiAgICAoaXRlbSkgPT4ge1xuICAgICAgICByZXR1cm4gaXRlbS5sYWJlbDtcbiAgICB9LFxuICAgIChpdGVtKSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKGl0ZW0pO1xuICAgIH0sXG4gICAge1xuICAgICAgICBoZWlnaHQ6ICcxMDBweCdcbiAgICB9XG4pO1xuXG5kb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHJhZGxzdC5jcmVhdGVFbGVtZW50KCkpO1xudmFyIGRhdGEgPSBbXVxuZm9yICh2YXIgaSA9IDA7IGkgPCAxMDA7IGkrKykge1xuICAgIGRhdGEucHVzaCh7XG4gICAgICAgIGlkOiBpLFxuICAgICAgICBsYWJlbDogJ0xCTCcgKyBpXG4gICAgfSlcbn1cbnJhZGxzdC5zZXREYXRhKGRhdGEpO1xuXG5yYWR0eHQgPSBuZXcgVGV4dEJveCgpO1xuZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChyYWR0eHQuY3JlYXRlRWxlbWVudCgpKTtcbnJhZHR4dC5lbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJywgKGV2dCkgPT4ge1xuICAgIHJhZGxzdC5zZXRTZWxlY3Rpb24ocmFkdHh0LnZhbHVlKCkpO1xuICAgIGNvbnNvbGUubG9nKHR4dC52YWx1ZSgpKTtcbn0pXG5cblxuLy9TZWxlY3QgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG5jb25zdCBTZWxlY3QgPSByZXF1aXJlKCcuL2NvbnRyb2xzL3NlbGVjdCcpO1xuXG5zZWwgPSBuZXcgU2VsZWN0KFxuICAgIChpdGVtKSA9PiB7XG4gICAgICAgIHJldHVybiBpdGVtLmlkO1xuICAgIH0sXG4gICAgKGl0ZW0pID0+IHtcbiAgICAgICAgcmV0dXJuIGl0ZW0ubGFiZWw7XG4gICAgfSxcbiAgICB7XG4gICAgICAgIHBsYWNlaG9sZGVyOiAnTW9kaWZpZXInXG4gICAgfVxuKTtcblxuZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChzZWwuY3JlYXRlRWxlbWVudCgpKTtcblxuc2VsLnNldERhdGEoZGF0YSk7XG5cblxuY29uc3QgQnV0dG9uID0gcmVxdWlyZSgnLi9jb250cm9scy9idXR0b24nKTtcblxuYnRuID0gbmV3IEJ1dHRvbihcbiAgICAnU2VsZWN0IFZhbHVlJyxcbiAgICAoZXYpID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coc2VsLnZhbHVlKCkpO1xuICAgIH1cbilcblxuZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChidG4uY3JlYXRlRWxlbWVudCgpKTtcblxuXG5idG4gPSBuZXcgQnV0dG9uKFxuICAgICdTZXQnLFxuICAgIChldikgPT4ge1xuICAgICAgICBzZWwuc2V0U2VsZWN0aW9uKDIwKTtcbiAgICB9XG4pXG5kb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGJ0bi5jcmVhdGVFbGVtZW50KCkpO1xuXG5cbi8vU2VsZWN0IEZpZWxkICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuXG5jb25zdCBTZWxlY3RGaWVsZCA9IHJlcXVpcmUoJy4vY29udHJvbHMvZm9ybS9zZWxlY3QtZmllbGQnKTtcblxuc2VsRiA9IG5ldyBTZWxlY3RGaWVsZChcbiAgICAnbnVtYmVyJyxcbiAgICAoaXRlbSkgPT4ge1xuICAgICAgICByZXR1cm4gaXRlbS5pZDtcbiAgICB9LFxuICAgIChpdGVtKSA9PiB7XG4gICAgICAgIHJldHVybiBpdGVtLmxhYmVsO1xuICAgIH0sXG4gICAge1xuICAgICAgICBwbGFjZWhvbGRlcjogJ01vZGlmaWVyJyxcbiAgICAgICAgbGFiZWw6ICdNb2RpZmllcidcbiAgICB9XG4pXG5cbmRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoc2VsRi5jcmVhdGVFbGVtZW50KCkpO1xuXG5zZWxGLnNldERhdGEoZGF0YSk7XG5cbmJ0biA9IG5ldyBCdXR0b24oXG4gICAgJ0xvY2snLFxuICAgIChldikgPT4ge1xuICAgICAgICBzZWxGLmxvY2soKTtcbiAgICB9XG4pXG5kb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGJ0bi5jcmVhdGVFbGVtZW50KCkpO1xuXG5idG4gPSBuZXcgQnV0dG9uKFxuICAgICd1bmxvY2snLFxuICAgIChldikgPT4ge1xuICAgICAgICBzZWxGLnVubG9jaygpO1xuICAgIH1cbilcbmRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoYnRuLmNyZWF0ZUVsZW1lbnQoKSk7XG5cbmJ0biA9IG5ldyBCdXR0b24oXG4gICAgJ1NldCcsXG4gICAgKGV2KSA9PiB7XG4gICAgICAgIHNlbEYuc2V0VmFsdWUoZGF0YVsxMF0pO1xuICAgIH1cbilcbmRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoYnRuLmNyZWF0ZUVsZW1lbnQoKSk7XG5cbmJ0biA9IG5ldyBCdXR0b24oXG4gICAgJ0dldCcsXG4gICAgKGV2KSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKHNlbEYudmFsdWUoKSk7XG4gICAgfVxuKVxuZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChidG4uY3JlYXRlRWxlbWVudCgpKTtcbiovXG5cblxuLy9TcGxpdHRlciBXaW5kb1xuLypcbmNvbnN0IENvbnRyb2wgPSByZXF1aXJlKCcuL2NvbnRyb2xzL2NvbnRyb2wnKTtcbmNvbnN0IFNwbGl0dGVyID0gcmVxdWlyZSgnLi9jb250cm9scy9zcGxpdHRlcicpO1xuY29uc3QgTGlzdEJveCA9IHJlcXVpcmUoJy4vY29udHJvbHMvbGlzdC1ib3gnKTtcblxucDAxID0gbmV3IExpc3RCb3goKTtcbnAwMiA9IG5ldyBMaXN0Qm94KCk7XG5cbnAxID0gbmV3IExpc3RCb3goXG4gICAgKGl0ZW0pID0+IHtcbiAgICAgICAgcmV0dXJuIGl0ZW0uaWQ7XG4gICAgfSxcbiAgICAoaXRlbSkgPT4ge1xuICAgICAgICByZXR1cm4gaXRlbS5sYWJlbDtcbiAgICB9LFxuICAgIChpdGVtKSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKGl0ZW0pO1xuICAgIH0sXG4pO1xucDIgPSBuZXcgU3BsaXR0ZXIocDAxLCBwMDIsIHtcbiAgICBwYW5lMlNpemU6ICcyMDBweCcsXG4gICAgZGlyZWN0aW9uOiAnY29sdW1uJyxcbiAgICByZXNpemFibGU6IHRydWVcbn0pXG5cbi8vcDIgPSBuZXcgQ29udHJvbCgpO1xuXG5zcGwgPSBuZXcgU3BsaXR0ZXIocDEsIHAyLCB7XG4gICAgcGFuZTJTaXplOiAnMjUwcHgnLFxuICAgIC8vZGlyZWN0aW9uOiAnY29sdW1uJ1xuICAgIHJlc2l6YWJsZTogdHJ1ZVxufSk7XG5cbmRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoc3BsLmNyZWF0ZUVsZW1lbnQoKSk7XG5cblxudmFyIGRhdGEgPSBbXVxuZm9yICh2YXIgaSA9IDA7IGkgPCAxMDA7IGkrKykge1xuICAgIGRhdGEucHVzaCh7XG4gICAgICAgIGlkOiBpLFxuICAgICAgICBsYWJlbDogJ0xCTCcgKyBpXG4gICAgfSlcbn1cbnAxLnNldERhdGEoZGF0YSk7XG5wMS5lbGVtZW50LnN0eWxlLmJvcmRlciA9ICdub25lJztcbnAxLmVsZW1lbnQuc3R5bGUuYm9yZGVyUmFkaXVzID0gJzAnO1xuXG4vL3AyLmVsZW1lbnQuaW5uZXJIVE1MID0gXCJMb0xcIjtcbiovXG5cblxuLypcbmNvbnN0IFBhdGllbnRCcm93c2VyID0gcmVxdWlyZSgnLi9hcHAvcGFuZWwvcGF0aWVudC1icm93c2VyJyk7XG5cbmIgPSBuZXcgUGF0aWVudEJyb3dzZXIoKTtcblxuZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChiLmNyZWF0ZUVsZW1lbnQoKSk7XG4qLyIsIi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG4ndXNlIHN0cmljdCc7XG5cbi8vIElmIG9iai5oYXNPd25Qcm9wZXJ0eSBoYXMgYmVlbiBvdmVycmlkZGVuLCB0aGVuIGNhbGxpbmdcbi8vIG9iai5oYXNPd25Qcm9wZXJ0eShwcm9wKSB3aWxsIGJyZWFrLlxuLy8gU2VlOiBodHRwczovL2dpdGh1Yi5jb20vam95ZW50L25vZGUvaXNzdWVzLzE3MDdcbmZ1bmN0aW9uIGhhc093blByb3BlcnR5KG9iaiwgcHJvcCkge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24ocXMsIHNlcCwgZXEsIG9wdGlvbnMpIHtcbiAgc2VwID0gc2VwIHx8ICcmJztcbiAgZXEgPSBlcSB8fCAnPSc7XG4gIHZhciBvYmogPSB7fTtcblxuICBpZiAodHlwZW9mIHFzICE9PSAnc3RyaW5nJyB8fCBxcy5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gb2JqO1xuICB9XG5cbiAgdmFyIHJlZ2V4cCA9IC9cXCsvZztcbiAgcXMgPSBxcy5zcGxpdChzZXApO1xuXG4gIHZhciBtYXhLZXlzID0gMTAwMDtcbiAgaWYgKG9wdGlvbnMgJiYgdHlwZW9mIG9wdGlvbnMubWF4S2V5cyA9PT0gJ251bWJlcicpIHtcbiAgICBtYXhLZXlzID0gb3B0aW9ucy5tYXhLZXlzO1xuICB9XG5cbiAgdmFyIGxlbiA9IHFzLmxlbmd0aDtcbiAgLy8gbWF4S2V5cyA8PSAwIG1lYW5zIHRoYXQgd2Ugc2hvdWxkIG5vdCBsaW1pdCBrZXlzIGNvdW50XG4gIGlmIChtYXhLZXlzID4gMCAmJiBsZW4gPiBtYXhLZXlzKSB7XG4gICAgbGVuID0gbWF4S2V5cztcbiAgfVxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyArK2kpIHtcbiAgICB2YXIgeCA9IHFzW2ldLnJlcGxhY2UocmVnZXhwLCAnJTIwJyksXG4gICAgICAgIGlkeCA9IHguaW5kZXhPZihlcSksXG4gICAgICAgIGtzdHIsIHZzdHIsIGssIHY7XG5cbiAgICBpZiAoaWR4ID49IDApIHtcbiAgICAgIGtzdHIgPSB4LnN1YnN0cigwLCBpZHgpO1xuICAgICAgdnN0ciA9IHguc3Vic3RyKGlkeCArIDEpO1xuICAgIH0gZWxzZSB7XG4gICAgICBrc3RyID0geDtcbiAgICAgIHZzdHIgPSAnJztcbiAgICB9XG5cbiAgICBrID0gZGVjb2RlVVJJQ29tcG9uZW50KGtzdHIpO1xuICAgIHYgPSBkZWNvZGVVUklDb21wb25lbnQodnN0cik7XG5cbiAgICBpZiAoIWhhc093blByb3BlcnR5KG9iaiwgaykpIHtcbiAgICAgIG9ialtrXSA9IHY7XG4gICAgfSBlbHNlIGlmIChpc0FycmF5KG9ialtrXSkpIHtcbiAgICAgIG9ialtrXS5wdXNoKHYpO1xuICAgIH0gZWxzZSB7XG4gICAgICBvYmpba10gPSBbb2JqW2tdLCB2XTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gb2JqO1xufTtcblxudmFyIGlzQXJyYXkgPSBBcnJheS5pc0FycmF5IHx8IGZ1bmN0aW9uICh4cykge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHhzKSA9PT0gJ1tvYmplY3QgQXJyYXldJztcbn07XG4iLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgc3RyaW5naWZ5UHJpbWl0aXZlID0gZnVuY3Rpb24odikge1xuICBzd2l0Y2ggKHR5cGVvZiB2KSB7XG4gICAgY2FzZSAnc3RyaW5nJzpcbiAgICAgIHJldHVybiB2O1xuXG4gICAgY2FzZSAnYm9vbGVhbic6XG4gICAgICByZXR1cm4gdiA/ICd0cnVlJyA6ICdmYWxzZSc7XG5cbiAgICBjYXNlICdudW1iZXInOlxuICAgICAgcmV0dXJuIGlzRmluaXRlKHYpID8gdiA6ICcnO1xuXG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiAnJztcbiAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihvYmosIHNlcCwgZXEsIG5hbWUpIHtcbiAgc2VwID0gc2VwIHx8ICcmJztcbiAgZXEgPSBlcSB8fCAnPSc7XG4gIGlmIChvYmogPT09IG51bGwpIHtcbiAgICBvYmogPSB1bmRlZmluZWQ7XG4gIH1cblxuICBpZiAodHlwZW9mIG9iaiA9PT0gJ29iamVjdCcpIHtcbiAgICByZXR1cm4gbWFwKG9iamVjdEtleXMob2JqKSwgZnVuY3Rpb24oaykge1xuICAgICAgdmFyIGtzID0gZW5jb2RlVVJJQ29tcG9uZW50KHN0cmluZ2lmeVByaW1pdGl2ZShrKSkgKyBlcTtcbiAgICAgIGlmIChpc0FycmF5KG9ialtrXSkpIHtcbiAgICAgICAgcmV0dXJuIG1hcChvYmpba10sIGZ1bmN0aW9uKHYpIHtcbiAgICAgICAgICByZXR1cm4ga3MgKyBlbmNvZGVVUklDb21wb25lbnQoc3RyaW5naWZ5UHJpbWl0aXZlKHYpKTtcbiAgICAgICAgfSkuam9pbihzZXApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGtzICsgZW5jb2RlVVJJQ29tcG9uZW50KHN0cmluZ2lmeVByaW1pdGl2ZShvYmpba10pKTtcbiAgICAgIH1cbiAgICB9KS5qb2luKHNlcCk7XG5cbiAgfVxuXG4gIGlmICghbmFtZSkgcmV0dXJuICcnO1xuICByZXR1cm4gZW5jb2RlVVJJQ29tcG9uZW50KHN0cmluZ2lmeVByaW1pdGl2ZShuYW1lKSkgKyBlcSArXG4gICAgICAgICBlbmNvZGVVUklDb21wb25lbnQoc3RyaW5naWZ5UHJpbWl0aXZlKG9iaikpO1xufTtcblxudmFyIGlzQXJyYXkgPSBBcnJheS5pc0FycmF5IHx8IGZ1bmN0aW9uICh4cykge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHhzKSA9PT0gJ1tvYmplY3QgQXJyYXldJztcbn07XG5cbmZ1bmN0aW9uIG1hcCAoeHMsIGYpIHtcbiAgaWYgKHhzLm1hcCkgcmV0dXJuIHhzLm1hcChmKTtcbiAgdmFyIHJlcyA9IFtdO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IHhzLmxlbmd0aDsgaSsrKSB7XG4gICAgcmVzLnB1c2goZih4c1tpXSwgaSkpO1xuICB9XG4gIHJldHVybiByZXM7XG59XG5cbnZhciBvYmplY3RLZXlzID0gT2JqZWN0LmtleXMgfHwgZnVuY3Rpb24gKG9iaikge1xuICB2YXIgcmVzID0gW107XG4gIGZvciAodmFyIGtleSBpbiBvYmopIHtcbiAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwga2V5KSkgcmVzLnB1c2goa2V5KTtcbiAgfVxuICByZXR1cm4gcmVzO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5kZWNvZGUgPSBleHBvcnRzLnBhcnNlID0gcmVxdWlyZSgnLi9kZWNvZGUnKTtcbmV4cG9ydHMuZW5jb2RlID0gZXhwb3J0cy5zdHJpbmdpZnkgPSByZXF1aXJlKCcuL2VuY29kZScpO1xuIl19
