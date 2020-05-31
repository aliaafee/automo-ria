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
},{"./status":7,"./user":8}],2:[function(require,module,exports){
const querystring = require('querystring');

const Dialog = require('../../controls/dialog/dialog');
const ResourceSearchBox = require('../../controls/resource-search-box');
const Button = require('../../controls/button');
const ResourceRadioList = require('../../controls/resource-radio-list');
const Form = require('../../controls/form/form');
const TextField = require('../../controls/form/text-field');
const SelectField = require('../../controls/form/select-field');


module.exports = class Icd10CoderDialog extends Dialog {
    constructor(options = {}) {
        options.width = '80%';

        super(options);

        this.selectedCategory = null;
        this.selectedBlockCode = null;

        this.selectedModifier = null;
        this.selectedModifierExtra = null;

        this.searchBox = new ResourceSearchBox(
            (item) => {
                return item.code;
            },
            (item) => {
                return `${item.code} ${item.preferred_plain}`;
            },
            (item) => {
                this._onSelectSearchResult(item);
            },
            {
                placeholder: 'Search ICD-10 Code',
                popupHeight: '200px'
            }
        )

        this.btnOk = new Button(
            options.okLabel != null ? options.okLabel : 'Save',
            (ev) => {
                this._onOk(ev);
            },
            {
                width: '80px'
            }
        );

        this.categoryList = new ResourceRadioList(
            (category) => {
                return category.code;
            },
            (category) => {
                return this._getCategoryLabel(category);
            },
            (category) => {
                this._onSelectCategory(category);
            },
            {
                height: '300px',
                onLink: (ev) => {
                    ev.preventDefault();
                    var query = ev.target.getAttribute('href');
                    var query_data = querystring.decode(query)
                    let code = query_data['category?code']
                    if (code != null) {
                        this.setSelectedCategoryFromCode(code, () => {});
                    }
                }
            }
        )

        this.form = new Form(
            {
                labelTop: true
            }
        );

        this.form.addField(new SelectField(
            'icd10modifier_class',
            (modifierClass) => {
                return modifierClass.code;
            },
            (modifierClass) => {
                return `${modifierClass.code_short} - ${modifierClass.preferred}`;
            },
            {
                label: 'Modifier'
            }
        ));

        this.form.addField(new SelectField(
            'icd10modifier_extra_class',
            (modifierClass) => {
                return modifierClass.code;
            },
            (modifierClass) => {
                return `${modifierClass.code_short} - ${modifierClass.preferred}`;
            },
            {
                label: 'Modifier Extra'
            }
        ));


        this.form.addField(new TextField(
            'comment',
            {
                label: "Comment",
                type: 'textarea',
                rows: 5
            }
        ));
    }

    show(onOk, onCancel) {
        this.searchBox.setResourceUrl(connection.resource_index.icd10.categories)

        super.show(onOk, onCancel);
    }

    value() {
        var result = this.form.value();
        result['icd10class'] = this.selectedCategory;
        return result;
    }

    getCategory(code, onDone) {
        var url = connection.resource_index.icd10.categories + code

        connection.get(
            url,
            data => {
                onDone(data);
            },
            (error) => {
                console.log("Not Found");
                onDone({});
            },
            () => {
                ;
            }
        )
    }

    loadSelectedBlock(onDone) {
        var url = connection.resource_index.icd10.categories + '?' + querystring.stringify(
            {
                block: this.selectedBlockCode,
                detailed: true,
                per_page: 100
            }
        )

        this.categoryList.setResourceUrl(url, onDone);
    }

    setSelectedCategoryFromCode(code, onDone) {
        this.getCategory(code, (category) => {
            this.setSelectedCategory(category, onDone);
        })
    }

    setSelectedCategory(category, onDone) {
        if (category == null) {
            onDone();
            return;
        }
        this.selectedCategory = category;
        this._loadModifiers();

        if (this.selectedBlockCode != null) {
            if (this.selectedBlockCode == this.selectedCategory.parent_block_code) {
                this.categoryList.setSelection(this.selectedCategory.code);
                onDone();
                return
            }
        }

        this.selectedBlockCode = this.selectedCategory.parent_block_code;

        this.loadSelectedBlock(() => {
            requestAnimationFrame(() => {
                //Extra time needed to allow the DOM to update before we can scroll to it
                this.categoryList.setSelection(this.selectedCategory.code);
                onDone()
            }) 
        })
    }

    _loadModifier(modifier, selectedModifier, modifierField) {
        if (modifier == null) {
            modifierField.clear();
            modifierField.hide();
            return;
        }

        if (selectedModifier != null) {
            if (modifier.code == selectedModifier.code) {
                return;
            }
        }

        modifierField.setLabel(modifier.name);

        var url = connection.resource_index.icd10.modifierclasses + '?' + querystring.stringify(
            {
                'modifier_code' : modifier.code
            }
        )

        connection.get(
            url,
            data => {
                modifierField.setData(data.items)
                modifierField.show();
            },
            (error) => {
                modifierField.hide();
            },
            () => {
                ;
            }
        )
    }

    _loadModifiers() {
        this._loadModifier(
            this.selectedCategory.modifier,
            this.selectedModifier,
            this.form.getFieldByName('icd10modifier_class'),
        );
        this.selectedModifier = this.selectedCategory.modifier;

        this._loadModifier(
            this.selectedCategory.modifier_extra,
            this.selectedModifierExtra,
            this.form.getFieldByName('icd10modifier_extra_class')
        );
        this.selectedModifierExtra = this.selectedCategory.modifier_extra;
    }

    _onSelectSearchResult(item) {
        this.setSelectedCategory(item, () => { });
    }

    _onSelectCategory(category) {
        this.selectedCategory = category;
        this._loadModifiers();
    }

    _getCategoryLabel(category) {
        var lusion = ""
        if (category.inclusion != null) {
            lusion += `
                <div class="lusion d-flex">
                    <div >${category.inclusion}</div>
                </div>`
        }
        if (category.exclusion != null) {
            lusion += `
                <div class="lusion d-flex">
                    <div class="label">Excl.:</div>
                    <div>${category.exclusion}</div>
                </div>`
        }
        if (category.note != null) {
            lusion += `
                <div class="lusion d-flex">
                    <div class="label">Note:</div>
                    <div>${category.note}</div>
                </div>`
        }
        var preferred_long = ""
        if (category.preferred_long != null) {
            preferred_long = `<div class="preferred-long">(${category.preferred_long})</div>`
        }
        return `
            <div class="category-label">
                <div class="code" code="${category.code}">
                    ${category.code}
                </div>
                <div class="text">
                    <div class="preferred">
                        ${category.preferred}
                    </div>
                    ${preferred_long}
                    <div class="lusions">${lusion}</div>
                </div>
            </div>
        `
    }

    createElement() {
        super.createElement();

        this.element.classList.add('icd10coder');

        this.headerElement.appendChild(this.searchBox.createElement());
        this.searchBox.element.style.flexGrow = 1;

        this.bodyElement.appendChild(this.categoryList.createElement());
        this.categoryList.element.classList.add('category-list');

        this.bodyElement.appendChild(this.form.createElement());
        this.form.element.classList.add('form');
        this.form.element.style.width = '200px';
        this.form.element.style.minWidth = '200px';

        this.form.hideField('icd10modifier_class');
        this.form.hideField('icd10modifier_extra_class');

        this.footerElement.appendChild(this.btnOk.createElement());

        return this.element;
    }
}
},{"../../controls/button":9,"../../controls/dialog/dialog":11,"../../controls/form/form":14,"../../controls/form/select-field":15,"../../controls/form/text-field":16,"../../controls/resource-radio-list":22,"../../controls/resource-search-box":23,"querystring":34}],3:[function(require,module,exports){
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
},{"../../controls/dialog/form-dialog":12,"../../controls/form/form":14,"../../controls/form/text-field":16,"../../controls/spinner":27}],4:[function(require,module,exports){
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
            //console.log(message);
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
},{}],5:[function(require,module,exports){
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
},{"../../controls/control":10,"../../controls/resource-list":21,"../../controls/splitter":28,"../../controls/text-box":29,"./patient-panel":6,"querystring":34}],6:[function(require,module,exports){
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
},{"../../controls/resource-accordion":20,"../../controls/resource-accordion-item":19,"../../controls/scrolled":24,"../../controls/tile":30}],7:[function(require,module,exports){
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

},{}],8:[function(require,module,exports){
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
},{"./status":7}],9:[function(require,module,exports){
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

},{"./control":10}],10:[function(require,module,exports){

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

},{}],11:[function(require,module,exports){
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
},{"../control":10}],12:[function(require,module,exports){
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
},{"../button":9,"./dialog":11}],13:[function(require,module,exports){

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

},{"../control":10}],14:[function(require,module,exports){
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
},{"../control":10}],15:[function(require,module,exports){
const Select = require("../select");
const Field = require("./field");


module.exports = class SelectField extends Field {
    constructor(name, idFunction, labelFunction, options = {}) {
        super(name, options);

        this._select = new Select(
            idFunction,
            labelFunction,
            {
                placeholder: options.placeholder,
            }
        );
    }

    focus() {
        this._select.focus();
    }

    isBlank() {
        return this._select.isBlank();
    }

    value() {
        return this._select.value();
    }

    setValue(value) {
        this._select.setValue(value);
    }

    setData(data) {
        this._select.setData(data);
    }

    clear() {
        this._select.clear();
    }

    lock() {
        this._select.lock();
    }

    unlock() {
        this._select.unlock();
    }

    createElement() {
        super.createElement()

        this._placeholderElement.appendChild(
            this._select.createElement()
        );

        this._select.element.style.flexGrow = 1;

        return this.element;
    }

}
},{"../select":25,"./field":13}],16:[function(require,module,exports){
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

},{"../text-box":29,"./field":13}],17:[function(require,module,exports){
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
},{"./scrolled":24}],18:[function(require,module,exports){
const Control = require("./control");

module.exports = class Popup extends Control {
    constructor(referenceControl, options) {
        super(options);

        this.referenceControl = referenceControl

        this._resizeFunction = (ev) => {
            this._updateSize();
        }
    }

    _updateSize() {
        this.element.style.marginTop = (this.referenceControl.element.clientHeight) + 'px';
        this.element.style.width = (this.referenceControl.element.offsetWidth-0.5) + 'px';
    }

    popup() {
        this._updateSize()
        this.show();
        window.addEventListener('resize', this._resizeFunction);
    }

    hide() {
        super.hide();
        window.removeEventListener('resize', this._resizeFunction);
    }

    createElement() {
        super.createElement();

        this.element.className = 'popup';
        this.element.style.position = 'absolute';
        this.element.style.width = this.options.width;
        this.element.style.height = this.options.height;

        this.hide();

        return this.element;
    }
}
},{"./control":10}],19:[function(require,module,exports){
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
},{"./control":10,"./spinner":27}],20:[function(require,module,exports){
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
},{"./control":10,"./resource-accordion-item":19,"./spinner":27}],21:[function(require,module,exports){
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

    setResourceUrl(url, onDone) {
        this.spinner.show();
        this._listElement.style.display = 'none';
        connection.get(
            url,
            data => {
                //console.log(data);
                this.resource_data = data;
                this.setData(data.items);
                if (onDone) {
                    onDone();
                }
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
},{"./list-box":17,"./spinner":27,"./spinner-foreground":26}],22:[function(require,module,exports){
const ResourceList = require('./resource-list');


module.exports = class ResourceRadioList extends ResourceList {
    constructor(idFunction, labelFunction, onSelectItem, options) {
        /* idFunction(result) { return result.unique_id }
         * labelFunction(result) { return result.label }
         * onResultClicked(result) { do something using result }
         * 
         * Options:
         *  height
         *  onLink
         */
        super(idFunction, labelFunction, onSelectItem, options);

        this._onItemClicked = (event) => {
            this.clearSelection();

            this._selectedElement = event.target.parentElement;

            this._highlightSelection();
            this._onSelectItem(event);
        }
    }

    _highlightSelection() {
        //this._selectedElement.className = 'selected';
        this._selectedElement.firstChild.checked = true;
    }

    setSelection(itemId, scroll = true) {
        if (itemId == null || itemId == '') {
            this.clearSelection();
            return;
        }
        for (var i = 0; i < this._itemIds.length; i++) {
            if (this._itemIds[i] == itemId) {
                this.clearSelection()

                this._selectedElement = this._itemElements[i];
                this._selectedItem = this.data[i];
                
                this._highlightSelection();

                if (scroll) {
                    this._selectedElement.scrollIntoView();
                }
            }
        }
    }

    clearSelection() {
        if (this._selectedElement != null) {
            this._selectedElement.className = null;
            this._selectedElement.firstChild.checked = false;
        }
        this._selectedElement = null;

        this._selectedItem = null;
    }

    _createListItem(itemid, label) {
        var item = document.createElement('li');
        item.setAttribute('item-id', itemid);

        var radio = document.createElement('input');
        radio.type = 'radio';
        item.appendChild(radio);

        var labelElement = document.createElement('div');
        item.appendChild(labelElement);
        labelElement.innerHTML = label;

        radio.addEventListener('click', this._onItemClicked);

        return item;
    }

    displayData() {
        super.displayData();

        if (this.options.onLink != null) {
            var links = this.element.getElementsByTagName('a');
            for (var i = 0; i < links.length; i++) {
                links[i].addEventListener('click', this.options.onLink)
            }
        }
    }
}
},{"./resource-list":21}],23:[function(require,module,exports){
//const SearchBox = require("./search-box");
const querystring = require('querystring');

const Control = require("./control");
const Popup = require("./popup");
const TextBox = require("./text-box");
const ResourceList = require("./resource-list");


module.exports = class ResourceSearchBox extends Control {
    constructor(idFunction, labelFunction, onSelectResult, options={}) {
        /*
         * idFunction(result) { return result.unique_id }
         * labelFunction(result) { return result.label }
         * onSelectResult(result) { do something using code }
         * 
         * Options:
         *  placeholder
         *  populHeight
         */
        super(options);
        this.idFunction = idFunction;
        this.labelFunction = labelFunction;
        this.onSelectResult = onSelectResult;
        this.resourceUrl = "";

        this._textBox = new TextBox({
            placeholder: options.placeholder
        })

        this._popup = new Popup(this._textBox);

        this._listBox = new ResourceList(
            idFunction,
            labelFunction,
            (result) => {
                this._onSelectResult(result);
            },
            {
                height: options.popupHeight
            }
        )
    }

    setResourceUrl(url) {
        this.resourceUrl = url;
    }

    _search() {
        var query = this._textBox.value();

        if  (query == "") {
            this._hidePopup();
            return;
        }

        this._showPopup();
        this._listBox.setResourceUrl(
            this.resourceUrl + '?' + querystring.stringify(
                {
                    'q': query
                }
            )
        )
    }

    _showPopup() {
        this._textBox.element.classList.add('flat-bottom');
        this._listBox.element.classList.add('flat-top');
        this._popup.popup()
    }

    _hidePopup() {
        this._textBox.element.classList.remove('flat-bottom');
        this._listBox.element.classList.remove('flat-top');
        this._popup.hide();
    }

    _onSelectResult(result) {
        this._hidePopup();
        this.onSelectResult(result);
    }

    createElement() {
        super.createElement();

        this.element.className = 'search-box';

        this.element.appendChild(
            this._textBox.createElement()
        );
        this._textBox.element.style.flexGrow = 1;

        this.element.appendChild(
            this._popup.createElement()
        );

        this._popup.element.appendChild(
            this._listBox.createElement()
        );

        this._listBox.element.style.flexGrow = 1;

        this._textBox.element.addEventListener('keyup', (ev) => {
            if (ev.code == 'ArrowUp') {
                this._selectUp();
            } else if (ev.code == 'ArrowDown') {
                this._selectDown();
            } else {
                this._search();
            }
        });

        this._textBox.element.addEventListener('focusin', (ev) => {
            this._search();
        })

        var blurEvent = (ev) => {
            this._hidePopup();
        };

        this._textBox.element.addEventListener('blur', blurEvent)

        this._popup.element.addEventListener('mouseenter', (ev) => {
            this._textBox.element.removeEventListener('blur', blurEvent);
        })

        this._popup.element.addEventListener('mouseleave', (ev) => {
            this._textBox.element.addEventListener('blur', blurEvent)
        })

        return this.element;
    }
}
},{"./control":10,"./popup":18,"./resource-list":21,"./text-box":29,"querystring":34}],24:[function(require,module,exports){
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

},{"./control":10}],25:[function(require,module,exports){
const Control = require("./control");


module.exports = class Select extends Control {
    constructor(idFunction, labelFunction, options) {
        /* Options
         *  placeholder=""
         *  
         */
        super(options);

        this.idFunction = idFunction;
        this.labelFunction = labelFunction;

        this.data = [];
        this._itemIds = [];
    }

    value() {
        var selectedId = this.element.value;
        for (var i = 0; i < this._itemIds.length; i++) {
            if (this._itemIds[i] == selectedId) {
                return this.data[i];
            }
        }
        return null;
    }

    setValue(value) {
        this.setSelection(this.idFunction(value));
    }

    setData(data) {
        this.data = data;
        this.displayData();
    }

    clear() {
        this.data = [];
        this._itemIds = []
        this._itemElements = []
        this._clear();
    }

    setSelection(itemId) {
        this.element.value = itemId;
    }

    _clear() {
        while (this.element.firstChild) {
            this.element.firstChild.remove();
        }
    }

    _createListItem(itemid, label) {
        var item = document.createElement('option');
        item.setAttribute('value', itemid);
        item.innerText = label;

        return item;
    }

    displayData() {
        this._clear();

        this.element.appendChild(this._createListItem(
            null,
            `-- ${this.options.placeholder == null ? '' : this.options.placeholder} --`
        ));

        this._itemIds = []
        this._itemElements = []
        this.data.forEach((item) => {
            var item_id = this.idFunction(item);

            this._itemIds.push(item_id);

            var elem = this._createListItem(
                item_id,
                this.labelFunction(item)
            );

            this.element.appendChild(elem);
        })
    }

    isBlank() {
        if (this.element.value == null) {
            return true;
        }
        return false;
    }

    lock() {
        this.element.setAttribute('disabled', '');
    }

    unlock() {
        this.element.removeAttribute('disabled');
    }

    createElement() {
        this.element = document.createElement('select');

        if (this.options.placeholder != null) {
            this.element.setAttribute('placeholder', this.options.placeholder);
        }

        return this.element
    }

}

},{"./control":10}],26:[function(require,module,exports){
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

},{"./control":10}],27:[function(require,module,exports){
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
},{"./control":10}],28:[function(require,module,exports){
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
},{"./control":10}],29:[function(require,module,exports){
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

},{"./control":10}],30:[function(require,module,exports){
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
},{"./control":10}],31:[function(require,module,exports){
const Logger = require("./app/logger");
const Connection = require("./app/connection");
const LoginDialog = require("./app/dialog/login-dialog");
const PatientBrowser = require('./app/panel/patient-browser');
const Icd10CoderDialog = require('./app/dialog/icd10coder-dialog');

logger = new Logger();
connection = new Connection(logger);

dlgLogin = new LoginDialog();
pnlPatientBrowser = new PatientBrowser();
dlgIcd10 = new Icd10CoderDialog();


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
    /*
    document.body.appendChild(dlgIcd10.createElement());
    dlgIcd10.show(
        (value) => {
            console.log(value);
        },
        () => {
            console.log("Cancelled");
        }
    )
    */
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
},{"./app/connection":1,"./app/dialog/icd10coder-dialog":2,"./app/dialog/login-dialog":3,"./app/logger":4,"./app/panel/patient-browser":5}],32:[function(require,module,exports){
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

},{}],33:[function(require,module,exports){
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

},{}],34:[function(require,module,exports){
'use strict';

exports.decode = exports.parse = require('./decode');
exports.encode = exports.stringify = require('./encode');

},{"./decode":32,"./encode":33}]},{},[31]);
