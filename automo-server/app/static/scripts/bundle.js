(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';
var token = '%[a-f0-9]{2}';
var singleMatcher = new RegExp(token, 'gi');
var multiMatcher = new RegExp('(' + token + ')+', 'gi');

function decodeComponents(components, split) {
	try {
		// Try to decode the entire string first
		return decodeURIComponent(components.join(''));
	} catch (err) {
		// Do nothing
	}

	if (components.length === 1) {
		return components;
	}

	split = split || 1;

	// Split the array in 2 parts
	var left = components.slice(0, split);
	var right = components.slice(split);

	return Array.prototype.concat.call([], decodeComponents(left), decodeComponents(right));
}

function decode(input) {
	try {
		return decodeURIComponent(input);
	} catch (err) {
		var tokens = input.match(singleMatcher);

		for (var i = 1; i < tokens.length; i++) {
			input = decodeComponents(tokens, i).join('');

			tokens = input.match(singleMatcher);
		}

		return input;
	}
}

function customDecodeURIComponent(input) {
	// Keep track of all the replacements and prefill the map with the `BOM`
	var replaceMap = {
		'%FE%FF': '\uFFFD\uFFFD',
		'%FF%FE': '\uFFFD\uFFFD'
	};

	var match = multiMatcher.exec(input);
	while (match) {
		try {
			// Decode as big chunks as possible
			replaceMap[match[0]] = decodeURIComponent(match[0]);
		} catch (err) {
			var result = decode(match[0]);

			if (result !== match[0]) {
				replaceMap[match[0]] = result;
			}
		}

		match = multiMatcher.exec(input);
	}

	// Add `%C2` at the end of the map to make sure it does not replace the combinator before everything else
	replaceMap['%C2'] = '\uFFFD';

	var entries = Object.keys(replaceMap);

	for (var i = 0; i < entries.length; i++) {
		// Replace all decoded components
		var key = entries[i];
		input = input.replace(new RegExp(key, 'g'), replaceMap[key]);
	}

	return input;
}

module.exports = function (encodedURI) {
	if (typeof encodedURI !== 'string') {
		throw new TypeError('Expected `encodedURI` to be of type `string`, got `' + typeof encodedURI + '`');
	}

	try {
		encodedURI = encodedURI.replace(/\+/g, ' ');

		// Try the built in decoder first
		return decodeURIComponent(encodedURI);
	} catch (err) {
		// Fallback to a more advanced decoder
		return customDecodeURIComponent(encodedURI);
	}
};

},{}],2:[function(require,module,exports){
'use strict';
const strictUriEncode = require('strict-uri-encode');
const decodeComponent = require('decode-uri-component');
const splitOnFirst = require('split-on-first');

const isNullOrUndefined = value => value === null || value === undefined;

function encoderForArrayFormat(options) {
	switch (options.arrayFormat) {
		case 'index':
			return key => (result, value) => {
				const index = result.length;

				if (
					value === undefined ||
					(options.skipNull && value === null) ||
					(options.skipEmptyString && value === '')
				) {
					return result;
				}

				if (value === null) {
					return [...result, [encode(key, options), '[', index, ']'].join('')];
				}

				return [
					...result,
					[encode(key, options), '[', encode(index, options), ']=', encode(value, options)].join('')
				];
			};

		case 'bracket':
			return key => (result, value) => {
				if (
					value === undefined ||
					(options.skipNull && value === null) ||
					(options.skipEmptyString && value === '')
				) {
					return result;
				}

				if (value === null) {
					return [...result, [encode(key, options), '[]'].join('')];
				}

				return [...result, [encode(key, options), '[]=', encode(value, options)].join('')];
			};

		case 'comma':
		case 'separator':
			return key => (result, value) => {
				if (value === null || value === undefined || value.length === 0) {
					return result;
				}

				if (result.length === 0) {
					return [[encode(key, options), '=', encode(value, options)].join('')];
				}

				return [[result, encode(value, options)].join(options.arrayFormatSeparator)];
			};

		default:
			return key => (result, value) => {
				if (
					value === undefined ||
					(options.skipNull && value === null) ||
					(options.skipEmptyString && value === '')
				) {
					return result;
				}

				if (value === null) {
					return [...result, encode(key, options)];
				}

				return [...result, [encode(key, options), '=', encode(value, options)].join('')];
			};
	}
}

function parserForArrayFormat(options) {
	let result;

	switch (options.arrayFormat) {
		case 'index':
			return (key, value, accumulator) => {
				result = /\[(\d*)\]$/.exec(key);

				key = key.replace(/\[\d*\]$/, '');

				if (!result) {
					accumulator[key] = value;
					return;
				}

				if (accumulator[key] === undefined) {
					accumulator[key] = {};
				}

				accumulator[key][result[1]] = value;
			};

		case 'bracket':
			return (key, value, accumulator) => {
				result = /(\[\])$/.exec(key);
				key = key.replace(/\[\]$/, '');

				if (!result) {
					accumulator[key] = value;
					return;
				}

				if (accumulator[key] === undefined) {
					accumulator[key] = [value];
					return;
				}

				accumulator[key] = [].concat(accumulator[key], value);
			};

		case 'comma':
		case 'separator':
			return (key, value, accumulator) => {
				const isArray = typeof value === 'string' && value.split('').indexOf(options.arrayFormatSeparator) > -1;
				const newValue = isArray ? value.split(options.arrayFormatSeparator).map(item => decode(item, options)) : value === null ? value : decode(value, options);
				accumulator[key] = newValue;
			};

		default:
			return (key, value, accumulator) => {
				if (accumulator[key] === undefined) {
					accumulator[key] = value;
					return;
				}

				accumulator[key] = [].concat(accumulator[key], value);
			};
	}
}

function validateArrayFormatSeparator(value) {
	if (typeof value !== 'string' || value.length !== 1) {
		throw new TypeError('arrayFormatSeparator must be single character string');
	}
}

function encode(value, options) {
	if (options.encode) {
		return options.strict ? strictUriEncode(value) : encodeURIComponent(value);
	}

	return value;
}

function decode(value, options) {
	if (options.decode) {
		return decodeComponent(value);
	}

	return value;
}

function keysSorter(input) {
	if (Array.isArray(input)) {
		return input.sort();
	}

	if (typeof input === 'object') {
		return keysSorter(Object.keys(input))
			.sort((a, b) => Number(a) - Number(b))
			.map(key => input[key]);
	}

	return input;
}

function removeHash(input) {
	const hashStart = input.indexOf('#');
	if (hashStart !== -1) {
		input = input.slice(0, hashStart);
	}

	return input;
}

function getHash(url) {
	let hash = '';
	const hashStart = url.indexOf('#');
	if (hashStart !== -1) {
		hash = url.slice(hashStart);
	}

	return hash;
}

function extract(input) {
	input = removeHash(input);
	const queryStart = input.indexOf('?');
	if (queryStart === -1) {
		return '';
	}

	return input.slice(queryStart + 1);
}

function parseValue(value, options) {
	if (options.parseNumbers && !Number.isNaN(Number(value)) && (typeof value === 'string' && value.trim() !== '')) {
		value = Number(value);
	} else if (options.parseBooleans && value !== null && (value.toLowerCase() === 'true' || value.toLowerCase() === 'false')) {
		value = value.toLowerCase() === 'true';
	}

	return value;
}

function parse(input, options) {
	options = Object.assign({
		decode: true,
		sort: true,
		arrayFormat: 'none',
		arrayFormatSeparator: ',',
		parseNumbers: false,
		parseBooleans: false
	}, options);

	validateArrayFormatSeparator(options.arrayFormatSeparator);

	const formatter = parserForArrayFormat(options);

	// Create an object with no prototype
	const ret = Object.create(null);

	if (typeof input !== 'string') {
		return ret;
	}

	input = input.trim().replace(/^[?#&]/, '');

	if (!input) {
		return ret;
	}

	for (const param of input.split('&')) {
		let [key, value] = splitOnFirst(options.decode ? param.replace(/\+/g, ' ') : param, '=');

		// Missing `=` should be `null`:
		// http://w3.org/TR/2012/WD-url-20120524/#collect-url-parameters
		value = value === undefined ? null : ['comma', 'separator'].includes(options.arrayFormat) ? value : decode(value, options);
		formatter(decode(key, options), value, ret);
	}

	for (const key of Object.keys(ret)) {
		const value = ret[key];
		if (typeof value === 'object' && value !== null) {
			for (const k of Object.keys(value)) {
				value[k] = parseValue(value[k], options);
			}
		} else {
			ret[key] = parseValue(value, options);
		}
	}

	if (options.sort === false) {
		return ret;
	}

	return (options.sort === true ? Object.keys(ret).sort() : Object.keys(ret).sort(options.sort)).reduce((result, key) => {
		const value = ret[key];
		if (Boolean(value) && typeof value === 'object' && !Array.isArray(value)) {
			// Sort object keys, not values
			result[key] = keysSorter(value);
		} else {
			result[key] = value;
		}

		return result;
	}, Object.create(null));
}

exports.extract = extract;
exports.parse = parse;

exports.stringify = (object, options) => {
	if (!object) {
		return '';
	}

	options = Object.assign({
		encode: true,
		strict: true,
		arrayFormat: 'none',
		arrayFormatSeparator: ','
	}, options);

	validateArrayFormatSeparator(options.arrayFormatSeparator);

	const shouldFilter = key => (
		(options.skipNull && isNullOrUndefined(object[key])) ||
		(options.skipEmptyString && object[key] === '')
	);

	const formatter = encoderForArrayFormat(options);

	const objectCopy = {};

	for (const key of Object.keys(object)) {
		if (!shouldFilter(key)) {
			objectCopy[key] = object[key];
		}
	}

	const keys = Object.keys(objectCopy);

	if (options.sort !== false) {
		keys.sort(options.sort);
	}

	return keys.map(key => {
		const value = object[key];

		if (value === undefined) {
			return '';
		}

		if (value === null) {
			return encode(key, options);
		}

		if (Array.isArray(value)) {
			return value
				.reduce(formatter(key), [])
				.join('&');
		}

		return encode(key, options) + '=' + encode(value, options);
	}).filter(x => x.length > 0).join('&');
};

exports.parseUrl = (input, options) => {
	return {
		url: removeHash(input).split('?')[0] || '',
		query: parse(extract(input), options)
	};
};

exports.stringifyUrl = (input, options) => {
	const url = removeHash(input.url).split('?')[0] || '';
	const queryFromUrl = exports.extract(input.url);
	const parsedQueryFromUrl = exports.parse(queryFromUrl);
	const hash = getHash(input.url);
	const query = Object.assign(parsedQueryFromUrl, input.query);
	let queryString = exports.stringify(query, options);
	if (queryString) {
		queryString = `?${queryString}`;
	}

	return `${url}${queryString}${hash}`;
};

},{"decode-uri-component":1,"split-on-first":3,"strict-uri-encode":4}],3:[function(require,module,exports){
'use strict';

module.exports = (string, separator) => {
	if (!(typeof string === 'string' && typeof separator === 'string')) {
		throw new TypeError('Expected the arguments to be of type `string`');
	}

	if (separator === '') {
		return [string];
	}

	const separatorIndex = string.indexOf(separator);

	if (separatorIndex === -1) {
		return [string];
	}

	return [
		string.slice(0, separatorIndex),
		string.slice(separatorIndex + separator.length)
	];
};

},{}],4:[function(require,module,exports){
'use strict';
module.exports = str => encodeURIComponent(str).replace(/[!'()*]/g, x => `%${x.charCodeAt(0).toString(16).toUpperCase()}`);

},{}],5:[function(require,module,exports){
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
},{"./status":10,"./user":11}],6:[function(require,module,exports){
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
                title: 'AutoMO - Login',
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
},{"../../controls/dialog/form-dialog":15,"../../controls/form/form":17,"../../controls/form/text-field":18,"../../controls/spinner":25}],7:[function(require,module,exports){
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
},{}],8:[function(require,module,exports){
const queryString = require('query-string');

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
            connection.resource_index.patients + '?' + queryString.stringify(
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
},{"../../controls/control":13,"../../controls/resource-list":22,"../../controls/splitter":26,"../../controls/text-box":27,"./patient-panel":9,"query-string":2}],9:[function(require,module,exports){
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
},{"../../controls/resource-accordion":21,"../../controls/resource-accordion-item":20,"../../controls/scrolled":23,"../../controls/tile":28}],10:[function(require,module,exports){
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

},{}],11:[function(require,module,exports){
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
},{"./status":10}],12:[function(require,module,exports){
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

},{"./control":13}],13:[function(require,module,exports){

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

},{}],14:[function(require,module,exports){
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
},{"../control":13}],15:[function(require,module,exports){
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
},{"../button":12,"./dialog":14}],16:[function(require,module,exports){

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

},{"../control":13}],17:[function(require,module,exports){
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
},{"../control":13}],18:[function(require,module,exports){
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

},{"../text-box":27,"./field":16}],19:[function(require,module,exports){
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
},{"./scrolled":23}],20:[function(require,module,exports){
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
},{"./control":13,"./spinner":25}],21:[function(require,module,exports){
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
},{"./control":13,"./resource-accordion-item":20,"./spinner":25}],22:[function(require,module,exports){
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
},{"./list-box":19,"./spinner":25,"./spinner-foreground":24}],23:[function(require,module,exports){
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

},{"./control":13}],24:[function(require,module,exports){
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

},{"./control":13}],25:[function(require,module,exports){
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
},{"./control":13}],26:[function(require,module,exports){
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
},{"./control":13}],27:[function(require,module,exports){
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

},{"./control":13}],28:[function(require,module,exports){
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
},{"./control":13}],29:[function(require,module,exports){
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
},{"./app/connection":5,"./app/dialog/login-dialog":6,"./app/logger":7,"./app/panel/patient-browser":8}]},{},[29])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3Vzci9saWIvbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvZGVjb2RlLXVyaS1jb21wb25lbnQvaW5kZXguanMiLCJub2RlX21vZHVsZXMvcXVlcnktc3RyaW5nL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3NwbGl0LW9uLWZpcnN0L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3N0cmljdC11cmktZW5jb2RlL2luZGV4LmpzIiwic3JjL2FwcC9jb25uZWN0aW9uLmpzIiwic3JjL2FwcC9kaWFsb2cvbG9naW4tZGlhbG9nLmpzIiwic3JjL2FwcC9sb2dnZXIuanMiLCJzcmMvYXBwL3BhbmVsL3BhdGllbnQtYnJvd3Nlci5qcyIsInNyYy9hcHAvcGFuZWwvcGF0aWVudC1wYW5lbC5qcyIsInNyYy9hcHAvc3RhdHVzLmpzIiwic3JjL2FwcC91c2VyLmpzIiwic3JjL2NvbnRyb2xzL2J1dHRvbi5qcyIsInNyYy9jb250cm9scy9jb250cm9sLmpzIiwic3JjL2NvbnRyb2xzL2RpYWxvZy9kaWFsb2cuanMiLCJzcmMvY29udHJvbHMvZGlhbG9nL2Zvcm0tZGlhbG9nLmpzIiwic3JjL2NvbnRyb2xzL2Zvcm0vZmllbGQuanMiLCJzcmMvY29udHJvbHMvZm9ybS9mb3JtLmpzIiwic3JjL2NvbnRyb2xzL2Zvcm0vdGV4dC1maWVsZC5qcyIsInNyYy9jb250cm9scy9saXN0LWJveC5qcyIsInNyYy9jb250cm9scy9yZXNvdXJjZS1hY2NvcmRpb24taXRlbS5qcyIsInNyYy9jb250cm9scy9yZXNvdXJjZS1hY2NvcmRpb24uanMiLCJzcmMvY29udHJvbHMvcmVzb3VyY2UtbGlzdC5qcyIsInNyYy9jb250cm9scy9zY3JvbGxlZC5qcyIsInNyYy9jb250cm9scy9zcGlubmVyLWZvcmVncm91bmQuanMiLCJzcmMvY29udHJvbHMvc3Bpbm5lci5qcyIsInNyYy9jb250cm9scy9zcGxpdHRlci5qcyIsInNyYy9jb250cm9scy90ZXh0LWJveC5qcyIsInNyYy9jb250cm9scy90aWxlLmpzIiwic3JjL2luZGV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZXQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RCQTtBQUNBO0FBQ0E7O0FDRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcktBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOU1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0dBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbktBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiJ3VzZSBzdHJpY3QnO1xudmFyIHRva2VuID0gJyVbYS1mMC05XXsyfSc7XG52YXIgc2luZ2xlTWF0Y2hlciA9IG5ldyBSZWdFeHAodG9rZW4sICdnaScpO1xudmFyIG11bHRpTWF0Y2hlciA9IG5ldyBSZWdFeHAoJygnICsgdG9rZW4gKyAnKSsnLCAnZ2knKTtcblxuZnVuY3Rpb24gZGVjb2RlQ29tcG9uZW50cyhjb21wb25lbnRzLCBzcGxpdCkge1xuXHR0cnkge1xuXHRcdC8vIFRyeSB0byBkZWNvZGUgdGhlIGVudGlyZSBzdHJpbmcgZmlyc3Rcblx0XHRyZXR1cm4gZGVjb2RlVVJJQ29tcG9uZW50KGNvbXBvbmVudHMuam9pbignJykpO1xuXHR9IGNhdGNoIChlcnIpIHtcblx0XHQvLyBEbyBub3RoaW5nXG5cdH1cblxuXHRpZiAoY29tcG9uZW50cy5sZW5ndGggPT09IDEpIHtcblx0XHRyZXR1cm4gY29tcG9uZW50cztcblx0fVxuXG5cdHNwbGl0ID0gc3BsaXQgfHwgMTtcblxuXHQvLyBTcGxpdCB0aGUgYXJyYXkgaW4gMiBwYXJ0c1xuXHR2YXIgbGVmdCA9IGNvbXBvbmVudHMuc2xpY2UoMCwgc3BsaXQpO1xuXHR2YXIgcmlnaHQgPSBjb21wb25lbnRzLnNsaWNlKHNwbGl0KTtcblxuXHRyZXR1cm4gQXJyYXkucHJvdG90eXBlLmNvbmNhdC5jYWxsKFtdLCBkZWNvZGVDb21wb25lbnRzKGxlZnQpLCBkZWNvZGVDb21wb25lbnRzKHJpZ2h0KSk7XG59XG5cbmZ1bmN0aW9uIGRlY29kZShpbnB1dCkge1xuXHR0cnkge1xuXHRcdHJldHVybiBkZWNvZGVVUklDb21wb25lbnQoaW5wdXQpO1xuXHR9IGNhdGNoIChlcnIpIHtcblx0XHR2YXIgdG9rZW5zID0gaW5wdXQubWF0Y2goc2luZ2xlTWF0Y2hlcik7XG5cblx0XHRmb3IgKHZhciBpID0gMTsgaSA8IHRva2Vucy5sZW5ndGg7IGkrKykge1xuXHRcdFx0aW5wdXQgPSBkZWNvZGVDb21wb25lbnRzKHRva2VucywgaSkuam9pbignJyk7XG5cblx0XHRcdHRva2VucyA9IGlucHV0Lm1hdGNoKHNpbmdsZU1hdGNoZXIpO1xuXHRcdH1cblxuXHRcdHJldHVybiBpbnB1dDtcblx0fVxufVxuXG5mdW5jdGlvbiBjdXN0b21EZWNvZGVVUklDb21wb25lbnQoaW5wdXQpIHtcblx0Ly8gS2VlcCB0cmFjayBvZiBhbGwgdGhlIHJlcGxhY2VtZW50cyBhbmQgcHJlZmlsbCB0aGUgbWFwIHdpdGggdGhlIGBCT01gXG5cdHZhciByZXBsYWNlTWFwID0ge1xuXHRcdCclRkUlRkYnOiAnXFx1RkZGRFxcdUZGRkQnLFxuXHRcdCclRkYlRkUnOiAnXFx1RkZGRFxcdUZGRkQnXG5cdH07XG5cblx0dmFyIG1hdGNoID0gbXVsdGlNYXRjaGVyLmV4ZWMoaW5wdXQpO1xuXHR3aGlsZSAobWF0Y2gpIHtcblx0XHR0cnkge1xuXHRcdFx0Ly8gRGVjb2RlIGFzIGJpZyBjaHVua3MgYXMgcG9zc2libGVcblx0XHRcdHJlcGxhY2VNYXBbbWF0Y2hbMF1dID0gZGVjb2RlVVJJQ29tcG9uZW50KG1hdGNoWzBdKTtcblx0XHR9IGNhdGNoIChlcnIpIHtcblx0XHRcdHZhciByZXN1bHQgPSBkZWNvZGUobWF0Y2hbMF0pO1xuXG5cdFx0XHRpZiAocmVzdWx0ICE9PSBtYXRjaFswXSkge1xuXHRcdFx0XHRyZXBsYWNlTWFwW21hdGNoWzBdXSA9IHJlc3VsdDtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRtYXRjaCA9IG11bHRpTWF0Y2hlci5leGVjKGlucHV0KTtcblx0fVxuXG5cdC8vIEFkZCBgJUMyYCBhdCB0aGUgZW5kIG9mIHRoZSBtYXAgdG8gbWFrZSBzdXJlIGl0IGRvZXMgbm90IHJlcGxhY2UgdGhlIGNvbWJpbmF0b3IgYmVmb3JlIGV2ZXJ5dGhpbmcgZWxzZVxuXHRyZXBsYWNlTWFwWyclQzInXSA9ICdcXHVGRkZEJztcblxuXHR2YXIgZW50cmllcyA9IE9iamVjdC5rZXlzKHJlcGxhY2VNYXApO1xuXG5cdGZvciAodmFyIGkgPSAwOyBpIDwgZW50cmllcy5sZW5ndGg7IGkrKykge1xuXHRcdC8vIFJlcGxhY2UgYWxsIGRlY29kZWQgY29tcG9uZW50c1xuXHRcdHZhciBrZXkgPSBlbnRyaWVzW2ldO1xuXHRcdGlucHV0ID0gaW5wdXQucmVwbGFjZShuZXcgUmVnRXhwKGtleSwgJ2cnKSwgcmVwbGFjZU1hcFtrZXldKTtcblx0fVxuXG5cdHJldHVybiBpbnB1dDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoZW5jb2RlZFVSSSkge1xuXHRpZiAodHlwZW9mIGVuY29kZWRVUkkgIT09ICdzdHJpbmcnKSB7XG5cdFx0dGhyb3cgbmV3IFR5cGVFcnJvcignRXhwZWN0ZWQgYGVuY29kZWRVUklgIHRvIGJlIG9mIHR5cGUgYHN0cmluZ2AsIGdvdCBgJyArIHR5cGVvZiBlbmNvZGVkVVJJICsgJ2AnKTtcblx0fVxuXG5cdHRyeSB7XG5cdFx0ZW5jb2RlZFVSSSA9IGVuY29kZWRVUkkucmVwbGFjZSgvXFwrL2csICcgJyk7XG5cblx0XHQvLyBUcnkgdGhlIGJ1aWx0IGluIGRlY29kZXIgZmlyc3Rcblx0XHRyZXR1cm4gZGVjb2RlVVJJQ29tcG9uZW50KGVuY29kZWRVUkkpO1xuXHR9IGNhdGNoIChlcnIpIHtcblx0XHQvLyBGYWxsYmFjayB0byBhIG1vcmUgYWR2YW5jZWQgZGVjb2RlclxuXHRcdHJldHVybiBjdXN0b21EZWNvZGVVUklDb21wb25lbnQoZW5jb2RlZFVSSSk7XG5cdH1cbn07XG4iLCIndXNlIHN0cmljdCc7XG5jb25zdCBzdHJpY3RVcmlFbmNvZGUgPSByZXF1aXJlKCdzdHJpY3QtdXJpLWVuY29kZScpO1xuY29uc3QgZGVjb2RlQ29tcG9uZW50ID0gcmVxdWlyZSgnZGVjb2RlLXVyaS1jb21wb25lbnQnKTtcbmNvbnN0IHNwbGl0T25GaXJzdCA9IHJlcXVpcmUoJ3NwbGl0LW9uLWZpcnN0Jyk7XG5cbmNvbnN0IGlzTnVsbE9yVW5kZWZpbmVkID0gdmFsdWUgPT4gdmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09IHVuZGVmaW5lZDtcblxuZnVuY3Rpb24gZW5jb2RlckZvckFycmF5Rm9ybWF0KG9wdGlvbnMpIHtcblx0c3dpdGNoIChvcHRpb25zLmFycmF5Rm9ybWF0KSB7XG5cdFx0Y2FzZSAnaW5kZXgnOlxuXHRcdFx0cmV0dXJuIGtleSA9PiAocmVzdWx0LCB2YWx1ZSkgPT4ge1xuXHRcdFx0XHRjb25zdCBpbmRleCA9IHJlc3VsdC5sZW5ndGg7XG5cblx0XHRcdFx0aWYgKFxuXHRcdFx0XHRcdHZhbHVlID09PSB1bmRlZmluZWQgfHxcblx0XHRcdFx0XHQob3B0aW9ucy5za2lwTnVsbCAmJiB2YWx1ZSA9PT0gbnVsbCkgfHxcblx0XHRcdFx0XHQob3B0aW9ucy5za2lwRW1wdHlTdHJpbmcgJiYgdmFsdWUgPT09ICcnKVxuXHRcdFx0XHQpIHtcblx0XHRcdFx0XHRyZXR1cm4gcmVzdWx0O1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKHZhbHVlID09PSBudWxsKSB7XG5cdFx0XHRcdFx0cmV0dXJuIFsuLi5yZXN1bHQsIFtlbmNvZGUoa2V5LCBvcHRpb25zKSwgJ1snLCBpbmRleCwgJ10nXS5qb2luKCcnKV07XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRyZXR1cm4gW1xuXHRcdFx0XHRcdC4uLnJlc3VsdCxcblx0XHRcdFx0XHRbZW5jb2RlKGtleSwgb3B0aW9ucyksICdbJywgZW5jb2RlKGluZGV4LCBvcHRpb25zKSwgJ109JywgZW5jb2RlKHZhbHVlLCBvcHRpb25zKV0uam9pbignJylcblx0XHRcdFx0XTtcblx0XHRcdH07XG5cblx0XHRjYXNlICdicmFja2V0Jzpcblx0XHRcdHJldHVybiBrZXkgPT4gKHJlc3VsdCwgdmFsdWUpID0+IHtcblx0XHRcdFx0aWYgKFxuXHRcdFx0XHRcdHZhbHVlID09PSB1bmRlZmluZWQgfHxcblx0XHRcdFx0XHQob3B0aW9ucy5za2lwTnVsbCAmJiB2YWx1ZSA9PT0gbnVsbCkgfHxcblx0XHRcdFx0XHQob3B0aW9ucy5za2lwRW1wdHlTdHJpbmcgJiYgdmFsdWUgPT09ICcnKVxuXHRcdFx0XHQpIHtcblx0XHRcdFx0XHRyZXR1cm4gcmVzdWx0O1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKHZhbHVlID09PSBudWxsKSB7XG5cdFx0XHRcdFx0cmV0dXJuIFsuLi5yZXN1bHQsIFtlbmNvZGUoa2V5LCBvcHRpb25zKSwgJ1tdJ10uam9pbignJyldO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0cmV0dXJuIFsuLi5yZXN1bHQsIFtlbmNvZGUoa2V5LCBvcHRpb25zKSwgJ1tdPScsIGVuY29kZSh2YWx1ZSwgb3B0aW9ucyldLmpvaW4oJycpXTtcblx0XHRcdH07XG5cblx0XHRjYXNlICdjb21tYSc6XG5cdFx0Y2FzZSAnc2VwYXJhdG9yJzpcblx0XHRcdHJldHVybiBrZXkgPT4gKHJlc3VsdCwgdmFsdWUpID0+IHtcblx0XHRcdFx0aWYgKHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSB1bmRlZmluZWQgfHwgdmFsdWUubGVuZ3RoID09PSAwKSB7XG5cdFx0XHRcdFx0cmV0dXJuIHJlc3VsdDtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmIChyZXN1bHQubGVuZ3RoID09PSAwKSB7XG5cdFx0XHRcdFx0cmV0dXJuIFtbZW5jb2RlKGtleSwgb3B0aW9ucyksICc9JywgZW5jb2RlKHZhbHVlLCBvcHRpb25zKV0uam9pbignJyldO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0cmV0dXJuIFtbcmVzdWx0LCBlbmNvZGUodmFsdWUsIG9wdGlvbnMpXS5qb2luKG9wdGlvbnMuYXJyYXlGb3JtYXRTZXBhcmF0b3IpXTtcblx0XHRcdH07XG5cblx0XHRkZWZhdWx0OlxuXHRcdFx0cmV0dXJuIGtleSA9PiAocmVzdWx0LCB2YWx1ZSkgPT4ge1xuXHRcdFx0XHRpZiAoXG5cdFx0XHRcdFx0dmFsdWUgPT09IHVuZGVmaW5lZCB8fFxuXHRcdFx0XHRcdChvcHRpb25zLnNraXBOdWxsICYmIHZhbHVlID09PSBudWxsKSB8fFxuXHRcdFx0XHRcdChvcHRpb25zLnNraXBFbXB0eVN0cmluZyAmJiB2YWx1ZSA9PT0gJycpXG5cdFx0XHRcdCkge1xuXHRcdFx0XHRcdHJldHVybiByZXN1bHQ7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAodmFsdWUgPT09IG51bGwpIHtcblx0XHRcdFx0XHRyZXR1cm4gWy4uLnJlc3VsdCwgZW5jb2RlKGtleSwgb3B0aW9ucyldO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0cmV0dXJuIFsuLi5yZXN1bHQsIFtlbmNvZGUoa2V5LCBvcHRpb25zKSwgJz0nLCBlbmNvZGUodmFsdWUsIG9wdGlvbnMpXS5qb2luKCcnKV07XG5cdFx0XHR9O1xuXHR9XG59XG5cbmZ1bmN0aW9uIHBhcnNlckZvckFycmF5Rm9ybWF0KG9wdGlvbnMpIHtcblx0bGV0IHJlc3VsdDtcblxuXHRzd2l0Y2ggKG9wdGlvbnMuYXJyYXlGb3JtYXQpIHtcblx0XHRjYXNlICdpbmRleCc6XG5cdFx0XHRyZXR1cm4gKGtleSwgdmFsdWUsIGFjY3VtdWxhdG9yKSA9PiB7XG5cdFx0XHRcdHJlc3VsdCA9IC9cXFsoXFxkKilcXF0kLy5leGVjKGtleSk7XG5cblx0XHRcdFx0a2V5ID0ga2V5LnJlcGxhY2UoL1xcW1xcZCpcXF0kLywgJycpO1xuXG5cdFx0XHRcdGlmICghcmVzdWx0KSB7XG5cdFx0XHRcdFx0YWNjdW11bGF0b3Jba2V5XSA9IHZhbHVlO1xuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmIChhY2N1bXVsYXRvcltrZXldID09PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0XHRhY2N1bXVsYXRvcltrZXldID0ge307XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRhY2N1bXVsYXRvcltrZXldW3Jlc3VsdFsxXV0gPSB2YWx1ZTtcblx0XHRcdH07XG5cblx0XHRjYXNlICdicmFja2V0Jzpcblx0XHRcdHJldHVybiAoa2V5LCB2YWx1ZSwgYWNjdW11bGF0b3IpID0+IHtcblx0XHRcdFx0cmVzdWx0ID0gLyhcXFtcXF0pJC8uZXhlYyhrZXkpO1xuXHRcdFx0XHRrZXkgPSBrZXkucmVwbGFjZSgvXFxbXFxdJC8sICcnKTtcblxuXHRcdFx0XHRpZiAoIXJlc3VsdCkge1xuXHRcdFx0XHRcdGFjY3VtdWxhdG9yW2tleV0gPSB2YWx1ZTtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoYWNjdW11bGF0b3Jba2V5XSA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdFx0YWNjdW11bGF0b3Jba2V5XSA9IFt2YWx1ZV07XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0YWNjdW11bGF0b3Jba2V5XSA9IFtdLmNvbmNhdChhY2N1bXVsYXRvcltrZXldLCB2YWx1ZSk7XG5cdFx0XHR9O1xuXG5cdFx0Y2FzZSAnY29tbWEnOlxuXHRcdGNhc2UgJ3NlcGFyYXRvcic6XG5cdFx0XHRyZXR1cm4gKGtleSwgdmFsdWUsIGFjY3VtdWxhdG9yKSA9PiB7XG5cdFx0XHRcdGNvbnN0IGlzQXJyYXkgPSB0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnICYmIHZhbHVlLnNwbGl0KCcnKS5pbmRleE9mKG9wdGlvbnMuYXJyYXlGb3JtYXRTZXBhcmF0b3IpID4gLTE7XG5cdFx0XHRcdGNvbnN0IG5ld1ZhbHVlID0gaXNBcnJheSA/IHZhbHVlLnNwbGl0KG9wdGlvbnMuYXJyYXlGb3JtYXRTZXBhcmF0b3IpLm1hcChpdGVtID0+IGRlY29kZShpdGVtLCBvcHRpb25zKSkgOiB2YWx1ZSA9PT0gbnVsbCA/IHZhbHVlIDogZGVjb2RlKHZhbHVlLCBvcHRpb25zKTtcblx0XHRcdFx0YWNjdW11bGF0b3Jba2V5XSA9IG5ld1ZhbHVlO1xuXHRcdFx0fTtcblxuXHRcdGRlZmF1bHQ6XG5cdFx0XHRyZXR1cm4gKGtleSwgdmFsdWUsIGFjY3VtdWxhdG9yKSA9PiB7XG5cdFx0XHRcdGlmIChhY2N1bXVsYXRvcltrZXldID09PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0XHRhY2N1bXVsYXRvcltrZXldID0gdmFsdWU7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0YWNjdW11bGF0b3Jba2V5XSA9IFtdLmNvbmNhdChhY2N1bXVsYXRvcltrZXldLCB2YWx1ZSk7XG5cdFx0XHR9O1xuXHR9XG59XG5cbmZ1bmN0aW9uIHZhbGlkYXRlQXJyYXlGb3JtYXRTZXBhcmF0b3IodmFsdWUpIHtcblx0aWYgKHR5cGVvZiB2YWx1ZSAhPT0gJ3N0cmluZycgfHwgdmFsdWUubGVuZ3RoICE9PSAxKSB7XG5cdFx0dGhyb3cgbmV3IFR5cGVFcnJvcignYXJyYXlGb3JtYXRTZXBhcmF0b3IgbXVzdCBiZSBzaW5nbGUgY2hhcmFjdGVyIHN0cmluZycpO1xuXHR9XG59XG5cbmZ1bmN0aW9uIGVuY29kZSh2YWx1ZSwgb3B0aW9ucykge1xuXHRpZiAob3B0aW9ucy5lbmNvZGUpIHtcblx0XHRyZXR1cm4gb3B0aW9ucy5zdHJpY3QgPyBzdHJpY3RVcmlFbmNvZGUodmFsdWUpIDogZW5jb2RlVVJJQ29tcG9uZW50KHZhbHVlKTtcblx0fVxuXG5cdHJldHVybiB2YWx1ZTtcbn1cblxuZnVuY3Rpb24gZGVjb2RlKHZhbHVlLCBvcHRpb25zKSB7XG5cdGlmIChvcHRpb25zLmRlY29kZSkge1xuXHRcdHJldHVybiBkZWNvZGVDb21wb25lbnQodmFsdWUpO1xuXHR9XG5cblx0cmV0dXJuIHZhbHVlO1xufVxuXG5mdW5jdGlvbiBrZXlzU29ydGVyKGlucHV0KSB7XG5cdGlmIChBcnJheS5pc0FycmF5KGlucHV0KSkge1xuXHRcdHJldHVybiBpbnB1dC5zb3J0KCk7XG5cdH1cblxuXHRpZiAodHlwZW9mIGlucHV0ID09PSAnb2JqZWN0Jykge1xuXHRcdHJldHVybiBrZXlzU29ydGVyKE9iamVjdC5rZXlzKGlucHV0KSlcblx0XHRcdC5zb3J0KChhLCBiKSA9PiBOdW1iZXIoYSkgLSBOdW1iZXIoYikpXG5cdFx0XHQubWFwKGtleSA9PiBpbnB1dFtrZXldKTtcblx0fVxuXG5cdHJldHVybiBpbnB1dDtcbn1cblxuZnVuY3Rpb24gcmVtb3ZlSGFzaChpbnB1dCkge1xuXHRjb25zdCBoYXNoU3RhcnQgPSBpbnB1dC5pbmRleE9mKCcjJyk7XG5cdGlmIChoYXNoU3RhcnQgIT09IC0xKSB7XG5cdFx0aW5wdXQgPSBpbnB1dC5zbGljZSgwLCBoYXNoU3RhcnQpO1xuXHR9XG5cblx0cmV0dXJuIGlucHV0O1xufVxuXG5mdW5jdGlvbiBnZXRIYXNoKHVybCkge1xuXHRsZXQgaGFzaCA9ICcnO1xuXHRjb25zdCBoYXNoU3RhcnQgPSB1cmwuaW5kZXhPZignIycpO1xuXHRpZiAoaGFzaFN0YXJ0ICE9PSAtMSkge1xuXHRcdGhhc2ggPSB1cmwuc2xpY2UoaGFzaFN0YXJ0KTtcblx0fVxuXG5cdHJldHVybiBoYXNoO1xufVxuXG5mdW5jdGlvbiBleHRyYWN0KGlucHV0KSB7XG5cdGlucHV0ID0gcmVtb3ZlSGFzaChpbnB1dCk7XG5cdGNvbnN0IHF1ZXJ5U3RhcnQgPSBpbnB1dC5pbmRleE9mKCc/Jyk7XG5cdGlmIChxdWVyeVN0YXJ0ID09PSAtMSkge1xuXHRcdHJldHVybiAnJztcblx0fVxuXG5cdHJldHVybiBpbnB1dC5zbGljZShxdWVyeVN0YXJ0ICsgMSk7XG59XG5cbmZ1bmN0aW9uIHBhcnNlVmFsdWUodmFsdWUsIG9wdGlvbnMpIHtcblx0aWYgKG9wdGlvbnMucGFyc2VOdW1iZXJzICYmICFOdW1iZXIuaXNOYU4oTnVtYmVyKHZhbHVlKSkgJiYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycgJiYgdmFsdWUudHJpbSgpICE9PSAnJykpIHtcblx0XHR2YWx1ZSA9IE51bWJlcih2YWx1ZSk7XG5cdH0gZWxzZSBpZiAob3B0aW9ucy5wYXJzZUJvb2xlYW5zICYmIHZhbHVlICE9PSBudWxsICYmICh2YWx1ZS50b0xvd2VyQ2FzZSgpID09PSAndHJ1ZScgfHwgdmFsdWUudG9Mb3dlckNhc2UoKSA9PT0gJ2ZhbHNlJykpIHtcblx0XHR2YWx1ZSA9IHZhbHVlLnRvTG93ZXJDYXNlKCkgPT09ICd0cnVlJztcblx0fVxuXG5cdHJldHVybiB2YWx1ZTtcbn1cblxuZnVuY3Rpb24gcGFyc2UoaW5wdXQsIG9wdGlvbnMpIHtcblx0b3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe1xuXHRcdGRlY29kZTogdHJ1ZSxcblx0XHRzb3J0OiB0cnVlLFxuXHRcdGFycmF5Rm9ybWF0OiAnbm9uZScsXG5cdFx0YXJyYXlGb3JtYXRTZXBhcmF0b3I6ICcsJyxcblx0XHRwYXJzZU51bWJlcnM6IGZhbHNlLFxuXHRcdHBhcnNlQm9vbGVhbnM6IGZhbHNlXG5cdH0sIG9wdGlvbnMpO1xuXG5cdHZhbGlkYXRlQXJyYXlGb3JtYXRTZXBhcmF0b3Iob3B0aW9ucy5hcnJheUZvcm1hdFNlcGFyYXRvcik7XG5cblx0Y29uc3QgZm9ybWF0dGVyID0gcGFyc2VyRm9yQXJyYXlGb3JtYXQob3B0aW9ucyk7XG5cblx0Ly8gQ3JlYXRlIGFuIG9iamVjdCB3aXRoIG5vIHByb3RvdHlwZVxuXHRjb25zdCByZXQgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuXG5cdGlmICh0eXBlb2YgaW5wdXQgIT09ICdzdHJpbmcnKSB7XG5cdFx0cmV0dXJuIHJldDtcblx0fVxuXG5cdGlucHV0ID0gaW5wdXQudHJpbSgpLnJlcGxhY2UoL15bPyMmXS8sICcnKTtcblxuXHRpZiAoIWlucHV0KSB7XG5cdFx0cmV0dXJuIHJldDtcblx0fVxuXG5cdGZvciAoY29uc3QgcGFyYW0gb2YgaW5wdXQuc3BsaXQoJyYnKSkge1xuXHRcdGxldCBba2V5LCB2YWx1ZV0gPSBzcGxpdE9uRmlyc3Qob3B0aW9ucy5kZWNvZGUgPyBwYXJhbS5yZXBsYWNlKC9cXCsvZywgJyAnKSA6IHBhcmFtLCAnPScpO1xuXG5cdFx0Ly8gTWlzc2luZyBgPWAgc2hvdWxkIGJlIGBudWxsYDpcblx0XHQvLyBodHRwOi8vdzMub3JnL1RSLzIwMTIvV0QtdXJsLTIwMTIwNTI0LyNjb2xsZWN0LXVybC1wYXJhbWV0ZXJzXG5cdFx0dmFsdWUgPSB2YWx1ZSA9PT0gdW5kZWZpbmVkID8gbnVsbCA6IFsnY29tbWEnLCAnc2VwYXJhdG9yJ10uaW5jbHVkZXMob3B0aW9ucy5hcnJheUZvcm1hdCkgPyB2YWx1ZSA6IGRlY29kZSh2YWx1ZSwgb3B0aW9ucyk7XG5cdFx0Zm9ybWF0dGVyKGRlY29kZShrZXksIG9wdGlvbnMpLCB2YWx1ZSwgcmV0KTtcblx0fVxuXG5cdGZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKHJldCkpIHtcblx0XHRjb25zdCB2YWx1ZSA9IHJldFtrZXldO1xuXHRcdGlmICh0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmIHZhbHVlICE9PSBudWxsKSB7XG5cdFx0XHRmb3IgKGNvbnN0IGsgb2YgT2JqZWN0LmtleXModmFsdWUpKSB7XG5cdFx0XHRcdHZhbHVlW2tdID0gcGFyc2VWYWx1ZSh2YWx1ZVtrXSwgb3B0aW9ucyk7XG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldFtrZXldID0gcGFyc2VWYWx1ZSh2YWx1ZSwgb3B0aW9ucyk7XG5cdFx0fVxuXHR9XG5cblx0aWYgKG9wdGlvbnMuc29ydCA9PT0gZmFsc2UpIHtcblx0XHRyZXR1cm4gcmV0O1xuXHR9XG5cblx0cmV0dXJuIChvcHRpb25zLnNvcnQgPT09IHRydWUgPyBPYmplY3Qua2V5cyhyZXQpLnNvcnQoKSA6IE9iamVjdC5rZXlzKHJldCkuc29ydChvcHRpb25zLnNvcnQpKS5yZWR1Y2UoKHJlc3VsdCwga2V5KSA9PiB7XG5cdFx0Y29uc3QgdmFsdWUgPSByZXRba2V5XTtcblx0XHRpZiAoQm9vbGVhbih2YWx1ZSkgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiAhQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcblx0XHRcdC8vIFNvcnQgb2JqZWN0IGtleXMsIG5vdCB2YWx1ZXNcblx0XHRcdHJlc3VsdFtrZXldID0ga2V5c1NvcnRlcih2YWx1ZSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJlc3VsdFtrZXldID0gdmFsdWU7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHJlc3VsdDtcblx0fSwgT2JqZWN0LmNyZWF0ZShudWxsKSk7XG59XG5cbmV4cG9ydHMuZXh0cmFjdCA9IGV4dHJhY3Q7XG5leHBvcnRzLnBhcnNlID0gcGFyc2U7XG5cbmV4cG9ydHMuc3RyaW5naWZ5ID0gKG9iamVjdCwgb3B0aW9ucykgPT4ge1xuXHRpZiAoIW9iamVjdCkge1xuXHRcdHJldHVybiAnJztcblx0fVxuXG5cdG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHtcblx0XHRlbmNvZGU6IHRydWUsXG5cdFx0c3RyaWN0OiB0cnVlLFxuXHRcdGFycmF5Rm9ybWF0OiAnbm9uZScsXG5cdFx0YXJyYXlGb3JtYXRTZXBhcmF0b3I6ICcsJ1xuXHR9LCBvcHRpb25zKTtcblxuXHR2YWxpZGF0ZUFycmF5Rm9ybWF0U2VwYXJhdG9yKG9wdGlvbnMuYXJyYXlGb3JtYXRTZXBhcmF0b3IpO1xuXG5cdGNvbnN0IHNob3VsZEZpbHRlciA9IGtleSA9PiAoXG5cdFx0KG9wdGlvbnMuc2tpcE51bGwgJiYgaXNOdWxsT3JVbmRlZmluZWQob2JqZWN0W2tleV0pKSB8fFxuXHRcdChvcHRpb25zLnNraXBFbXB0eVN0cmluZyAmJiBvYmplY3Rba2V5XSA9PT0gJycpXG5cdCk7XG5cblx0Y29uc3QgZm9ybWF0dGVyID0gZW5jb2RlckZvckFycmF5Rm9ybWF0KG9wdGlvbnMpO1xuXG5cdGNvbnN0IG9iamVjdENvcHkgPSB7fTtcblxuXHRmb3IgKGNvbnN0IGtleSBvZiBPYmplY3Qua2V5cyhvYmplY3QpKSB7XG5cdFx0aWYgKCFzaG91bGRGaWx0ZXIoa2V5KSkge1xuXHRcdFx0b2JqZWN0Q29weVtrZXldID0gb2JqZWN0W2tleV07XG5cdFx0fVxuXHR9XG5cblx0Y29uc3Qga2V5cyA9IE9iamVjdC5rZXlzKG9iamVjdENvcHkpO1xuXG5cdGlmIChvcHRpb25zLnNvcnQgIT09IGZhbHNlKSB7XG5cdFx0a2V5cy5zb3J0KG9wdGlvbnMuc29ydCk7XG5cdH1cblxuXHRyZXR1cm4ga2V5cy5tYXAoa2V5ID0+IHtcblx0XHRjb25zdCB2YWx1ZSA9IG9iamVjdFtrZXldO1xuXG5cdFx0aWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcblx0XHRcdHJldHVybiAnJztcblx0XHR9XG5cblx0XHRpZiAodmFsdWUgPT09IG51bGwpIHtcblx0XHRcdHJldHVybiBlbmNvZGUoa2V5LCBvcHRpb25zKTtcblx0XHR9XG5cblx0XHRpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcblx0XHRcdHJldHVybiB2YWx1ZVxuXHRcdFx0XHQucmVkdWNlKGZvcm1hdHRlcihrZXkpLCBbXSlcblx0XHRcdFx0LmpvaW4oJyYnKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gZW5jb2RlKGtleSwgb3B0aW9ucykgKyAnPScgKyBlbmNvZGUodmFsdWUsIG9wdGlvbnMpO1xuXHR9KS5maWx0ZXIoeCA9PiB4Lmxlbmd0aCA+IDApLmpvaW4oJyYnKTtcbn07XG5cbmV4cG9ydHMucGFyc2VVcmwgPSAoaW5wdXQsIG9wdGlvbnMpID0+IHtcblx0cmV0dXJuIHtcblx0XHR1cmw6IHJlbW92ZUhhc2goaW5wdXQpLnNwbGl0KCc/JylbMF0gfHwgJycsXG5cdFx0cXVlcnk6IHBhcnNlKGV4dHJhY3QoaW5wdXQpLCBvcHRpb25zKVxuXHR9O1xufTtcblxuZXhwb3J0cy5zdHJpbmdpZnlVcmwgPSAoaW5wdXQsIG9wdGlvbnMpID0+IHtcblx0Y29uc3QgdXJsID0gcmVtb3ZlSGFzaChpbnB1dC51cmwpLnNwbGl0KCc/JylbMF0gfHwgJyc7XG5cdGNvbnN0IHF1ZXJ5RnJvbVVybCA9IGV4cG9ydHMuZXh0cmFjdChpbnB1dC51cmwpO1xuXHRjb25zdCBwYXJzZWRRdWVyeUZyb21VcmwgPSBleHBvcnRzLnBhcnNlKHF1ZXJ5RnJvbVVybCk7XG5cdGNvbnN0IGhhc2ggPSBnZXRIYXNoKGlucHV0LnVybCk7XG5cdGNvbnN0IHF1ZXJ5ID0gT2JqZWN0LmFzc2lnbihwYXJzZWRRdWVyeUZyb21VcmwsIGlucHV0LnF1ZXJ5KTtcblx0bGV0IHF1ZXJ5U3RyaW5nID0gZXhwb3J0cy5zdHJpbmdpZnkocXVlcnksIG9wdGlvbnMpO1xuXHRpZiAocXVlcnlTdHJpbmcpIHtcblx0XHRxdWVyeVN0cmluZyA9IGA/JHtxdWVyeVN0cmluZ31gO1xuXHR9XG5cblx0cmV0dXJuIGAke3VybH0ke3F1ZXJ5U3RyaW5nfSR7aGFzaH1gO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSAoc3RyaW5nLCBzZXBhcmF0b3IpID0+IHtcblx0aWYgKCEodHlwZW9mIHN0cmluZyA9PT0gJ3N0cmluZycgJiYgdHlwZW9mIHNlcGFyYXRvciA9PT0gJ3N0cmluZycpKSB7XG5cdFx0dGhyb3cgbmV3IFR5cGVFcnJvcignRXhwZWN0ZWQgdGhlIGFyZ3VtZW50cyB0byBiZSBvZiB0eXBlIGBzdHJpbmdgJyk7XG5cdH1cblxuXHRpZiAoc2VwYXJhdG9yID09PSAnJykge1xuXHRcdHJldHVybiBbc3RyaW5nXTtcblx0fVxuXG5cdGNvbnN0IHNlcGFyYXRvckluZGV4ID0gc3RyaW5nLmluZGV4T2Yoc2VwYXJhdG9yKTtcblxuXHRpZiAoc2VwYXJhdG9ySW5kZXggPT09IC0xKSB7XG5cdFx0cmV0dXJuIFtzdHJpbmddO1xuXHR9XG5cblx0cmV0dXJuIFtcblx0XHRzdHJpbmcuc2xpY2UoMCwgc2VwYXJhdG9ySW5kZXgpLFxuXHRcdHN0cmluZy5zbGljZShzZXBhcmF0b3JJbmRleCArIHNlcGFyYXRvci5sZW5ndGgpXG5cdF07XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xubW9kdWxlLmV4cG9ydHMgPSBzdHIgPT4gZW5jb2RlVVJJQ29tcG9uZW50KHN0cikucmVwbGFjZSgvWyEnKCkqXS9nLCB4ID0+IGAlJHt4LmNoYXJDb2RlQXQoMCkudG9TdHJpbmcoMTYpLnRvVXBwZXJDYXNlKCl9YCk7XG4iLCJjb25zdCBzdGF0dXMgPSByZXF1aXJlKFwiLi9zdGF0dXNcIilcbmNvbnN0IFVzZXIgPSByZXF1aXJlKFwiLi91c2VyXCIpXG5cblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBDb25uZWN0aW9uIHtcbiAgICBjb25zdHJ1Y3Rvcihsb2dnZXIpIHtcbiAgICAgICAgdGhpcy5pbmRleF91cmwgPSBudWxsXG4gICAgICAgIHRoaXMucmVzb3VyY2VfaW5kZXggPSB7fVxuICAgICAgICB0aGlzLnVzZXIgPSBudWxsO1xuICAgICAgICB0aGlzLmxvZ2dlciA9IGxvZ2dlcjtcbiAgICB9XG5cblxuICAgIGxvZ2luKGluZGV4X3VybCwgdXNlcm5hbWUsIHBhc3N3b3JkLCBvbl9zdWNjZXNzLCBvbl9mYWlsZWQsIG9uX2ZpbmFsbHkpIHtcbiAgICAgICAgdGhpcy5sb2dnZXIubG9nX3NwaW5uZXIoYFVzZXIgJyR7dXNlcm5hbWV9JyBhdHRlbXRpbmcgdG8gbG9naW4uLi5gKTtcbiAgICAgICAgdGhpcy5pbmRleF91cmwgPSBpbmRleF91cmw7XG4gICAgICAgIHRoaXMudXNlciA9IG5ldyBVc2VyKCk7XG4gICAgICAgIHRoaXMudXNlci5sb2dpbihcbiAgICAgICAgICAgIGluZGV4X3VybCxcbiAgICAgICAgICAgIHVzZXJuYW1lLFxuICAgICAgICAgICAgcGFzc3dvcmQsXG4gICAgICAgICAgICAocmVzb3VyY2VfaW5kZXgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLnJlc291cmNlX2luZGV4ID0gcmVzb3VyY2VfaW5kZXg7XG4gICAgICAgICAgICAgICAgb25fc3VjY2VzcygpO1xuICAgICAgICAgICAgICAgIG9uX2ZpbmFsbHkgIT0gbnVsbCA/IG9uX2ZpbmFsbHkoKSA6IGZhbHNlO1xuICAgICAgICAgICAgICAgIHRoaXMubG9nZ2VyLmxvZ19zdWNjZXNzKGBVc2VyICcke3VzZXJuYW1lfScgbG9nZ2VkIGluLmApO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIChlcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgIG9uX2ZhaWxlZChlcnJvcik7XG4gICAgICAgICAgICAgICAgb25fZmluYWxseSAhPSBudWxsID8gb25fZmluYWxseSgpIDogZmFsc2U7XG4gICAgICAgICAgICAgICAgdGhpcy5sb2dnZXIubG9nX2Vycm9yKGBMb2dpbiBmYWlsZWQgZm9yICcke3VzZXJuYW1lfScuICR7ZXJyb3IubWVzc2FnZX1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgKVxuICAgIH1cblxuXG4gICAgbG9nb3V0KG9uX3N1Y2Nlc3MsIG9uX2ZhaWxlZCkge1xuICAgICAgICB0aGlzLnVzZXIgPSBudWxsO1xuICAgICAgICBvbl9zdWNjZXNzKCk7XG4gICAgfVxuXG5cbiAgICBpc0xvZ2dlZEluKCkge1xuICAgICAgICBpZiAodGhpcy51c2VyID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCEodGhpcy51c2VyLnRva2VuVmFsaWQoKSkpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cblxuXG4gICAgX2dldCh1cmwsIG9uX3N1Y2Nlc3MsIG9uX2ZhaWxlZCwgb25fZmluYWxseSwgcmVmZXRjaFRva2VuT25GYWlsID0gdHJ1ZSkge1xuICAgICAgICBsZXQgaGVhZGVycyA9IHRoaXMudXNlci5nZXRBdXRob3JpemF0aW9uSGVhZGVycygpO1xuXG4gICAgICAgIGZldGNoKHVybCwgeyBtZXRob2Q6ICdHRVQnLCBoZWFkZXJzOiBoZWFkZXJzIH0pXG4gICAgICAgICAgICAudGhlbihzdGF0dXMpXG4gICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiByZXNwb25zZS5qc29uKCkpXG4gICAgICAgICAgICAudGhlbihkYXRhID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmxvZ2dlci5sb2dfc3VjY2VzcyhgR0VUICR7dXJsfWApXG4gICAgICAgICAgICAgICAgb25fc3VjY2VzcyhkYXRhKTtcbiAgICAgICAgICAgICAgICBvbl9maW5hbGx5ICE9IG51bGwgPyBvbl9maW5hbGx5KCkgOiBmYWxzZTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goZXJyb3IgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChyZWZldGNoVG9rZW5PbkZhaWwgPyAoZXJyb3Iuc3RhdHVzID09IDQwMSkgOiBmYWxzZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnVzZXIuZ2V0VG9rZW4oXG4gICAgICAgICAgICAgICAgICAgICAgICAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fZ2V0KHVybCwgb25fc3VjY2Vzcywgb25fZmFpbGVkLCBvbl9maW5hbGx5LCBmYWxzZSlcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAoZ2V0VG9rZW5FcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubG9nZ2VyLmxvZ19lcnJvcihgR0VUICR7dXJsfSBmYWlsZWQuICR7Z2V0VG9rZW5FcnJvci5tZXNzYWdlfWApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uX2ZhaWxlZChnZXRUb2tlbkVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbl9maW5hbGx5ICE9IG51bGwgPyBvbl9maW5hbGx5KCkgOiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmxvZ2dlci5sb2dfZXJyb3IoYEdFVCAke3VybH0gZmFpbGVkLiAke2Vycm9yLm1lc3NhZ2V9LmApXG4gICAgICAgICAgICAgICAgICAgIG9uX2ZhaWxlZChlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgIG9uX2ZpbmFsbHkgIT0gbnVsbCA/IG9uX2ZpbmFsbHkoKSA6IGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgfVxuXG5cbiAgICBnZXQodXJsLCBvbl9zdWNjZXNzLCBvbl9mYWlsZWQsIG9uX2ZpbmFsbHkpIHtcbiAgICAgICAgdGhpcy5sb2dnZXIubG9nX3NwaW5uZXIoYEdFVCAke3VybH0uLi5gKVxuICAgICAgICBpZiAodGhpcy51c2VyID09IG51bGwpIHtcbiAgICAgICAgICAgIG9uX2ZhaWxlZChuZXcgRXJyb3IoXCJVc2VyIG5vdCBsb2dnZWQgaW5cIikpO1xuICAgICAgICAgICAgb25fZmluYWxseSAhPSBudWxsID8gb25fZmluYWxseSgpIDogZmFsc2U7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0aGlzLnVzZXIudG9rZW5WYWxpZCgpKSB7XG4gICAgICAgICAgICB0aGlzLnVzZXIuZ2V0VG9rZW4oXG4gICAgICAgICAgICAgICAgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9nZXQodXJsLCBvbl9zdWNjZXNzLCBvbl9mYWlsZWQsIG9uX2ZpbmFsbHkpXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAoZXJyb3IpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2dnZXIubG9nX2Vycm9yKGBHRVQgJHt1cmx9IGZhaWxlZC4gRmFpbGVkIHRvIHJlbmV3IHRva2VuLmApXG4gICAgICAgICAgICAgICAgICAgIG9uX2ZhaWxlZChlcnJvcilcbiAgICAgICAgICAgICAgICAgICAgb25fZmluYWxseSAhPSBudWxsID8gb25fZmluYWxseSgpIDogZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9nZXQodXJsLCBvbl9zdWNjZXNzLCBvbl9mYWlsZWQsIG9uX2ZpbmFsbHkpO1xuICAgIH1cblxuXG4gICAgcG9zdCh1cmwsIHBvc3RfZGF0YSwgb25fc3VjY2Vzcywgb25fZmFpbGVkLCBvbl9maW5hbGx5KSB7XG4gICAgICAgIHRoaXMubG9nZ2VyLmxvZ19zcGlubmVyKGBQT1NUICR7dXJsfS4uLmApXG4gICAgICAgIGlmICh0aGlzLnVzZXIgPT0gbnVsbCkge1xuICAgICAgICAgICAgb25fZmFpbGVkKG5ldyBFcnJvcihcIlVzZXIgbm90IGxvZ2dlZCBpblwiKSk7XG4gICAgICAgICAgICBvbl9maW5hbGx5ICE9IG51bGwgPyBvbl9maW5hbGx5KCkgOiBmYWxzZTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRoaXMudXNlci50b2tlblZhbGlkKCkpIHtcbiAgICAgICAgICAgIHRoaXMudXNlci5nZXRUb2tlbihcbiAgICAgICAgICAgICAgICAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3Bvc3QodXJsLCBwb3N0X2RhdGEsIG9uX3N1Y2Nlc3MsIG9uX2ZhaWxlZCwgb25fZmluYWxseSlcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIChlcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmxvZ2dlci5sb2dfZXJyb3IoYFBPU1QgJHt1cmx9IGZhaWxlZC4gRmFpbGVkIHRvIHJlbmV3IHRva2VuLmApXG4gICAgICAgICAgICAgICAgICAgIG9uX2ZhaWxlZChlcnJvcilcbiAgICAgICAgICAgICAgICAgICAgb25fZmluYWxseSAhPSBudWxsID8gb25fZmluYWxseSgpIDogZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9wb3N0KHVybCwgcG9zdF9kYXRhLCBvbl9zdWNjZXNzLCBvbl9mYWlsZWQsIG9uX2ZpbmFsbHkpO1xuICAgIH1cblxuXG4gICAgX3Bvc3QodXJsLCBwb3N0X2RhdGEsIG9uX3N1Y2Nlc3MsIG9uX2ZhaWxlZCwgb25fZmluYWxseSwgcmVmZXRjaFRva2VuT25GYWlsID0gdHJ1ZSkge1xuICAgICAgICBsZXQgaGVhZGVycyA9IHRoaXMudXNlci5nZXRBdXRob3JpemF0aW9uSGVhZGVycygpO1xuXG4gICAgICAgIGhlYWRlcnMuc2V0KCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuXG4gICAgICAgIGZldGNoKHVybCwgeyBtZXRob2Q6ICdQT1NUJywgYm9keTogSlNPTi5zdHJpbmdpZnkocG9zdF9kYXRhKSwgaGVhZGVyczogaGVhZGVycyB9KVxuICAgICAgICAgICAgLnRoZW4oc3RhdHVzKVxuICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4gcmVzcG9uc2UuanNvbigpKVxuICAgICAgICAgICAgLnRoZW4oZGF0YSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5sb2dnZXIubG9nX3N1Y2Nlc3MoYFBPU1QgJHt1cmx9YClcbiAgICAgICAgICAgICAgICBvbl9zdWNjZXNzKGRhdGEpO1xuICAgICAgICAgICAgICAgIG9uX2ZpbmFsbHkgIT0gbnVsbCA/IG9uX2ZpbmFsbHkoKSA6IGZhbHNlO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaChlcnJvciA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHJlZmV0Y2hUb2tlbk9uRmFpbCA/IChlcnJvci5zdGF0dXMgPT0gNDAxKSA6IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudXNlci5nZXRUb2tlbihcbiAgICAgICAgICAgICAgICAgICAgICAgICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9wb3N0KHVybCwgcG9zdF9kYXRhLCBvbl9zdWNjZXNzLCBvbl9mYWlsZWQsIG9uX2ZpbmFsbHksIGZhbHNlKVxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIChnZXRUb2tlbkVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2dnZXIubG9nX2Vycm9yKGBQT1NUICR7dXJsfSBmYWlsZWQuICR7Z2V0VG9rZW5FcnJvci5tZXNzYWdlfWApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uX2ZhaWxlZChnZXRUb2tlbkVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbl9maW5hbGx5ICE9IG51bGwgPyBvbl9maW5hbGx5KCkgOiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmxvZ2dlci5sb2dfZXJyb3IoYFBPU1QgJHt1cmx9IGZhaWxlZC4gJHtlcnJvci5tZXNzYWdlfS5gKVxuICAgICAgICAgICAgICAgICAgICBvbl9mYWlsZWQoZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICBvbl9maW5hbGx5ICE9IG51bGwgPyBvbl9maW5hbGx5KCkgOiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgIH1cbn0iLCJjb25zdCBGb3JtID0gcmVxdWlyZSgnLi4vLi4vY29udHJvbHMvZm9ybS9mb3JtJyk7XG5jb25zdCBUZXh0RmllbGQgPSByZXF1aXJlKCcuLi8uLi9jb250cm9scy9mb3JtL3RleHQtZmllbGQnKTtcbmNvbnN0IEZvcm1EaWFsb2cgPSByZXF1aXJlKCcuLi8uLi9jb250cm9scy9kaWFsb2cvZm9ybS1kaWFsb2cnKTtcbmNvbnN0IFNwaW5uZXIgPSByZXF1aXJlKCcuLi8uLi9jb250cm9scy9zcGlubmVyJyk7XG5cblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBMb2dpbkRpYWxvZyBleHRlbmRzIEZvcm1EaWFsb2cge1xuICAgIGNvbnN0cnVjdG9yKG9wdGlvbnM9e30pIHtcbiAgICAgICAgdmFyIGZvcm0gPSBuZXcgRm9ybSgpO1xuXG4gICAgICAgIGZvcm0uYWRkRmllbGQobmV3IFRleHRGaWVsZChcbiAgICAgICAgICAgICdpbmRleF91cmwnLFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyOiAnU2VydmVyIFVSTCcsXG4gICAgICAgICAgICAgICAgcmVxdWlyZWQ6IHRydWVcbiAgICAgICAgICAgIH1cbiAgICAgICAgKSk7XG4gICAgICAgIFxuICAgICAgICBmb3JtLmFkZEZpZWxkKG5ldyBUZXh0RmllbGQoXG4gICAgICAgICAgICAndXNlcm5hbWUnLFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyOiAnVXNlcm5hbWUnLFxuICAgICAgICAgICAgICAgIHJlcXVpcmVkOiB0cnVlXG4gICAgICAgICAgICB9XG4gICAgICAgICkpO1xuICAgICAgICBcbiAgICAgICAgZm9ybS5hZGRGaWVsZChuZXcgVGV4dEZpZWxkKFxuICAgICAgICAgICAgJ3Bhc3N3b3JkJyxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcjogJ1Bhc3N3b3JkJyxcbiAgICAgICAgICAgICAgICB0eXBlOiAncGFzc3dvcmQnLFxuICAgICAgICAgICAgICAgIHJlcXVpcmVkOiB0cnVlXG4gICAgICAgICAgICB9XG4gICAgICAgICkpO1xuXG4gICAgICAgIHN1cGVyKFxuICAgICAgICAgICAgZm9ybSwgXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdGl0bGU6ICdBdXRvTU8gLSBMb2dpbicsXG4gICAgICAgICAgICAgICAgb2tMYWJlbDogJ0xvZ2luJyxcbiAgICAgICAgICAgICAgICB3aWR0aDogJzQwMHB4JyxcbiAgICAgICAgICAgICAgICBjZW50ZXJlZDogdHJ1ZVxuICAgICAgICAgICAgfVxuICAgICAgICApO1xuXG4gICAgICAgIHRoaXMuc3Bpbm5lciA9IG5ldyBTcGlubmVyKCk7XG5cbiAgICAgICAgdGhpcy5zdGF0dXNFbGVtZW50ID0gbnVsbDtcbiAgICB9XG5cblxuICAgIF9vbk9rKGV2KSB7XG4gICAgICAgIGlmICh0aGlzLmZvcm0udmFsaWRhdGUoKSA9PSBmYWxzZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMub25Payh0aGlzLnZhbHVlKCkpO1xuICAgIH1cblxuXG4gICAgdHJ5TG9naW4ob25TdWNjZXNzLCBvbkNhbmNlbCkge1xuICAgICAgICB0aGlzLnNob3coXG4gICAgICAgICAgICAoZGF0YSkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuc3Bpbm5lci5zaG93KCk7XG4gICAgICAgICAgICAgICAgY29ubmVjdGlvbi5sb2dpbihcbiAgICAgICAgICAgICAgICAgICAgZGF0YS5pbmRleF91cmwsIGRhdGEudXNlcm5hbWUsIGRhdGEucGFzc3dvcmQsXG4gICAgICAgICAgICAgICAgICAgICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaGlkZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgb25TdWNjZXNzKCk7XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIChlcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0dXNFbGVtZW50LmlubmVyVGV4dCA9IGVycm9yLm1lc3NhZ2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmZvcm0uX2ZpZWxkc1sxXS5mb2N1cygpO1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNwaW5uZXIuaGlkZVNvZnQoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAoKSA9PiB7XG4gICAgICAgICAgICAgICAgb25DYW5jZWwoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgKVxuICAgIH1cblxuXG4gICAgY3JlYXRlRWxlbWVudCgpIHtcbiAgICAgICAgc3VwZXIuY3JlYXRlRWxlbWVudCgpO1xuXG4gICAgICAgIHRoaXMuaGVhZGVyRWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLnNwaW5uZXIuY3JlYXRlRWxlbWVudCgpKTtcbiAgICAgICAgdGhpcy5zcGlubmVyLmhpZGVTb2Z0KCk7XG5cbiAgICAgICAgdGhpcy5zdGF0dXNFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIHRoaXMuc3RhdHVzRWxlbWVudC5jbGFzc05hbWUgPSAnZGlhbG9nLXN0YXR1cyc7XG4gICAgICAgIHRoaXMuYm9keUVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5zdGF0dXNFbGVtZW50KTtcblxuICAgICAgICB0aGlzLmJ0bkNhbmNlbC5oaWRlKCk7XG4gICAgICAgIHRoaXMuX2Nsb3NlRWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuXG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnQ7XG4gICAgfVxufSIsIi8vY29uc3QgZmVhdGhlciA9IHJlcXVpcmUoJ2ZlYXRoZXItaWNvbnMnKTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIExvZ2dlciB7XG4gICAgY29uc3RydWN0b3IgKCkge1xuICAgICAgICB0aGlzLnN0YXR1c0VsZW1lbnQgPSBudWxsO1xuICAgIH1cblxuICAgIHNldFRhcmdldCh0YXJnZXQpIHtcbiAgICAgICAgdGhpcy5zdGF0dXNFbGVtZW50ID0gdGFyZ2V0O1xuICAgIH1cblxuICAgIGxvZyhtZXNzYWdlKSB7XG4gICAgICAgIGlmICh0aGlzLnN0YXR1c0VsZW1lbnQgPT0gbnVsbCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2cobWVzc2FnZSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zdGF0dXNFbGVtZW50LmlubmVySHRtbCA9IG1lc3NhZ2U7XG4gICAgfVxuXG4gICAgbG9nX3NwaW5uZXIobWVzc2FnZSkge1xuICAgICAgICBpZiAodGhpcy5zdGF0dXNFbGVtZW50ID09IG51bGwpIHtcbiAgICAgICAgICAgIC8vY29uc29sZS5sb2cobWVzc2FnZSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zdGF0dXNFbGVtZW50LmlubmVySHRtbCA9IG1lc3NhZ2U7XG4gICAgfVxuXG4gICAgbG9nX3N1Y2Nlc3MobWVzc2FnZSkge1xuICAgICAgICBpZiAodGhpcy5zdGF0dXNFbGVtZW50ID09IG51bGwpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKG1lc3NhZ2UpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuc3RhdHVzRWxlbWVudC5pbm5lckh0bWwgPSBtZXNzYWdlO1xuICAgIH1cblxuICAgIGxvZ19lcnJvcihtZXNzYWdlKSB7XG4gICAgICAgIGlmICh0aGlzLnN0YXR1c0VsZW1lbnQgPT0gbnVsbCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2cobWVzc2FnZSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zdGF0dXNFbGVtZW50LmlubmVySHRtbCA9IG1lc3NhZ2U7XG4gICAgfVxufSIsImNvbnN0IHF1ZXJ5U3RyaW5nID0gcmVxdWlyZSgncXVlcnktc3RyaW5nJyk7XG5cbmNvbnN0IENvbnRyb2wgPSByZXF1aXJlKCcuLi8uLi9jb250cm9scy9jb250cm9sJyk7XG5jb25zdCBUZXh0Qm94ID0gcmVxdWlyZSgnLi4vLi4vY29udHJvbHMvdGV4dC1ib3gnKTtcbi8vY29uc3QgTGlzdEJveCA9IHJlcXVpcmUoJy4uLy4uL2NvbnRyb2xzL2xpc3QtYm94Jyk7XG5jb25zdCBSZXNvdXJjZUxpc3QgPSByZXF1aXJlKCcuLi8uLi9jb250cm9scy9yZXNvdXJjZS1saXN0Jyk7XG5jb25zdCBTcGxpdHRlciA9IHJlcXVpcmUoJy4uLy4uL2NvbnRyb2xzL3NwbGl0dGVyJyk7XG5jb25zdCBQYXRpZW50UGFuZWwgPSByZXF1aXJlKCcuL3BhdGllbnQtcGFuZWwnKTtcblxuXG5cbmNsYXNzIFBhdGllbnRMaXN0IGV4dGVuZHMgQ29udHJvbCB7XG4gICAgY29uc3RydWN0b3Iob25TZWxlY3RQYXRpZW50LCBvcHRpb249e30pIHtcbiAgICAgICAgc3VwZXIob3B0aW9uKTtcblxuICAgICAgICB0aGlzLnNlYXJjaEJveCA9IG5ldyBUZXh0Qm94KHtcbiAgICAgICAgICAgIHBsYWNlaG9sZGVyOiAnU2VhcmNoJ1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5yZXN1bHRMaXN0ID0gbmV3IFJlc291cmNlTGlzdChcbiAgICAgICAgICAgIChpdGVtKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGl0ZW0uaWQ7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgKGl0ZW0pID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fZ2V0UGF0aWVudExhYmVsKGl0ZW0pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIChpdGVtKSA9PiB7XG4gICAgICAgICAgICAgICAgb25TZWxlY3RQYXRpZW50KGl0ZW0pO1xuICAgICAgICAgICAgfVxuICAgICAgICApXG4gICAgfVxuXG4gICAgX2dldFBhdGllbnRMYWJlbChwYXRpZW50KSB7XG4gICAgICAgIHJldHVybiBgXG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwicGF0aWVudC1sYWJlbFwiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJwYXRpZW50LWlkLW51bWJlclwiPlxuICAgICAgICAgICAgICAgICAgICAke3BhdGllbnQubmF0aW9uYWxfaWRfbm99XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInBhdGllbnQtbmFtZVwiPlxuICAgICAgICAgICAgICAgICAgICAke3BhdGllbnQubmFtZX1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwicGF0aWVudC1hZ2VcIj5cbiAgICAgICAgICAgICAgICAgICAgJHtwYXRpZW50LmFnZX1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwicGF0aWVudC1zZXhcIj5cbiAgICAgICAgICAgICAgICAgICAgJHtwYXRpZW50LnNleH1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICBgXG4gICAgfVxuXG4gICAgX3NlYXJjaCgpIHtcbiAgICAgICAgdGhpcy5yZXN1bHRMaXN0LnNldFJlc291cmNlVXJsKFxuICAgICAgICAgICAgY29ubmVjdGlvbi5yZXNvdXJjZV9pbmRleC5wYXRpZW50cyArICc/JyArIHF1ZXJ5U3RyaW5nLnN0cmluZ2lmeShcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICdxJzogdGhpcy5zZWFyY2hCb3gudmFsdWUoKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIClcbiAgICAgICAgKVxuICAgIH1cblxuICAgIGNyZWF0ZUVsZW1lbnQoKSB7XG4gICAgICAgIHN1cGVyLmNyZWF0ZUVsZW1lbnQoKTtcblxuICAgICAgICB0aGlzLmVsZW1lbnQuY2xhc3NOYW1lID0gJ3BhdGllbnQtbGlzdCc7XG5cbiAgICAgICAgdGhpcy5lbGVtZW50LmFwcGVuZENoaWxkKHRoaXMuc2VhcmNoQm94LmNyZWF0ZUVsZW1lbnQoKSk7XG5cbiAgICAgICAgdGhpcy5lbGVtZW50LmFwcGVuZENoaWxkKHRoaXMucmVzdWx0TGlzdC5jcmVhdGVFbGVtZW50KCkpO1xuXG4gICAgICAgIHRoaXMuZWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gJ2ZsZXgnO1xuICAgICAgICBcbiAgICAgICAgdGhpcy5zZWFyY2hCb3guZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXl1cCcsIChldikgPT4ge1xuICAgICAgICAgICAgdGhpcy5fc2VhcmNoKCk7XG4gICAgICAgIH0pXG5cbiAgICAgICAgdGhpcy5fc2VhcmNoKCk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudDtcbiAgICB9XG59XG5cblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBQYXRpZW50QnJvd3NlciBleHRlbmRzIFNwbGl0dGVyIHtcbiAgICBjb25zdHJ1Y3RvcihvcHRpb25zPXt9KSB7XG4gICAgICAgIHZhciBwYXRpZW50UGFuZWwgPSBuZXcgUGF0aWVudFBhbmVsKCk7XG4gICAgICAgIHZhciBwYXRpZW50TGlzdCA9IG5ldyBQYXRpZW50TGlzdCgocGF0aWVudCkgPT4ge1xuICAgICAgICAgICAgcGF0aWVudFBhbmVsLnNldFBhdGllbnQocGF0aWVudCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIG9wdGlvbnMucGFuZTFTaXplID0gJzI2MHB4JztcbiAgICAgICAgb3B0aW9ucy5yZXNpemFibGUgPSB0cnVlO1xuXG4gICAgICAgIHN1cGVyKFxuICAgICAgICAgICAgcGF0aWVudExpc3QsXG4gICAgICAgICAgICBwYXRpZW50UGFuZWwsXG4gICAgICAgICAgICBvcHRpb25zXG4gICAgICAgIClcbiAgICB9XG5cbiAgICBjcmVhdGVFbGVtZW50KCkge1xuICAgICAgICByZXR1cm4gc3VwZXIuY3JlYXRlRWxlbWVudCgpXG4gICAgfVxufTsiLCJjb25zdCBTY3JvbGxlZCA9IHJlcXVpcmUoJy4uLy4uL2NvbnRyb2xzL3Njcm9sbGVkJyk7XG5jb25zdCBUaWxlID0gIHJlcXVpcmUoJy4uLy4uL2NvbnRyb2xzL3RpbGUnKTtcbmNvbnN0IFJlc291cmNlQWNjb3JkaW9uID0gcmVxdWlyZSgnLi4vLi4vY29udHJvbHMvcmVzb3VyY2UtYWNjb3JkaW9uJyk7XG5jb25zdCBSZXNvdXJjZUFjY29yZGlvbkl0ZW0gPSByZXF1aXJlKCcuLi8uLi9jb250cm9scy9yZXNvdXJjZS1hY2NvcmRpb24taXRlbScpO1xuXG5cblxuY2xhc3MgUHJvYmxlbXNUaWxlIGV4dGVuZHMgVGlsZSB7XG4gICAgY29uc3RydWN0b3Iob3B0aW9ucz17fSkge1xuICAgICAgICBzdXBlcignRGlhZ25vc2lzJywgb3B0aW9ucyk7XG5cbiAgICAgICAgdGhpcy5yZXNvdXJjZUxpc3QgPSBuZXcgUmVzb3VyY2VBY2NvcmRpb24oXG4gICAgICAgICAgICAoaXRlbSkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBpdGVtLmlkO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFJlc291cmNlQWNjb3JkaW9uSXRlbVxuICAgICAgICApO1xuICAgIH1cblxuICAgIHNldFBhdGllbnQocGF0aWVudCkge1xuICAgICAgICB0aGlzLnJlc291cmNlTGlzdC5zZXRSZXNvdXJjZVVybChwYXRpZW50LnByb2JsZW1zKTtcbiAgICB9XG5cbiAgICBjcmVhdGVFbGVtZW50KCkge1xuICAgICAgICBzdXBlci5jcmVhdGVFbGVtZW50KCk7XG5cbiAgICAgICAgdGhpcy5fdGlsZUJvZHlFbGVtZW50LmFwcGVuZENoaWxkKHRoaXMucmVzb3VyY2VMaXN0LmNyZWF0ZUVsZW1lbnQoKSk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudFxuICAgIH1cbn1cblxuXG5jbGFzcyBBZG1pc3Npb25zSXRlbSBleHRlbmRzIFJlc291cmNlQWNjb3JkaW9uSXRlbSB7XG4gICAgY29uc3RydWN0b3IoaXRlbURhdGEsIG9wdGlvbnM9e30pIHtcbiAgICAgICAgc3VwZXIoaXRlbURhdGEsIG9wdGlvbnMpO1xuICAgIH1cblxuICAgIGRpc3BsYXlSZXNvdXJjZSgpIHtcbiAgICAgICAgdGhpcy5zdGFydFRpbWUuaW5uZXJIVE1MID0gdGhpcy5yZXNvdXJjZURhdGEuc3RhcnRfdGltZTtcbiAgICB9XG5cbiAgICBjcmVhdGVIZWFkZXJFbGVtZW50KCkge1xuICAgICAgICBzdXBlci5jcmVhdGVIZWFkZXJFbGVtZW50KCk7XG5cbiAgICAgICAgdGhpcy5oZWFkZXJFbGVtZW50LmlubmVySFRNTCA9IGBcbiAgICAgICAgICAgIDxkaXY+QWRtaXNzaW9uPC9kaXY+XG4gICAgICAgICAgICA8ZGl2PiR7dGhpcy5pdGVtRGF0YS5zdGFydF90aW1lfTwvZGl2PlxuICAgICAgICAgICAgPGRpdj4ke3RoaXMuaXRlbURhdGEuZW5kX3RpbWV9PC9kaXY+XG4gICAgICAgICAgICA8ZGl2PiR7dGhpcy5pdGVtRGF0YS5wZXJzb25uZWwubmFtZX08L2Rpdj5cbiAgICAgICAgYDtcblxuICAgICAgICByZXR1cm4gdGhpcy5oZWFkZXJFbGVtZW50O1xuICAgIH1cblxuICAgIGNyZWF0ZUJvZHlFbGVtZW50KCkge1xuICAgICAgICBzdXBlci5jcmVhdGVCb2R5RWxlbWVudCgpO1xuXG4gICAgICAgIHRoaXMuc3RhcnRUaW1lID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIHRoaXMuYm9keUVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5zdGFydFRpbWUpO1xuXG4gICAgICAgIHJldHVybiB0aGlzLmJvZHlFbGVtZW50O1xuICAgIH1cbn1cblxuXG5jbGFzcyBBZG1pc3Npb25zVGlsZSBleHRlbmRzIFRpbGUge1xuICAgIGNvbnN0cnVjdG9yKG9wdGlvbnM9e30pIHtcbiAgICAgICAgc3VwZXIoJ0FkbWlzc2lvbnMnLCBvcHRpb25zKTtcblxuICAgICAgICB0aGlzLnJlc291cmNlTGlzdCA9IG5ldyBSZXNvdXJjZUFjY29yZGlvbihcbiAgICAgICAgICAgIChpdGVtKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGl0ZW0uaWQ7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgQWRtaXNzaW9uc0l0ZW1cbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICBzZXRQYXRpZW50KHBhdGllbnQpIHtcbiAgICAgICAgdGhpcy5yZXNvdXJjZUxpc3Quc2V0UmVzb3VyY2VVcmwocGF0aWVudC5hZG1pc3Npb25zKTtcbiAgICB9XG5cbiAgICBjcmVhdGVFbGVtZW50KCkge1xuICAgICAgICBzdXBlci5jcmVhdGVFbGVtZW50KCk7XG5cbiAgICAgICAgdGhpcy5fdGlsZUJvZHlFbGVtZW50LmFwcGVuZENoaWxkKHRoaXMucmVzb3VyY2VMaXN0LmNyZWF0ZUVsZW1lbnQoKSk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudFxuICAgIH1cbn1cblxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFBhdGllbnRQYW5lbCBleHRlbmRzIFNjcm9sbGVkIHtcbiAgICBjb25zdHJ1Y3RvcihvcHRpb25zPXt9KSB7XG4gICAgICAgIHN1cGVyKG9wdGlvbnMpXG5cbiAgICAgICAgdGhpcy5wYXRpZW50ID0gbnVsbDtcblxuICAgICAgICB0aGlzLnByb2JsZW1zVGlsZSA9IG5ldyBQcm9ibGVtc1RpbGUoKTtcbiAgICAgICAgdGhpcy5hZG1pc3Npb25zVGlsZSA9IG5ldyBBZG1pc3Npb25zVGlsZSgpO1xuICAgIH1cblxuICAgIF9zZXRQYXRpZW50KHBhdGllbnQpIHtcbiAgICAgICAgdGhpcy5wYXRpZW50ID0gcGF0aWVudDtcblxuICAgICAgICB0aGlzLl9pZE51bWJlckVsZW1lbnQuaW5uZXJIVE1MID0gXCJOSUMgTm8uOiBcIiArIHBhdGllbnQubmF0aW9uYWxfaWRfbm87XG4gICAgICAgIHRoaXMuX2hvc3BOdW1iZXJFbGVtZW50LmlubmVySFRNTCA9IFwiLCBIb3NwaXRhbCBOby46IFwiICtwYXRpZW50Lmhvc3BpdGFsX25vO1xuICAgICAgICB0aGlzLl9waG9uZU51bWJlckVsZW1lbnQuaW5uZXJIVE1MID0gXCIsIFBob25lIE5vLjogXCIgK3BhdGllbnQucGhvbmVfbm87XG4gICAgICAgIHRoaXMuX25hbWVFbGVtZW50LmlubmVySFRNTCA9IHBhdGllbnQubmFtZTtcbiAgICAgICAgdGhpcy5fYWdlU2V4RWxlbWVudC5pbm5lckhUTUwgPSBwYXRpZW50LmFnZSArIFwiL1wiICsgcGF0aWVudC5zZXg7XG5cbiAgICAgICAgdGhpcy5faGVhZGVyRWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gJ2ZsZXgnO1xuICAgICAgICB0aGlzLl9ib2R5RWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gJ2ZsZXgnO1xuXG4gICAgICAgIHRoaXMucHJvYmxlbXNUaWxlLnNldFBhdGllbnQocGF0aWVudCk7XG4gICAgICAgIHRoaXMuYWRtaXNzaW9uc1RpbGUuc2V0UGF0aWVudChwYXRpZW50KTtcbiAgICB9XG5cbiAgICBzZXRQYXRpZW50KHBhdGllbnQpIHtcbiAgICAgICAgdGhpcy5faWROdW1iZXJFbGVtZW50LmlubmVySFRNTCA9IFwiTklDIE5vLjogXCIgKyBwYXRpZW50Lm5hdGlvbmFsX2lkX25vO1xuICAgICAgICB0aGlzLl9ob3NwTnVtYmVyRWxlbWVudC5pbm5lckhUTUwgPSBcIiwgSG9zcGl0YWwgTm8uOiBcIiArcGF0aWVudC5ob3NwaXRhbF9ubztcbiAgICAgICAgdGhpcy5fcGhvbmVOdW1iZXJFbGVtZW50LmlubmVySFRNTCA9IFwiXCI7XG4gICAgICAgIHRoaXMuX25hbWVFbGVtZW50LmlubmVySFRNTCA9IHBhdGllbnQubmFtZTtcbiAgICAgICAgdGhpcy5fYWdlU2V4RWxlbWVudC5pbm5lckhUTUwgPSBwYXRpZW50LmFnZSArIFwiL1wiICsgcGF0aWVudC5zZXg7XG4gICAgICAgIFxuICAgICAgICB0aGlzLl9ib2R5RWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuXG4gICAgICAgIGNvbm5lY3Rpb24uZ2V0KFxuICAgICAgICAgICAgcGF0aWVudC51cmwsXG4gICAgICAgICAgICBwYXRpZW50ID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLl9zZXRQYXRpZW50KHBhdGllbnQpXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgKGVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coZXJyb3IpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICgpID0+IHtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIH1cbiAgICAgICAgKVxuICAgIH1cblxuICAgIGNyZWF0ZUVsZW1lbnQoKSB7XG4gICAgICAgIHN1cGVyLmNyZWF0ZUVsZW1lbnQoKTtcblxuICAgICAgICBcbiAgICAgICAgdGhpcy5lbGVtZW50LmNsYXNzTmFtZSA9ICdwYXRpZW50LXBhbmVsJztcbiAgICAgICAgdGhpcy5lbGVtZW50LnN0eWxlLmZsZXhEaXJlY3Rpb24gPSAnY29sdW1uJztcblxuICAgICAgICB0aGlzLl9oZWFkZXJFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIHRoaXMuX2hlYWRlckVsZW1lbnQuY2xhc3NOYW1lID0gJ2hlYWRlcic7XG4gICAgICAgIHRoaXMuX2hlYWRlckVsZW1lbnQuc3R5bGUuZmxleERpcmVjdGlvbiA9ICdjb2x1bW4nO1xuICAgICAgICB0aGlzLmVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5faGVhZGVyRWxlbWVudCk7XG5cbiAgICAgICAgdmFyIGRldGFpbHNFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgICAgICAgZGV0YWlsc0VsZW1lbnQuc3R5bGUuZGlzcGxheSA9ICdmbGV4JztcbiAgICAgICAgZGV0YWlsc0VsZW1lbnQuc3R5bGUuZmxleERpcmVjdGlvbiA9ICdyb3cnO1xuICAgICAgICBkZXRhaWxzRWxlbWVudC5zdHlsZS5hbGlnbkl0ZW1zID0gJ2Jhc2VsaW5lJztcbiAgICAgICAgdGhpcy5faGVhZGVyRWxlbWVudC5hcHBlbmRDaGlsZChkZXRhaWxzRWxlbWVudCk7XG5cbiAgICAgICAgdGhpcy5fbmFtZUVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdoMScpO1xuICAgICAgICBkZXRhaWxzRWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLl9uYW1lRWxlbWVudCk7XG5cbiAgICAgICAgdGhpcy5fYWdlU2V4RWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICAgICAgZGV0YWlsc0VsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5fYWdlU2V4RWxlbWVudCk7XG5cbiAgICAgICAgdmFyIG51bWJlckVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgbnVtYmVyRWxlbWVudC5jbGFzc05hbWUgPSAnbnVtYmVyJztcbiAgICAgICAgbnVtYmVyRWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gJ2ZsZXgnO1xuICAgICAgICBudW1iZXJFbGVtZW50LnN0eWxlLmZsZXhEaXJlY3Rpb24gPSAncm93JztcbiAgICAgICAgdGhpcy5faGVhZGVyRWxlbWVudC5hcHBlbmRDaGlsZChudW1iZXJFbGVtZW50KTtcblxuICAgICAgICB0aGlzLl9pZE51bWJlckVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgbnVtYmVyRWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLl9pZE51bWJlckVsZW1lbnQpO1xuXG4gICAgICAgIHRoaXMuX2hvc3BOdW1iZXJFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIG51bWJlckVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5faG9zcE51bWJlckVsZW1lbnQpO1xuXG4gICAgICAgIHRoaXMuX3Bob25lTnVtYmVyRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICBudW1iZXJFbGVtZW50LmFwcGVuZENoaWxkKHRoaXMuX3Bob25lTnVtYmVyRWxlbWVudCk7XG5cbiAgICAgICAgdGhpcy5fYm9keUVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgdGhpcy5fYm9keUVsZW1lbnQuY2xhc3NOYW1lID0gJ2JvZHknO1xuICAgICAgICB0aGlzLl9ib2R5RWxlbWVudC5zdHlsZS5mbGV4RGlyZWN0aW9uID0gJ2NvbHVtbic7XG4gICAgICAgIHRoaXMuZWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLl9ib2R5RWxlbWVudCk7XG5cbiAgICAgICAgLypcbiAgICAgICAgdGhpcy5fcHJvYmxlbXNFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIHRoaXMuX3Byb2JsZW1zRWxlbWVudC5jbGFzc0xpc3QgPSAndGlsZSBwcm9ibGVtcydcbiAgICAgICAgdGhpcy5fcHJvYmxlbXNFbGVtZW50LmlubmVySFRNTCA9ICc8aDE+UHJvYmxlbXM8L2gxPjxkaXYgY2xhc3M9XCJ0aWxlLWJvZHlcIj5Qcm9ibGVtczxicj5Qcm9ibGVtczxicj5Qcm9ibGVtczxicj48L2Rpdj4nXG4gICAgICAgIHRoaXMuX2JvZHlFbGVtZW50LmFwcGVuZENoaWxkKHRoaXMuX3Byb2JsZW1zRWxlbWVudClcblxuICAgICAgICB0aGlzLl9hZG1pc3Npb25zRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICB0aGlzLl9hZG1pc3Npb25zRWxlbWVudC5jbGFzc0xpc3QgPSAndGlsZSBhZG1pc3Npb25zJ1xuICAgICAgICB0aGlzLl9hZG1pc3Npb25zRWxlbWVudC5pbm5lckhUTUwgPSAnPGgxPkFkbWlzc2lvbnM8L2gxPjxkaXYgY2xhc3M9XCJ0aWxlLWJvZHlcIj5BZG1pc3Npb25zPGJyPkFkbWlzc2lvbnM8YnI+QWRtaXNzaW9uczxicj48L2Rpdj4nXG4gICAgICAgIHRoaXMuX2JvZHlFbGVtZW50LmFwcGVuZENoaWxkKHRoaXMuX2FkbWlzc2lvbnNFbGVtZW50KVxuICAgICAgICAqL1xuXG4gICAgICAgIHRoaXMuX2JvZHlFbGVtZW50LmFwcGVuZENoaWxkKHRoaXMucHJvYmxlbXNUaWxlLmNyZWF0ZUVsZW1lbnQoKSk7XG4gICAgICAgIHRoaXMuX2JvZHlFbGVtZW50LmFwcGVuZENoaWxkKHRoaXMuYWRtaXNzaW9uc1RpbGUuY3JlYXRlRWxlbWVudCgpKTtcblxuICAgICAgICB0aGlzLl9oZWFkZXJFbGVtZW50LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgIHRoaXMuX2JvZHlFbGVtZW50LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50O1xuICAgIH1cblxufSIsImNsYXNzIFJlc3BvbnNlRXJyb3IgZXh0ZW5kcyBFcnJvciB7XG5cdGNvbnN0cnVjdG9yKHJlc3BvbnNlKSB7XG5cdFx0dmFyIG1lc3NhZ2UgPSBgUmVzcG9uc2UgRXJyb3IgJHtyZXNwb25zZS5zdGF0dXN9ICR7cmVzcG9uc2Uuc3RhdHVzVGV4dH1gO1xuXHRcdHN1cGVyKG1lc3NhZ2UpO1xuXHRcdHRoaXMuc3RhdHVzID0gcmVzcG9uc2Uuc3RhdHVzO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gc3RhdHVzKHJlc3BvbnNlKSB7XG5cdGlmICghcmVzcG9uc2Uub2spIHtcblx0XHRyZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IFJlc3BvbnNlRXJyb3IocmVzcG9uc2UpKTtcblx0fVxuXHRyZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHJlc3BvbnNlKTtcbn1cbiIsImNvbnN0IHN0YXR1cyA9IHJlcXVpcmUoXCIuL3N0YXR1c1wiKTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFVzZXIge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLnVzZXJuYW1lID0gbnVsbDtcbiAgICAgICAgdGhpcy5mdWxsbmFtZSA9IG51bGxcbiAgICAgICAgdGhpcy5wYXNzd29yZCA9IG51bGw7XG4gICAgICAgIHRoaXMudG9rZW4gPSBudWxsO1xuICAgICAgICB0aGlzLnRva2VuX2V4cGlyZV90aW1lID0gbnVsbDtcbiAgICAgICAgdGhpcy51cmwgPSBudWxsO1xuICAgICAgICB0aGlzLnRva2VuX3VybCA9IG51bGw7XG4gICAgfVxuXG5cbiAgICB0b2tlblZhbGlkKCkge1xuICAgICAgICBpZiAodGhpcy50b2tlbiA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGlmICgobmV3IERhdGUoKS5nZXRUaW1lKCkgLyAxMDAwKSA+IHRoaXMudG9rZW5fZXhwaXJlX3RpbWUpIHtcbiAgICAgICAgICAgIHRoaXMudG9rZW4gPSBudWxsO1xuICAgICAgICAgICAgdGhpcy50b2tlbl9leHBpcmVfdGltZSA9IG51bGw7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgZ2V0TmFtZSgpIHtcbiAgICAgICAgaWYgKHRoaXMuZnVsbG5hbWUgPT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMudXNlcm5hbWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuZnVsbG5hbWU7XG4gICAgfVxuXG5cbiAgICBnZXRUb2tlbihvbl9zdWNjZXNzLCBvbl9mYWlsZWQpIHtcbiAgICAgICAgbGV0IGhlYWRlcnMgPSBuZXcgSGVhZGVycygpO1xuICAgICAgICBoZWFkZXJzLnNldChcbiAgICAgICAgICAgICdBdXRob3JpemF0aW9uJyxcbiAgICAgICAgICAgICdCYXNpYyAnICsgYnRvYSh0aGlzLnVzZXJuYW1lICsgXCI6XCIgKyB0aGlzLnBhc3N3b3JkKVxuICAgICAgICApO1xuXG4gICAgICAgIGZldGNoKHRoaXMudG9rZW5fdXJsLCB7IG1ldGhvZDogJ0dFVCcsIGhlYWRlcnM6IGhlYWRlcnMgfSlcbiAgICAgICAgICAgIC50aGVuKHN0YXR1cylcbiAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHJlc3BvbnNlLmpzb24oKSlcbiAgICAgICAgICAgIC50aGVuKGRhdGEgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMudG9rZW4gPSBkYXRhWyd0b2tlbiddO1xuICAgICAgICAgICAgICAgIHRoaXMudG9rZW5fZXhwaXJlX3RpbWUgPSAobmV3IERhdGUoKS5nZXRUaW1lKCkgLyAxMDAwKSArIGRhdGFbJ2V4cGlyYXRpb24nXTtcbiAgICAgICAgICAgICAgICBvbl9zdWNjZXNzKCk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNhdGNoKGVycm9yID0+IHtcbiAgICAgICAgICAgICAgICBvbl9mYWlsZWQobmV3IEVycm9yKGBGYWlsZWQgdG8gZ2V0IHRva2VuLCAke2Vycm9yLm1lc3NhZ2V9LmApKTtcbiAgICAgICAgICAgIH0pXG4gICAgfVxuXG5cbiAgICBnZXRBdXRob3JpemF0aW9uSGVhZGVycygpIHtcbiAgICAgICAgbGV0IGhlYWRlcnMgPSBuZXcgSGVhZGVycygpO1xuICAgICAgICBoZWFkZXJzLnNldChcbiAgICAgICAgICAgICdBdXRob3JpemF0aW9uJyxcbiAgICAgICAgICAgICdCYXNpYyAnICsgYnRvYSh0aGlzLnRva2VuICsgXCI6XCIpXG4gICAgICAgICk7XG4gICAgICAgIHJldHVybiBoZWFkZXJzO1xuICAgIH1cblxuXG4gICAgZ2V0VXNlckRhdGEob25fc3VjY2Vzcywgb25fZmFpbGVkKSB7XG4gICAgICAgIGxldCBoZWFkZXJzID0gdGhpcy5nZXRBdXRob3JpemF0aW9uSGVhZGVycygpO1xuXG4gICAgICAgIGZldGNoKHRoaXMudXJsLCB7IG1ldGhvZDogJ0dFVCcsIGhlYWRlcnM6IGhlYWRlcnMgfSlcbiAgICAgICAgICAgIC50aGVuKHN0YXR1cylcbiAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHJlc3BvbnNlLmpzb24oKSlcbiAgICAgICAgICAgIC50aGVuKGRhdGEgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuZnVsbG5hbWUgPSBkYXRhLmZ1bGxuYW1lO1xuICAgICAgICAgICAgICAgIG9uX3N1Y2Nlc3MoKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goZXJyb3IgPT4ge1xuICAgICAgICAgICAgICAgIG9uX2ZhaWxlZChuZXcgRXJyb3IoYEZhaWxlZCB0byBnZXQgdXNlciBkYXRhLiAke2Vycm9yLm1lc3NhZ2V9YCkpO1xuICAgICAgICAgICAgfSlcbiAgICB9XG5cblxuICAgIGxvZ2luKGluZGV4X3VybCwgdXNlcm5hbWUsIHBhc3N3b3JkLCBvbl9zdWNjZXNzLCBvbl9mYWlsZWQpIHtcbiAgICAgICAgdGhpcy51c2VybmFtZSA9IHVzZXJuYW1lO1xuICAgICAgICB0aGlzLnBhc3N3b3JkID0gcGFzc3dvcmQ7XG5cbiAgICAgICAgbGV0IGhlYWRlcnMgPSBuZXcgSGVhZGVycygpO1xuICAgICAgICBoZWFkZXJzLnNldChcbiAgICAgICAgICAgICdBdXRob3JpemF0aW9uJyxcbiAgICAgICAgICAgICdCYXNpYyAnICsgYnRvYSh0aGlzLnVzZXJuYW1lICsgXCI6XCIgKyB0aGlzLnBhc3N3b3JkKVxuICAgICAgICApO1xuXG4gICAgICAgIGZ1bmN0aW9uIGNoZWNrQ3JlZGVudGlhbHMoZGF0YSkge1xuICAgICAgICAgICAgaWYgKCEoXCJhdXRoX3Rva2VuXCIgaW4gZGF0YSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKFwiVW5leHBlY3RlZCBkYXRhLlwiKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGRhdGEpXG4gICAgICAgIH1cblxuICAgICAgICBmZXRjaChpbmRleF91cmwsIHsgbWV0aG9kOiAnR0VUJywgaGVhZGVyczogaGVhZGVycyB9KVxuICAgICAgICAgICAgLnRoZW4oc3RhdHVzKVxuICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4gcmVzcG9uc2UuanNvbigpKVxuICAgICAgICAgICAgLnRoZW4oZGF0YSA9PiBjaGVja0NyZWRlbnRpYWxzKGRhdGEpKVxuICAgICAgICAgICAgLnRoZW4ocmVzb3VyY2VfaW5kZXggPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMudG9rZW5fdXJsID0gcmVzb3VyY2VfaW5kZXhbJ2F1dGhfdG9rZW4nXTtcbiAgICAgICAgICAgICAgICB0aGlzLmdldFRva2VuKFxuICAgICAgICAgICAgICAgICAgICAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnVybCA9IHJlc291cmNlX2luZGV4Wyd1c2VyJ107XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmdldFVzZXJEYXRhKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25fc3VjY2VzcyhyZXNvdXJjZV9pbmRleClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbl9mYWlsZWRcbiAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIG9uX2ZhaWxlZFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNhdGNoKChlcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChlcnJvci5zdGF0dXMgPT0gNDAxKSB7XG4gICAgICAgICAgICAgICAgICAgIG9uX2ZhaWxlZChuZXcgRXJyb3IoJ0ludmFsaWQgVXNlcm5hbWUgb3IgUGFzc3dvcmQnKSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgb25fZmFpbGVkKG5ldyBFcnJvcihgTG9naW4gZXJyb3IuICR7ZXJyb3IubWVzc2FnZX1gKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICB9XG59IiwiY29uc3QgQ29udHJvbCA9IHJlcXVpcmUoXCIuL2NvbnRyb2xcIik7XG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgQnV0dG9uIGV4dGVuZHMgQ29udHJvbCB7XG4gICAgY29uc3RydWN0b3IobGFiZWwsIG9uQ2xpY2ssIG9wdGlvbnMpIHtcbiAgICAgICAgc3VwZXIob3B0aW9ucyk7XG4gICAgICAgIHRoaXMubGFiZWwgPSBsYWJlbDtcbiAgICAgICAgdGhpcy5vbkNsaWNrID0gb25DbGljaztcbiAgICB9XG5cbiAgICBjcmVhdGVFbGVtZW50KCkge1xuICAgICAgICB0aGlzLmVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdidXR0b24nKTtcbiAgICAgICAgdGhpcy5lbGVtZW50LnN0eWxlLm1pbldpZHRoID0gdGhpcy5vcHRpb25zLndpZHRoO1xuICAgICAgICB0aGlzLmVsZW1lbnQuc3R5bGUubWluSGVpZ2h0ID0gdGhpcy5vcHRpb25zLmhlaWdodDtcbiAgICAgICAgXG4gICAgICAgIHRoaXMuZWxlbWVudC5pbm5lckhUTUwgPSB0aGlzLmxhYmVsO1xuXG4gICAgICAgIHRoaXMuZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChldikgPT4ge1xuICAgICAgICAgICAgZXYucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIHRoaXMub25DbGljayhldik7XG4gICAgICAgIH0pXG5cbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudFxuICAgIH1cblxufVxuIiwiXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIENvbnRyb2wge1xuICAgIGNvbnN0cnVjdG9yKG9wdGlvbnMgPSB7fSkge1xuICAgICAgICAvKiBPcHRpb25zXG4gICAgICAgICAqICB3aWRodCwgaGVpZ2h0ID0gIGNzcyBzaXplXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmVsZW1lbnQgPSBudWxsO1xuICAgICAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuICAgIH1cblxuICAgIGZvY3VzKCkge1xuICAgICAgICB0aGlzLmVsZW1lbnQuZm9jdXMoKTtcbiAgICB9XG5cbiAgICByZW1vdmVFbGVtZW50KCkge1xuICAgICAgICBpZiAodGhpcy5lbGVtZW50ID09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIHBhcmVudCA9IHRoaXMuZWxlbWVudC5wYXJlbnRFbGVtZW50XG5cbiAgICAgICAgaWYgKHBhcmVudCA9PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuXG4gICAgICAgIHBhcmVudC5yZW1vdmVDaGlsZCh0aGlzLmVsZW1lbnQpO1xuICAgIH1cblxuICAgIGNyZWF0ZUVsZW1lbnQoKSB7XG4gICAgICAgIC8vQ3JlYXRlIHRoZSBlbGVtZW50XG4gICAgICAgIHRoaXMuZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXG4gICAgICAgIC8vQWRkIHN0eWxlc1xuICAgICAgICB0aGlzLmVsZW1lbnQuc3R5bGUuZGlzcGxheSA9IFwiZmxleFwiO1xuICAgICAgICB0aGlzLmVsZW1lbnQuc3R5bGUudXNlclNlbGVjdCA9IFwibm9uZVwiO1xuICAgICAgICB0aGlzLmVsZW1lbnQuc3R5bGUud2lkdGggPSB0aGlzLm9wdGlvbnMud2lkdGg7XG4gICAgICAgIHRoaXMuZWxlbWVudC5zdHlsZS5oZWlnaHQgPSB0aGlzLm9wdGlvbnMuaGVpZ2h0O1xuXG4gICAgICAgIC8vQXR0YWNoZSBldmVudHNcblxuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50O1xuICAgIH1cblxuICAgIGhpZGVTb2Z0KCkge1xuICAgICAgICB0aGlzLmVsZW1lbnQuc3R5bGUudmlzaWJpbGl0eSA9ICdoaWRkZW4nO1xuICAgIH1cblxuICAgIGhpZGUoKSB7XG4gICAgICAgIHRoaXMuZWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgfVxuXG4gICAgc2hvdyhkaXNwbGF5ID0gJ2ZsZXgnKSB7XG4gICAgICAgIHRoaXMuZWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gZGlzcGxheTtcbiAgICAgICAgdGhpcy5lbGVtZW50LnN0eWxlLnZpc2liaWxpdHkgPSAnJztcbiAgICB9XG59XG4iLCJjb25zdCBDb250cm9sID0gcmVxdWlyZShcIi4uL2NvbnRyb2xcIik7XG5cblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBEaWFsb2cgZXh0ZW5kcyBDb250cm9sIHtcbiAgICBjb25zdHJ1Y3RvcihvcHRpb25zPXt9KSB7XG4gICAgICAgIC8qIE9wdGlvbnNcbiAgICAgICAgICogIGNlbnRlcmVkPWZhbHNlXG4gICAgICAgICAqL1xuICAgICAgICBzdXBlcihvcHRpb25zKTtcblxuICAgICAgICB0aGlzLm9uQ2FuY2VsID0gbnVsbDtcbiAgICAgICAgdGhpcy5vbk9rID0gbnVsbDtcblxuICAgICAgICB0aGlzLmhlYWRlckVsZW1lbnQgPSBudWxsO1xuICAgICAgICB0aGlzLmJvZHlFbGVtZW50ID0gbnVsbDtcbiAgICAgICAgdGhpcy5mb290ZXJFbGVtZW50ID0gbnVsbDtcblxuICAgICAgICB0aGlzLl9kaWFsb2dFbGVtZW50ID0gbnVsbDtcbiAgICAgICAgdGhpcy5fY2xvc2VFbGVtZW50ID0gbnVsbDtcbiAgICB9XG5cbiAgICB2YWx1ZSgpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgc2hvdyhvbk9rLCBvbkNhbmNlbCkge1xuICAgICAgICB0aGlzLm9uT2sgPSBvbk9rO1xuICAgICAgICB0aGlzLm9uQ2FuY2VsID0gb25DYW5jZWw7XG5cbiAgICAgICAgc3VwZXIuc2hvdygpO1xuICAgIH1cblxuICAgIF9vbkNhbmNlbChldikge1xuICAgICAgICB0aGlzLmhpZGUoKTtcbiAgICAgICAgdGhpcy5vbkNhbmNlbCgpO1xuICAgIH1cblxuICAgIF9vbk9rKGV2KSB7XG4gICAgICAgIHRoaXMuaGlkZSgpO1xuICAgICAgICB0aGlzLm9uT2sodGhpcy52YWx1ZSgpKTtcbiAgICB9XG5cbiAgICBjcmVhdGVFbGVtZW50KCkge1xuICAgICAgICB0aGlzLmVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmNlbnRlcmVkID09IHRydWUpe1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LmNsYXNzTmFtZSA9ICdmb3JlZ3JvdW5kLWNlbnRlcmVkJztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5jbGFzc05hbWUgPSAnZm9yZWdyb3VuZCc7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9kaWFsb2dFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIHRoaXMuX2RpYWxvZ0VsZW1lbnQuY2xhc3NOYW1lID0gJ2RpYWxvZyc7XG4gICAgICAgIHRoaXMuX2RpYWxvZ0VsZW1lbnQuc3R5bGUudXNlclNlbGVjdCA9IFwibm9uZVwiO1xuICAgICAgICB0aGlzLl9kaWFsb2dFbGVtZW50LnN0eWxlLmRpc3BsYXkgPSBcImZsZXhcIjtcbiAgICAgICAgdGhpcy5fZGlhbG9nRWxlbWVudC5zdHlsZS5mbGV4RGlyZWN0aW9uID0gXCJjb2x1bW5cIlxuICAgICAgICB0aGlzLl9kaWFsb2dFbGVtZW50LnN0eWxlLndpZHRoID0gdGhpcy5vcHRpb25zLndpZHRoO1xuICAgICAgICB0aGlzLl9kaWFsb2dFbGVtZW50LnN0eWxlLmhlaWdodCA9IHRoaXMub3B0aW9ucy5oZWlnaHQ7XG4gICAgICAgIHRoaXMuZWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLl9kaWFsb2dFbGVtZW50KTtcblxuICAgICAgICB2YXIgaGVhZGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIGhlYWRlci5jbGFzc05hbWUgPSAnZGlhbG9nLWhlYWRlcic7XG4gICAgICAgIGhlYWRlci5zdHlsZS5kaXNwbGF5ID0gJ2ZsZXgnO1xuICAgICAgICAvL2hlYWRlci5zdHlsZS5mbGV4RGlyZWN0aW9uID0gJ3Jvdyc7XG4gICAgICAgIHRoaXMuX2RpYWxvZ0VsZW1lbnQuYXBwZW5kQ2hpbGQoaGVhZGVyKTtcbiAgICAgICAgXG4gICAgICAgIHRoaXMuaGVhZGVyRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICB0aGlzLmhlYWRlckVsZW1lbnQuc3R5bGUuZGlzcGxheSA9ICdmbGV4JztcbiAgICAgICAgdGhpcy5oZWFkZXJFbGVtZW50LnN0eWxlLmZsZXhHcm93ID0gMTtcbiAgICAgICAgaGVhZGVyLmFwcGVuZENoaWxkKHRoaXMuaGVhZGVyRWxlbWVudCk7XG5cbiAgICAgICAgdGhpcy5fY2xvc2VFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIHRoaXMuX2Nsb3NlRWxlbWVudC5jbGFzc05hbWUgPSAnZGlhbG9nLWNsb3NlJztcbiAgICAgICAgdGhpcy5fY2xvc2VFbGVtZW50LmlubmVySFRNTCA9ICcmdGltZXM7J1xuICAgICAgICBoZWFkZXIuYXBwZW5kQ2hpbGQodGhpcy5fY2xvc2VFbGVtZW50KTtcblxuICAgICAgICB0aGlzLmJvZHlFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIHRoaXMuYm9keUVsZW1lbnQuY2xhc3NOYW1lID0gJ2RpYWxvZy1ib2R5JztcbiAgICAgICAgdGhpcy5ib2R5RWxlbWVudC5zdHlsZS5mbGV4R3JvdyA9IDE7XG4gICAgICAgIHRoaXMuX2RpYWxvZ0VsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5ib2R5RWxlbWVudCk7XG5cbiAgICAgICAgdGhpcy5mb290ZXJFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIHRoaXMuZm9vdGVyRWxlbWVudC5jbGFzc05hbWUgPSAnZGlhbG9nLWZvb3Rlcic7XG4gICAgICAgIHRoaXMuX2RpYWxvZ0VsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5mb290ZXJFbGVtZW50KTtcblxuICAgICAgICB0aGlzLmhpZGUoKTtcblxuICAgICAgICB0aGlzLmVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZXYpID0+IHtcbiAgICAgICAgICAgIC8vdGhpcy5fb25DYW5jZWwoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5fZGlhbG9nRWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChldikgPT4ge1xuICAgICAgICAgICAgO1xuICAgICAgICB9KVxuXG4gICAgICAgIHRoaXMuX2Nsb3NlRWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChldikgPT4ge1xuICAgICAgICAgICAgdGhpcy5fb25DYW5jZWwoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy50aXRsZSAhPSBudWxsKSB7XG4gICAgICAgICAgICB2YXIgdGl0bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdoMScpO1xuICAgICAgICAgICAgdGl0bGUuaW5uZXJUZXh0ID0gdGhpcy5vcHRpb25zLnRpdGxlO1xuICAgICAgICAgICAgdGhpcy5oZWFkZXJFbGVtZW50LmFwcGVuZENoaWxkKHRpdGxlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vdGhpcy5ib2R5RWxlbWVudC5pbm5lckhUTUwgPSAnU29tZSBzaGl0IHRoYXQgaXMgaW4gYSBkaWFsb2cgaXMgaGVyZSBub3cnO1xuICAgICAgICAvL3RoaXMuZm9vdGVyRWxlbWVudC5pbm5lclRleHQgPSAnVGhpcyBpcyB0aGUgZm9vdGVyJ1xuXG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnQ7XG4gICAgfVxuXG59IiwiY29uc3QgRGlhbG9nID0gcmVxdWlyZShcIi4vZGlhbG9nXCIpO1xuY29uc3QgQnV0dG9uID0gcmVxdWlyZShcIi4uL2J1dHRvblwiKTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIEZvcm1EaWFsb2cgZXh0ZW5kcyBEaWFsb2cge1xuICAgIGNvbnN0cnVjdG9yKGZvcm0sIG9wdGlvbnM9e30pIHtcbiAgICAgICAgc3VwZXIob3B0aW9ucylcblxuICAgICAgICB0aGlzLmZvcm0gPSBmb3JtO1xuXG4gICAgICAgIHRoaXMuYnRuT2sgPSBuZXcgQnV0dG9uKFxuICAgICAgICAgICAgb3B0aW9ucy5va0xhYmVsICE9IG51bGwgPyBvcHRpb25zLm9rTGFiZWwgOiAnT2snLFxuICAgICAgICAgICAgKGV2KSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5fb25Payhldik7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHdpZHRoOiAnODBweCdcbiAgICAgICAgICAgIH1cbiAgICAgICAgKTtcblxuICAgICAgICB0aGlzLmJ0bkNhbmNlbCA9IG5ldyBCdXR0b24oXG4gICAgICAgICAgICBvcHRpb25zLmNhbmNlbExhYmVsICE9IG51bGwgPyBvcHRpb25zLmNhbmNlbExhYmVsIDogJ0NhbmNlbCcsXG4gICAgICAgICAgICAoZXYpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLl9vbkNhbmNlbChldik7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHdpZHRoOiAnODBweCdcbiAgICAgICAgICAgIH1cbiAgICAgICAgKVxuICAgIH1cblxuICAgIHZhbHVlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5mb3JtLnZhbHVlKCk7XG4gICAgfVxuXG4gICAgX29uT2soZXYpIHtcbiAgICAgICAgaWYgKHRoaXMuZm9ybS52YWxpZGF0ZSgpID09IGZhbHNlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBzdXBlci5fb25Payhldik7XG4gICAgfVxuXG4gICAgY3JlYXRlRWxlbWVudCgpIHtcbiAgICAgICAgc3VwZXIuY3JlYXRlRWxlbWVudCgpO1xuXG4gICAgICAgIHRoaXMuYm9keUVsZW1lbnQuY2xhc3NOYW1lID0gJ2RpYWxvZy1ib2R5LXBhZGRlZCc7XG4gICAgICAgIHRoaXMuYm9keUVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5mb3JtLmNyZWF0ZUVsZW1lbnQoKSk7XG5cbiAgICAgICAgdGhpcy5mb290ZXJFbGVtZW50LmFwcGVuZENoaWxkKHRoaXMuYnRuQ2FuY2VsLmNyZWF0ZUVsZW1lbnQoKSk7XG4gICAgICAgIHRoaXMuZm9vdGVyRWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLmJ0bk9rLmNyZWF0ZUVsZW1lbnQoKSk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudDtcbiAgICB9XG5cbn0iLCJcbmNvbnN0IENvbnRyb2wgPSByZXF1aXJlKFwiLi4vY29udHJvbFwiKTtcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBGaWVsZCBleHRlbmRzIENvbnRyb2wge1xuICAgIGNvbnN0cnVjdG9yKG5hbWUsIG9wdGlvbnMgPSB7fSkge1xuICAgICAgICAvKk9wdGlvbnNcbiAgICAgICAgICogIGxhYmVsPVwiXCJcbiAgICAgICAgICogIGxhYmVsU2l6ZT1pbiBjc3MgdW5pdHNcbiAgICAgICAgICogIGxhYmVsVG9wPWZhbHNlXG4gICAgICAgICAqICByZXF1aXJlZD10cnVlfGZhbHNlXG4gICAgICAgICAqICBpbnZhbGlkRmVlZGJhY2s9XCJcIlxuICAgICAgICAgKiAgaGVscFRleHQ9XCJcIlxuICAgICAgICAgKiAgcGxhY2Vob2xkZXI9XCJcIlxuICAgICAgICAgKi9cbiAgICAgICAgc3VwZXIob3B0aW9ucyk7XG4gICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgICAgIC8vdGhpcy5sYWJlbCA9IGxhYmVsO1xuXG4gICAgICAgIHRoaXMuX2xhYmVsRWxlbWVudCA9IG51bGw7XG4gICAgICAgIHRoaXMuX3BsYWNlaG9sZGVyRWxlbWVudCA9IG51bGw7XG4gICAgICAgIHRoaXMuX2hlbHBFbGVtZW50ID0gbnVsbDtcbiAgICAgICAgdGhpcy5faW52YWxpZEVsZW1lbnQgPSBudWxsO1xuICAgIH1cblxuICAgIHZhbHVlKCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgc2V0VmFsdWUodmFsdWUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHNldExhYmVsKHRleHQpIHtcbiAgICAgICAgaWYgKHRoaXMuX2xhYmVsRWxlbWVudCAhPSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLl9sYWJlbEVsZW1lbnQuaW5uZXJUZXh0ID0gdGV4dDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHNldERhdGEoZGF0YSkge1xuICAgICAgICAvL0V4cGVjdHMgYSBkaWN0aW9uYXJ5IHdpdGgga2V5IGVxdWFsIHRvIG5hbWVcbiAgICAgICAgdGhpcy5zZXRWYWx1ZShcbiAgICAgICAgICAgIGRhdGFbdGhpcy5uYW1lXVxuICAgICAgICApO1xuICAgIH1cblxuICAgIGlzQmxhbmsoKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBpc1ZhbGlkKCkge1xuICAgICAgICBpZiAodGhpcy5vcHRpb25zLnJlcXVpcmVkID09IHRydWUpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmlzQmxhbmsoKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICB2YWxpZGF0ZSgpIHtcbiAgICAgICAgdGhpcy5tYXJrVmFsaWQoKTtcblxuICAgICAgICB2YXIgaXNWYWxpZCA9IHRoaXMuaXNWYWxpZCgpO1xuICAgICAgICBpZiAoIWlzVmFsaWQpIHtcbiAgICAgICAgICAgIHRoaXMubWFya0ludmFsaWQoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBpc1ZhbGlkO1xuICAgIH1cblxuICAgIG1hcmtJbnZhbGlkKCkge1xuICAgICAgICB0aGlzLmVsZW1lbnQuY2xhc3NMaXN0LmFkZCgnaW52YWxpZCcpO1xuICAgIH1cblxuICAgIG1hcmtWYWxpZCgpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoJ2ludmFsaWQnKTtcbiAgICB9XG5cbiAgICBsb2NrKCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdW5sb2NrKCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY3JlYXRlRWxlbWVudCgpIHtcbiAgICAgICAgc3VwZXIuY3JlYXRlRWxlbWVudCgpXG5cbiAgICAgICAgdGhpcy5lbGVtZW50LmNsYXNzTGlzdC5hZGQoJ2ZpZWxkJyk7XG5cbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5sYWJlbCAhPSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLl9sYWJlbEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsYWJlbCcpO1xuICAgICAgICAgICAgdGhpcy5fbGFiZWxFbGVtZW50LmlubmVySFRNTCA9IHRoaXMub3B0aW9ucy5sYWJlbDtcbiAgICAgICAgICAgIHRoaXMuX2xhYmVsRWxlbWVudC5zdHlsZS53aWR0aCA9IHRoaXMub3B0aW9ucy5sYWJlbFNpemU7XG4gICAgICAgICAgICAvL3RoaXMuZWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLl9sYWJlbEVsZW1lbnQpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB2YXIgY29udGVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICBjb250ZW50LnN0eWxlLmRpc3BsYXkgPSAnZmxleCc7XG4gICAgICAgIGNvbnRlbnQuc3R5bGUuZmxleERpcmVjdGlvbiA9ICdjb2x1bW4nO1xuICAgICAgICBjb250ZW50LnN0eWxlLmZsZXhHcm93ID0gMTtcbiAgICAgICAgLy90aGlzLmVsZW1lbnQuYXBwZW5kQ2hpbGQoY29udGVudCk7XG5cbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5sYWJlbCA9PSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQuYXBwZW5kQ2hpbGQoY29udGVudCk7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5vcHRpb25zLmxhYmVsVG9wID09IHRydWUpIHtcbiAgICAgICAgICAgIGNvbnRlbnQuYXBwZW5kQ2hpbGQodGhpcy5fbGFiZWxFbGVtZW50KTtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5hcHBlbmRDaGlsZChjb250ZW50KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLl9sYWJlbEVsZW1lbnQpO1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LmFwcGVuZENoaWxkKGNvbnRlbnQpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fcGxhY2Vob2xkZXJFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIHRoaXMuX3BsYWNlaG9sZGVyRWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gJ2ZsZXgnO1xuICAgICAgICB0aGlzLl9wbGFjZWhvbGRlckVsZW1lbnQuc3R5bGUuZmxleEdyb3cgPSAxO1xuICAgICAgICBjb250ZW50LmFwcGVuZENoaWxkKHRoaXMuX3BsYWNlaG9sZGVyRWxlbWVudCk7XG5cbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5oZWxwVGV4dCAhPSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLl9oZWxwRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICAgICAgdGhpcy5faGVscEVsZW1lbnQuY2xhc3NOYW1lID0gJ2hlbHAtdGV4dCc7XG4gICAgICAgICAgICB0aGlzLl9oZWxwRWxlbWVudC5pbm5lckhUTUwgPSB0aGlzLm9wdGlvbnMuaGVscFRleHQ7XG4gICAgICAgICAgICBjb250ZW50LmFwcGVuZENoaWxkKHRoaXMuX2hlbHBFbGVtZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuaW52YWxpZEZlZWRiYWNrICE9IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMuX2ludmFsaWRFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgICAgICB0aGlzLl9pbnZhbGlkRWxlbWVudC5jbGFzc05hbWUgPSAnaW52YWxpZC1mZWVkYmFjayc7XG4gICAgICAgICAgICB0aGlzLl9pbnZhbGlkRWxlbWVudC5pbm5lckhUTUwgPSB0aGlzLm9wdGlvbnMuaW52YWxpZEZlZWRiYWNrO1xuICAgICAgICAgICAgY29udGVudC5hcHBlbmRDaGlsZCh0aGlzLl9pbnZhbGlkRWxlbWVudCk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnRcbiAgICB9XG59XG4iLCJjb25zdCBDb250cm9sID0gcmVxdWlyZShcIi4uL2NvbnRyb2xcIik7XG5cblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBGb3JtIGV4dGVuZHMgQ29udHJvbCB7XG4gICAgY29uc3RydWN0b3Iob3B0aW9ucz17fSkge1xuICAgICAgICAvKk9wdGlvbnNcbiAgICAgICAgICogIGxhYmVsU2l6ZT1pbiBjc3MgdW5pdHNcbiAgICAgICAgICogIGxhYmVsVG9wPWZhbHNlXG4gICAgICAgICAqICBmbGV4RGlyZWN0aW9uPSdjb2x1bW58cm93J1xuICAgICAgICAgKi9cbiAgICAgICAgc3VwZXIob3B0aW9ucyk7XG5cbiAgICAgICAgdGhpcy5fZmllbGRzID0gW107XG4gICAgICAgIHRoaXMuX2ZpZWxkTmFtZXMgPSBbXTtcbiAgICB9XG5cbiAgICBhZGRGaWVsZChmaWVsZCkge1xuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmxhYmVsU2l6ZSAhPSBudWxsKSB7XG4gICAgICAgICAgICBmaWVsZC5vcHRpb25zLmxhYmVsU2l6ZSA9IHRoaXMub3B0aW9ucy5sYWJlbFNpemU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5sYWJlbFRvcCAhPSBudWxsKSB7XG4gICAgICAgICAgICBmaWVsZC5vcHRpb25zLmxhYmVsVG9wID0gdGhpcy5vcHRpb25zLmxhYmVsVG9wO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fZmllbGRzLnB1c2goZmllbGQpO1xuICAgICAgICB0aGlzLl9maWVsZE5hbWVzLnB1c2goZmllbGQubmFtZSk7XG4gICAgfVxuXG4gICAgc2V0VmFsdWUodmFsdWUpIHtcbiAgICAgICAgLy9WYWx1ZSBpcyBkaWN0aW9uYXJ5IHdpdGggZmllbGROYW1lOiB2YWx1ZVxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuX2ZpZWxkTmFtZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMuX2ZpZWxkc1tpXS5zZXRWYWx1ZShcbiAgICAgICAgICAgICAgICB2YWx1ZVt0aGlzLl9maWVsZE5hbWVzW2ldXVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHZhbHVlKCkge1xuICAgICAgICAvL1JldHVybnMgYSBkaWN0aW9uYXJ5IHdpdGggZmllbGROYW1lOiB2YWx1ZVxuICAgICAgICB2YXIgcmVzdWx0ID0ge307XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5fZmllbGROYW1lcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgcmVzdWx0W3RoaXMuX2ZpZWxkTmFtZXNbaV1dID0gdGhpcy5fZmllbGRzW2ldLnZhbHVlKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICBnZXRGaWVsZEJ5TmFtZShmaWVsZE5hbWUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2ZpZWxkc1t0aGlzLl9maWVsZE5hbWVzLmZpbmRJbmRleCgodmFsdWUpID0+IHsgcmV0dXJuIHZhbHVlID09IGZpZWxkTmFtZTt9KV07XG4gICAgfVxuXG4gICAgc2V0RmllbGRMYWJlbChmaWVsZE5hbWUsIGxhYmVsKSB7XG4gICAgICAgIHRoaXMuZ2V0RmllbGRCeU5hbWUoZmllbGROYW1lKS5zZXRMYWJlbChsYWJlbCk7XG4gICAgfVxuXG4gICAgc2V0RmllbGRWYWx1ZShmaWVsZE5hbWUsIHZhbHVlKSB7XG4gICAgICAgIHRoaXMuZ2V0RmllbGRCeU5hbWUoZmllbGROYW1lKS5zZXRWYWx1ZSh2YWx1ZSk7XG4gICAgfVxuXG4gICAgZmllbGRWYWx1ZShmaWVsZE5hbWUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0RmllbGRCeU5hbWUoZmllbGROYW1lKS52YWx1ZSgpO1xuICAgIH1cblxuICAgIGhpZGVGaWVsZChmaWVsZE5hbWUpIHtcbiAgICAgICAgdGhpcy5nZXRGaWVsZEJ5TmFtZShmaWVsZE5hbWUpLmhpZGUoKTtcbiAgICB9XG5cbiAgICB2YWxpZGF0ZSgpIHtcbiAgICAgICAgdmFyIGlzVmFsaWQgPSB0cnVlO1xuXG4gICAgICAgIHRoaXMuX2ZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgaWYgKGZpZWxkLnZhbGlkYXRlKCkgPT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICBpc1ZhbGlkID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBpc1ZhbGlkO1xuICAgIH1cblxuICAgIGxvY2soKSB7XG4gICAgICAgIHRoaXMuX2ZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgZmllbGQubG9jaygpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICB1bmxvY2soKSB7XG4gICAgICAgIHRoaXMuX2ZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgZmllbGQudW5sb2NrKCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGNsZWFyVmFsaWRhdGlvbigpIHtcbiAgICAgICAgdGhpcy5fZmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICBmaWVsZC5tYXJrVmFsaWQoKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgY3JlYXRlRWxlbWVudCgpIHtcbiAgICAgICAgc3VwZXIuY3JlYXRlRWxlbWVudCgpO1xuXG4gICAgICAgIHRoaXMuZWxlbWVudC5zdHlsZS5mbGV4RGlyZWN0aW9uID0gdGhpcy5vcHRpb25zLmZsZXhEaXJlY3Rpb24gPyB0aGlzLm9wdGlvbnMuZmxleERpcmVjdGlvbiA6ICdjb2x1bW4nO1xuXG4gICAgICAgIHRoaXMuX2ZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LmFwcGVuZENoaWxkKGZpZWxkLmNyZWF0ZUVsZW1lbnQoKSk7XG4gICAgICAgIH0pXG5cbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudDtcbiAgICB9XG5cbn0iLCJjb25zdCBUZXh0Qm94ID0gcmVxdWlyZShcIi4uL3RleHQtYm94XCIpO1xuY29uc3QgRmllbGQgPSByZXF1aXJlKFwiLi9maWVsZFwiKTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFRleHRGaWVsZCBleHRlbmRzIEZpZWxkIHtcbiAgICBjb25zdHJ1Y3RvcihuYW1lLCBvcHRpb25zID0ge30pIHtcbiAgICAgICAgc3VwZXIobmFtZSwgb3B0aW9ucyk7XG5cbiAgICAgICAgdGhpcy5fdGV4dEJveCA9IG5ldyBUZXh0Qm94KHtcbiAgICAgICAgICAgIHBsYWNlaG9sZGVyOiBvcHRpb25zLnBsYWNlaG9sZGVyLFxuICAgICAgICAgICAgdHlwZTogb3B0aW9ucy50eXBlLFxuICAgICAgICAgICAgcm93czogb3B0aW9ucy5yb3dzLFxuICAgICAgICAgICAgcmVzaXplOiBvcHRpb25zLnJlc2l6ZVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmb2N1cygpIHtcbiAgICAgICAgdGhpcy5fdGV4dEJveC5mb2N1cygpO1xuICAgIH1cblxuICAgIGlzQmxhbmsoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl90ZXh0Qm94LmlzQmxhbmsoKTtcbiAgICB9XG5cbiAgICB2YWx1ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3RleHRCb3gudmFsdWUoKTtcbiAgICB9XG5cbiAgICBzZXRWYWx1ZSh2YWx1ZSkge1xuICAgICAgICB0aGlzLl90ZXh0Qm94LnNldFZhbHVlKHZhbHVlKTtcbiAgICB9XG5cbiAgICBsb2NrKCkge1xuICAgICAgICB0aGlzLl90ZXh0Qm94LmxvY2soKTtcbiAgICB9XG5cbiAgICB1bmxvY2soKSB7XG4gICAgICAgIHRoaXMuX3RleHRCb3gudW5sb2NrKCk7XG4gICAgfVxuXG4gICAgY3JlYXRlRWxlbWVudCgpIHtcbiAgICAgICAgc3VwZXIuY3JlYXRlRWxlbWVudCgpXG5cbiAgICAgICAgdGhpcy5fcGxhY2Vob2xkZXJFbGVtZW50LmFwcGVuZENoaWxkKFxuICAgICAgICAgICAgdGhpcy5fdGV4dEJveC5jcmVhdGVFbGVtZW50KClcbiAgICAgICAgKTtcblxuICAgICAgICB0aGlzLl90ZXh0Qm94LmVsZW1lbnQuc3R5bGUuZmxleEdyb3cgPSAxO1xuXG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnQ7XG4gICAgfVxufVxuIiwiY29uc3QgU2Nyb2xsZWQgPSByZXF1aXJlKFwiLi9zY3JvbGxlZFwiKTtcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBMaXN0Qm94IGV4dGVuZHMgU2Nyb2xsZWQge1xuICAgIGNvbnN0cnVjdG9yKGlkRnVuY3Rpb24sIGxhYmVsRnVuY3Rpb24sIG9uU2VsZWN0SXRlbSwgb3B0aW9ucykge1xuICAgICAgICAvKiBpZEZ1bmN0aW9uKHJlc3VsdCkgeyByZXR1cm4gcmVzdWx0LnVuaXF1ZV9pZCB9XG4gICAgICAgICAqIGxhYmVsRnVuY3Rpb24ocmVzdWx0KSB7IHJldHVybiByZXN1bHQubGFiZWwgfVxuICAgICAgICAgKiBvblJlc3VsdENsaWNrZWQocmVzdWx0KSB7IGRvIHNvbWV0aGluZyB1c2luZyByZXN1bHQgfVxuICAgICAgICAgKiBcbiAgICAgICAgICovXG4gICAgICAgIHN1cGVyKG9wdGlvbnMpO1xuXG4gICAgICAgIHRoaXMuaWRGdW5jdGlvbiA9IGlkRnVuY3Rpb247XG4gICAgICAgIHRoaXMubGFiZWxGdW5jdGlvbiA9IGxhYmVsRnVuY3Rpb247XG4gICAgICAgIHRoaXMub25TZWxlY3RJdGVtID0gb25TZWxlY3RJdGVtO1xuXG4gICAgICAgIHRoaXMuZGF0YSA9IFtdO1xuICAgICAgICB0aGlzLl9pdGVtSWRzID0gW107XG4gICAgICAgIHRoaXMuX2l0ZW1FbGVtZW50cyA9IFtdO1xuXG4gICAgICAgIHRoaXMuX2xpc3RFbGVtZW50ID0gbnVsbDtcblxuICAgICAgICB0aGlzLl9zZWxlY3RlZEl0ZW0gPSBudWxsO1xuICAgICAgICB0aGlzLl9zZWxlY3RlZEVsZW1lbnQgPSBudWxsO1xuXG4gICAgICAgIHRoaXMuX29uSXRlbUNsaWNrZWQgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIHRoaXMuY2xlYXJTZWxlY3Rpb24oKTtcblxuICAgICAgICAgICAgdGhpcy5fc2VsZWN0ZWRFbGVtZW50ID0gZXZlbnQuY3VycmVudFRhcmdldDtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdGhpcy5faGlnaGxpZ2h0U2VsZWN0aW9uKCk7XG4gICAgICAgICAgICB0aGlzLl9vblNlbGVjdEl0ZW0oZXZlbnQpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX2NyZWF0ZUxpc3RJdGVtKGl0ZW1pZCwgbGFiZWwpIHtcbiAgICAgICAgdmFyIGl0ZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xuICAgICAgICBpdGVtLnNldEF0dHJpYnV0ZSgnaXRlbS1pZCcsIGl0ZW1pZCk7XG4gICAgICAgIGl0ZW0uaW5uZXJIVE1MID0gbGFiZWw7XG5cbiAgICAgICAgaXRlbS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMuX29uSXRlbUNsaWNrZWQpO1xuXG4gICAgICAgIHJldHVybiBpdGVtO1xuICAgIH1cblxuICAgIF9jbGVhcigpIHtcbiAgICAgICAgd2hpbGUgKHRoaXMuX2xpc3RFbGVtZW50LmZpcnN0Q2hpbGQpIHtcbiAgICAgICAgICAgIHRoaXMuX2xpc3RFbGVtZW50LmZpcnN0Q2hpbGQucmVtb3ZlKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBfaGlnaGxpZ2h0U2VsZWN0aW9uKCkge1xuICAgICAgICB0aGlzLl9zZWxlY3RlZEVsZW1lbnQuY2xhc3NOYW1lID0gJ3NlbGVjdGVkJztcbiAgICB9XG5cbiAgICBfb25TZWxlY3RJdGVtKGV2ZW50KSB7XG4gICAgICAgIHRoaXMuX3NlbGVjdGVkSXRlbSA9IG51bGw7XG4gICAgICAgIHZhciBzZWxlY3RlZElkID0gdGhpcy5fc2VsZWN0ZWRFbGVtZW50LmdldEF0dHJpYnV0ZSgnaXRlbS1pZCcpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuX2l0ZW1JZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9pdGVtSWRzW2ldID09IHNlbGVjdGVkSWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9zZWxlY3RlZEl0ZW0gPSB0aGlzLmRhdGFbaV07XG4gICAgICAgICAgICAgICAgdGhpcy5vblNlbGVjdEl0ZW0odGhpcy5fc2VsZWN0ZWRJdGVtKTtcbiAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHZhbHVlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fc2VsZWN0ZWRJdGVtO1xuICAgIH1cblxuICAgIHNldFNlbGVjdGlvbihpdGVtSWQpIHtcbiAgICAgICAgaWYgKGl0ZW1JZCA9PSBudWxsIHx8IGl0ZW1JZCA9PSAnJykge1xuICAgICAgICAgICAgdGhpcy5jbGVhclNlbGVjdGlvbigpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5faXRlbUlkcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKHRoaXMuX2l0ZW1JZHNbaV0gPT0gaXRlbUlkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jbGVhclNlbGVjdGlvbigpO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5fc2VsZWN0ZWRFbGVtZW50ID0gdGhpcy5faXRlbUVsZW1lbnRzW2ldO1xuICAgICAgICAgICAgICAgIHRoaXMuX3NlbGVjdGVkSXRlbSA9IHRoaXMuZGF0YVtpXTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB0aGlzLl9oaWdobGlnaHRTZWxlY3Rpb24oKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9zZWxlY3RlZEVsZW1lbnQuc2Nyb2xsSW50b1ZpZXcoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNsZWFyU2VsZWN0aW9uKCkge1xuICAgICAgICBpZiAodGhpcy5fc2VsZWN0ZWRFbGVtZW50ICE9IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMuX3NlbGVjdGVkRWxlbWVudC5jbGFzc05hbWUgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3NlbGVjdGVkRWxlbWVudCA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5fc2VsZWN0ZWRJdGVtID0gbnVsbDtcbiAgICB9XG5cbiAgICBzZXREYXRhKGRhdGEpIHtcbiAgICAgICAgdGhpcy5kYXRhID0gZGF0YTtcbiAgICAgICAgdGhpcy5kaXNwbGF5RGF0YSgpO1xuICAgIH1cblxuICAgIGFwcGVuZERhdGEoZGF0YSkge1xuICAgICAgICBpZiAoIXRoaXMuZGF0YSkge1xuICAgICAgICAgICAgdGhpcy5kYXRhID0gZGF0YVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5kYXRhID0gdGhpcy5kYXRhLmNvbmNhdChkYXRhKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmRpc3BsYXlEYXRhKHRydWUpO1xuICAgIH1cblxuICAgIGRpc3BsYXlEYXRhKG5vU2Nyb2xsKSB7XG4gICAgICAgIHRoaXMuX2NsZWFyKCk7XG4gICAgICAgIFxuICAgICAgICB0aGlzLl9pdGVtSWRzID0gW107XG4gICAgICAgIHRoaXMuX2l0ZW1FbGVtZW50cyA9IFtdO1xuICAgICAgICB0aGlzLmRhdGEuZm9yRWFjaCgoaXRlbSkgPT4ge1xuICAgICAgICAgICAgdmFyIGl0ZW1faWQgPSB0aGlzLmlkRnVuY3Rpb24oaXRlbSk7XG5cbiAgICAgICAgICAgIHRoaXMuX2l0ZW1JZHMucHVzaChpdGVtX2lkKTtcblxuICAgICAgICAgICAgdmFyIGVsZW0gPSB0aGlzLl9jcmVhdGVMaXN0SXRlbShcbiAgICAgICAgICAgICAgICBpdGVtX2lkLFxuICAgICAgICAgICAgICAgIHRoaXMubGFiZWxGdW5jdGlvbihpdGVtKVxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgdGhpcy5fbGlzdEVsZW1lbnQuYXBwZW5kQ2hpbGQoZWxlbSk7XG4gICAgICAgICAgICB0aGlzLl9pdGVtRWxlbWVudHMucHVzaChlbGVtKTtcbiAgICAgICAgfSlcblxuICAgICAgICBpZiAoIW5vU2Nyb2xsKSB7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQuc2Nyb2xsVG9wID0gMDtcbiAgICAgICAgfSAgICAgICBcbiAgICB9XG5cbiAgICBjcmVhdGVFbGVtZW50KCkge1xuICAgICAgICBzdXBlci5jcmVhdGVFbGVtZW50KCk7XG5cbiAgICAgICAgdGhpcy5lbGVtZW50LmNsYXNzTGlzdC5hZGQoJ2xpc3QtYm94Jyk7XG4gICAgICAgIFxuICAgICAgICB0aGlzLl9saXN0RWxlbWVudCA9ICBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd1bCcpO1xuICAgICAgICB0aGlzLmVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5fbGlzdEVsZW1lbnQpO1xuXG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnQ7XG4gICAgfVxufSIsImNvbnN0IENvbnRyb2wgPSByZXF1aXJlKCcuL2NvbnRyb2wnKTtcbmNvbnN0IFNwaW5uZXIgPSByZXF1aXJlKCcuL3NwaW5uZXInKTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFJlc291cmNlQWNjb3JkaW9uSXRlbSBleHRlbmRzIENvbnRyb2wge1xuICAgIGNvbnN0cnVjdG9yKGl0ZW1EYXRhLCBvcHRpb25zKSB7XG4gICAgICAgIHN1cGVyKG9wdGlvbnMpO1xuXG4gICAgICAgIHRoaXMuaXRlbURhdGEgPSBpdGVtRGF0YTtcblxuICAgICAgICB0aGlzLnJlc291cmNlRGF0YSA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5zcGlubmVyID0gbmV3IFNwaW5uZXIoKTtcblxuICAgICAgICB0aGlzLl9vbkNsaWNrSGVhZGVyID0gKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICB0aGlzLnRvZ2dsZUJvZHkoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIF9zaG93U3Bpbm5lcigpIHtcbiAgICAgICAgdGhpcy5ib2R5RWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLnNwaW5uZXIuY3JlYXRlRWxlbWVudCgpKTtcbiAgICB9XG5cbiAgICBfaGlkZVNwaW5uZXIoKSB7XG4gICAgICAgIHRoaXMuc3Bpbm5lci5yZW1vdmVFbGVtZW50KCk7XG4gICAgfVxuXG4gICAgdG9nZ2xlQm9keSgpIHtcbiAgICAgICAgaWYgKHRoaXMuYm9keUVsZW1lbnQuc3R5bGUuZGlzcGxheSA9PSAnbm9uZScpIHtcbiAgICAgICAgICAgIHRoaXMuc2hvd0JvZHkoKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmhpZGVCb2R5KCk7XG4gICAgfVxuXG4gICAgc2hvd0JvZHkoKSB7XG4gICAgICAgIHRoaXMuYm9keUVsZW1lbnQuc3R5bGUuZGlzcGxheSA9ICdmbGV4JztcblxuICAgICAgICB0aGlzLmxvYWRSZXNvdXJjZSgpO1xuICAgIH1cblxuICAgIGhpZGVCb2R5KCkge1xuICAgICAgICB0aGlzLmJvZHlFbGVtZW50LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgIHRoaXMuX2hpZGVTcGlubmVyKCk7XG4gICAgfVxuXG4gICAgbG9hZFJlc291cmNlKCkge1xuICAgICAgICBpZiAodGhpcy5yZXNvdXJjZURhdGEgIT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fc2hvd1NwaW5uZXIoKTtcbiAgICAgICAgY29ubmVjdGlvbi5nZXQoXG4gICAgICAgICAgICB0aGlzLml0ZW1EYXRhLnVybCxcbiAgICAgICAgICAgIChkYXRhKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZXNvdXJjZURhdGEgPSBkYXRhO1xuICAgICAgICAgICAgICAgIHRoaXMuZGlzcGxheVJlc291cmNlKCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgKGVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coZXJyb3IpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLl9oaWRlU3Bpbm5lcigpO1xuICAgICAgICAgICAgfVxuICAgICAgICApXG4gICAgfVxuXG4gICAgZGlzcGxheVJlc291cmNlKCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY3JlYXRlSGVhZGVyRWxlbWVudCgpIHtcbiAgICAgICAgdGhpcy5oZWFkZXJFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIHRoaXMuaGVhZGVyRWxlbWVudC5jbGFzc05hbWUgPSAncm9vdC1pdGVtLWhlYWQnO1xuICAgICAgICB0aGlzLmhlYWRlckVsZW1lbnQuaW5uZXJIVE1MID0gJ1RpdGxlJztcbiAgICAgICAgdGhpcy5oZWFkZXJFbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5fb25DbGlja0hlYWRlcik7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuaGVhZGVyRWxlbWVudDtcblxuICAgIH1cblxuICAgIGNyZWF0ZUJvZHlFbGVtZW50KCkge1xuICAgICAgICB0aGlzLmJvZHlFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIHRoaXMuYm9keUVsZW1lbnQuY2xhc3NOYW1lID0gJ3Jvb3QtaXRlbS1ib2R5JztcblxuICAgICAgICByZXR1cm4gdGhpcy5ib2R5RWxlbWVudDtcbiAgICB9XG5cbiAgICBjcmVhdGVFbGVtZW50KCkge1xuICAgICAgICB0aGlzLmVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xuICAgICAgICB0aGlzLmVsZW1lbnQuY2xhc3NOYW1lID0gJ3Jvb3QtaXRlbSc7XG5cbiAgICAgICAgdGhpcy5lbGVtZW50LmFwcGVuZENoaWxkKHRoaXMuY3JlYXRlSGVhZGVyRWxlbWVudCgpKTtcbiAgICAgICAgdGhpcy5lbGVtZW50LmFwcGVuZENoaWxkKHRoaXMuY3JlYXRlQm9keUVsZW1lbnQoKSk7XG5cbiAgICAgICAgdGhpcy5oaWRlQm9keSgpO1xuXG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnQ7XG4gICAgfVxufSIsImNvbnN0IENvbnRyb2wgPSByZXF1aXJlKCcuL2NvbnRyb2wnKTtcbmNvbnN0IFNwaW5uZXIgPSByZXF1aXJlKCcuL3NwaW5uZXInKTtcbmNvbnN0IFJlc291cmNlQWNjb3JkaW9uSXRlbSA9IHJlcXVpcmUoJy4vcmVzb3VyY2UtYWNjb3JkaW9uLWl0ZW0nKTtcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBSZXNvdXJjZUFjY29yZGlvbiBleHRlbmRzIENvbnRyb2wge1xuICAgIGNvbnN0cnVjdG9yKGlkRnVuY3Rpb24sIGl0ZW1DbGFzcz1SZXNvdXJjZUFjY29yZGlvbkl0ZW0sIG9wdGlvbnM9e30pIHtcbiAgICAgICAgc3VwZXIob3B0aW9ucyk7XG5cbiAgICAgICAgdGhpcy5pdGVtQ2xhc3MgPSBpdGVtQ2xhc3M7XG4gICAgICAgIHRoaXMuZGF0YSA9IG51bGw7XG4gICAgICAgIHRoaXMucmVzb3VyY2VEYXRhID0gbnVsbDtcbiAgICAgICAgdGhpcy5faXRlbURhdGEgPSB7fTtcbiAgICAgICAgdGhpcy5faXRlbUNoaWxkcmVuID0ge307XG5cbiAgICAgICAgdGhpcy5pZEZ1bmN0aW9uID0gaWRGdW5jdGlvbjtcbiAgICAgICAgLy90aGlzLmxhYmVsRnVuY3Rpb24gPSBsYWJlbEZ1bmN0aW9uO1xuXG4gICAgICAgIHRoaXMuc3Bpbm5lciA9IG5ldyBTcGlubmVyKCk7XG5cbiAgICAgICAgLypcbiAgICAgICAgdGhpcy5fb25JdGVtQ2xpY2tlZCA9IChldmVudCkgPT4ge1xuICAgICAgICAgICAgdmFyIHNlbGVjdGVkSWQgPSBldmVudC5jdXJyZW50VGFyZ2V0LmdldEF0dHJpYnV0ZSgnaXRlbS1pZCcpO1xuXG4gICAgICAgICAgICB2YXIgc2VsZWN0ZWRfaXRlbSA9IHRoaXMuX2l0ZW1EYXRhW3NlbGVjdGVkSWRdO1xuXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhzZWxlY3RlZF9pdGVtKTtcbiAgICAgICAgfVxuICAgICAgICAqL1xuXG4gICAgICAgIHRoaXMuX29uTmV4dEl0ZW1DbGlja2VkID0gKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICB0aGlzLl9sb2FkTmV4dCgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX3Nob3dTcGlubmVyKCkge1xuICAgICAgICB2YXIgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpJyk7XG4gICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0ID0gJ3Jvb3QtaXRlbSBzcGlubmVyLWl0ZW0nO1xuICAgICAgICB0aGlzLl9saXN0RWxlbWVudC5hcHBlbmRDaGlsZChlbGVtZW50KTtcblxuICAgICAgICBlbGVtZW50LmFwcGVuZENoaWxkKHRoaXMuc3Bpbm5lci5jcmVhdGVFbGVtZW50KCkpXG4gICAgfVxuXG4gICAgX2hpZGVTcGlubmVyKCkge1xuICAgICAgICB2YXIgZWxlbWVudCA9IHRoaXMuc3Bpbm5lci5lbGVtZW50LnBhcmVudEVsZW1lbnQ7XG4gICAgICAgIGVsZW1lbnQucmVtb3ZlQ2hpbGQodGhpcy5zcGlubmVyLmVsZW1lbnQpO1xuICAgICAgICBlbGVtZW50LnBhcmVudEVsZW1lbnQucmVtb3ZlQ2hpbGQoZWxlbWVudClcbiAgICB9XG5cbiAgICAvKlxuICAgIF9jcmVhdGVMaXN0SXRlbShpdGVtaWQsIGxhYmVsKSB7XG4gICAgICAgIHZhciBpdGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcbiAgICAgICAgaXRlbS5zZXRBdHRyaWJ1dGUoJ2l0ZW0taWQnLCBpdGVtaWQpO1xuICAgICAgICBpdGVtLmNsYXNzTmFtZSA9ICdyb290LWl0ZW0nO1xuICAgICAgICBpdGVtLmlubmVySFRNTCA9IGxhYmVsO1xuXG4gICAgICAgIC8vaXRlbS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMuX29uSXRlbUNsaWNrZWQpO1xuXG4gICAgICAgIHJldHVybiBpdGVtO1xuICAgIH1cbiAgICAqL1xuXG4gICAgX2NyZWF0ZU5leHRJdGVtKCkge1xuICAgICAgICB0aGlzLl9uZXh0RWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpJyk7XG4gICAgICAgIHRoaXMuX25leHRFbGVtZW50LmNsYXNzTGlzdCA9ICdyb290LWl0ZW0gbmV4dC1pdGVtJztcbiAgICAgICAgdGhpcy5fbmV4dEVsZW1lbnQuaW5uZXJIVE1MID0gJ0xvYWQgTW9yZS4uLidcblxuICAgICAgICB0aGlzLl9uZXh0RWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMuX29uTmV4dEl0ZW1DbGlja2VkKTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzLl9uZXh0RWxlbWVudDtcbiAgICB9XG5cbiAgICBfcmVtb3ZlTmV4dEl0ZW0oKSB7XG4gICAgICAgIHRoaXMuX25leHRFbGVtZW50LnBhcmVudEVsZW1lbnQucmVtb3ZlQ2hpbGQodGhpcy5fbmV4dEVsZW1lbnQpO1xuICAgIH1cblxuICAgIF9jbGVhcigpIHtcbiAgICAgICAgZm9yICh2YXIga2V5IGluIHRoaXMuX2l0ZW1DaGlsZHJlbikge1xuICAgICAgICAgICAgdGhpcy5fbGlzdEVsZW1lbnQucmVtb3ZlQ2hpbGQodGhpcy5faXRlbUNoaWxkcmVuW2tleV0uZWxlbWVudCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuX25leHRFbGVtZW50ICE9IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMuX2xpc3RFbGVtZW50LnJlbW92ZUNoaWxkKHRoaXMuX25leHRFbGVtZW50KTtcbiAgICAgICAgICAgIHRoaXMuX25leHRFbGVtZW50ID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9kYXRhID0gbnVsbDtcbiAgICAgICAgdGhpcy5faXRlbUNoaWxkcmVuID0ge307XG4gICAgfVxuICAgIFxuICAgIF9zZXREYXRhKGRhdGEpIHtcbiAgICAgICAgdGhpcy5fY2xlYXIoKTtcbiAgICAgICAgdGhpcy5fYXBwZW5kRGF0YShkYXRhKTtcbiAgICB9XG5cbiAgICBfYXBwZW5kRGF0YShkYXRhKSB7XG4gICAgICAgIGlmICh0aGlzLmRhdGEgPT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5kYXRhID0gZGF0YTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZGF0YSA9IHRoaXMuZGF0YS5jb25jYXQoZGF0YSk7XG4gICAgICAgIH1cblxuICAgICAgICBkYXRhLmZvckVhY2goKGl0ZW0pID0+IHtcbiAgICAgICAgICAgIHZhciBpdGVtX2lkID0gdGhpcy5pZEZ1bmN0aW9uKGl0ZW0pXG5cbiAgICAgICAgICAgIHRoaXMuX2l0ZW1DaGlsZHJlbltpdGVtX2lkXSA9IG5ldyB0aGlzLml0ZW1DbGFzcyhpdGVtKTtcbiAgICAgICAgICAgIHRoaXMuX2xpc3RFbGVtZW50LmFwcGVuZENoaWxkKHRoaXMuX2l0ZW1DaGlsZHJlbltpdGVtX2lkXS5jcmVhdGVFbGVtZW50KCkpO1xuICAgICAgICB9KVxuXG4gICAgICAgIGlmICh0aGlzLnJlc291cmNlRGF0YS5uZXh0ICE9IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMuX2xpc3RFbGVtZW50LmFwcGVuZENoaWxkKHRoaXMuX2NyZWF0ZU5leHRJdGVtKCkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fbmV4dEVsZW1lbnQgPSBudWxsO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX2xvYWROZXh0KCkge1xuICAgICAgICB0aGlzLl9yZW1vdmVOZXh0SXRlbSgpO1xuICAgICAgICB0aGlzLl9zaG93U3Bpbm5lcigpO1xuICAgICAgICBjb25uZWN0aW9uLmdldChcbiAgICAgICAgICAgIHRoaXMucmVzb3VyY2VEYXRhLm5leHQsXG4gICAgICAgICAgICAoZGF0YSkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMucmVzb3VyY2VEYXRhID0gZGF0YTtcbiAgICAgICAgICAgICAgICB0aGlzLl9hcHBlbmREYXRhKHRoaXMucmVzb3VyY2VEYXRhLml0ZW1zKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAoZXJyb3IpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhlcnJvcik7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuX2hpZGVTcGlubmVyKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIClcbiAgICB9XG5cbiAgICBzZXRSZXNvdXJjZVVybCh1cmwpIHtcbiAgICAgICAgLy90aGlzLl9saXN0RWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICB0aGlzLl9jbGVhcigpO1xuICAgICAgICB0aGlzLl9zaG93U3Bpbm5lcigpO1xuICAgICAgICBjb25uZWN0aW9uLmdldChcbiAgICAgICAgICAgIHVybCxcbiAgICAgICAgICAgIGRhdGEgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMucmVzb3VyY2VEYXRhID0gZGF0YTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB0aGlzLl9zZXREYXRhKHRoaXMucmVzb3VyY2VEYXRhLml0ZW1zKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAoZXJyb3IpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhlcnJvcik7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuX2hpZGVTcGlubmVyKCk7O1xuICAgICAgICAgICAgfVxuICAgICAgICApXG4gICAgfVxuXG4gICAgY3JlYXRlRWxlbWVudCgpIHtcbiAgICAgICAgc3VwZXIuY3JlYXRlRWxlbWVudCgpXG5cbiAgICAgICAgdGhpcy5lbGVtZW50LmNsYXNzTmFtZSA9ICdhY2NvcmRpb24nO1xuXG4gICAgICAgIHRoaXMuX2xpc3RFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndWwnKTtcbiAgICAgICAgdGhpcy5fbGlzdEVsZW1lbnQuc3R5bGUuZmxleERpcmVjdGlvbiA9ICdjb2x1bW4nO1xuICAgICAgICB0aGlzLl9saXN0RWxlbWVudC5jbGFzc05hbWUgPSAncm9vdC1saXN0JztcbiAgICAgICAgdGhpcy5lbGVtZW50LmFwcGVuZENoaWxkKHRoaXMuX2xpc3RFbGVtZW50KTtcblxuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50O1xuICAgIH1cbn0iLCJjb25zdCBMaXN0Qm94ID0gcmVxdWlyZShcIi4vbGlzdC1ib3hcIilcbmNvbnN0IFNwaW5uZXIgPSByZXF1aXJlKFwiLi9zcGlubmVyXCIpXG5jb25zdCBTcGlubmVyRm9yZWdyb3VuZCA9IHJlcXVpcmUoXCIuL3NwaW5uZXItZm9yZWdyb3VuZFwiKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFJlc291cmNlTGlzdCBleHRlbmRzIExpc3RCb3gge1xuICAgIGNvbnN0cnVjdG9yKGlkRnVuY3Rpb24sIGxhYmVsRnVuY3Rpb24sIG9uU2VsZWN0SXRlbSwgb3B0aW9ucykge1xuICAgICAgICAvKiBpZEZ1bmN0aW9uKHJlc3VsdCkgeyByZXR1cm4gcmVzdWx0LnVuaXF1ZV9pZCB9XG4gICAgICAgICAqIGxhYmVsRnVuY3Rpb24ocmVzdWx0KSB7IHJldHVybiByZXN1bHQubGFiZWwgfVxuICAgICAgICAgKiBvblJlc3VsdENsaWNrZWQocmVzdWx0KSB7IGRvIHNvbWV0aGluZyB1c2luZyByZXN1bHQgfVxuICAgICAgICAgKiBcbiAgICAgICAgICovXG4gICAgICAgIHN1cGVyKGlkRnVuY3Rpb24sIGxhYmVsRnVuY3Rpb24sIG9uU2VsZWN0SXRlbSwgb3B0aW9ucyk7XG5cbiAgICAgICAgdGhpcy5zcGlubmVyID0gbmV3IFNwaW5uZXIoKTtcblxuICAgICAgICB0aGlzLnJlc291cmNlX2RhdGEgPSB7fVxuICAgIH1cblxuICAgIHNldFJlc291cmNlVXJsKHVybCkge1xuICAgICAgICB0aGlzLnNwaW5uZXIuc2hvdygpO1xuICAgICAgICB0aGlzLl9saXN0RWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICBjb25uZWN0aW9uLmdldChcbiAgICAgICAgICAgIHVybCxcbiAgICAgICAgICAgIGRhdGEgPT4ge1xuICAgICAgICAgICAgICAgIC8vY29uc29sZS5sb2coZGF0YSk7XG4gICAgICAgICAgICAgICAgdGhpcy5yZXNvdXJjZV9kYXRhID0gZGF0YTtcbiAgICAgICAgICAgICAgICB0aGlzLnNldERhdGEoZGF0YS5pdGVtcylcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAoZXJyb3IpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhlcnJvcik7XG4gICAgICAgICAgICAgICAgaWYgKGVycm9yLnN0YXR1cyA9PSA0MDQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXNvdXJjZV9kYXRhID0ge307XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0RGF0YShbXSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZGlzcGxheU5vdEZvdW5kKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLnNwaW5uZXIuaGlkZSgpO1xuICAgICAgICAgICAgICAgIHRoaXMuX2xpc3RFbGVtZW50LnN0eWxlLmRpc3BsYXkgPSAnZmxleCc7XG4gICAgICAgICAgICB9XG4gICAgICAgIClcbiAgICB9XG5cbiAgICBfb25Mb2FkTmV4dENsaWNrZWQoZXZlbnQpIHtcbiAgICAgICAgZXZlbnQudGFyZ2V0LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgIHRoaXMuc3Bpbm5lci5zaG93KCk7XG4gICAgICAgIGNvbm5lY3Rpb24uZ2V0KFxuICAgICAgICAgICAgdGhpcy5yZXNvdXJjZV9kYXRhLm5leHQsXG4gICAgICAgICAgICBkYXRhID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLnJlc291cmNlX2RhdGEgPSBkYXRhO1xuICAgICAgICAgICAgICAgIHRoaXMuYXBwZW5kRGF0YShkYXRhLml0ZW1zKVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIChlcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycm9yKTtcbiAgICAgICAgICAgICAgICB0aGlzLmRpc3BsYXlEYXRhKHRydWUpXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuc3Bpbm5lci5oaWRlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIClcbiAgICB9XG5cbiAgICBkaXNwbGF5Tm90Rm91bmQoKSB7XG4gICAgICAgIHZhciBuZXh0X2VsZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xuICAgICAgICBuZXh0X2VsZW0uY2xhc3NOYW1lID0gJ2J1dHRvbidcbiAgICAgICAgbmV4dF9lbGVtLmlubmVySFRNTCA9ICdOb3QgRm91bmQuJztcbiAgICAgICAgdGhpcy5fbGlzdEVsZW1lbnQuYXBwZW5kQ2hpbGQobmV4dF9lbGVtKTtcbiAgICB9XG5cblxuICAgIGRpc3BsYXlEYXRhKG5vU2Nyb2xsKSB7XG4gICAgICAgIHN1cGVyLmRpc3BsYXlEYXRhKG5vU2Nyb2xsKTtcblxuICAgICAgICBpZiAodGhpcy5yZXNvdXJjZV9kYXRhLm5leHQpIHtcbiAgICAgICAgICAgIHZhciBuZXh0X2VsZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xuICAgICAgICAgICAgbmV4dF9lbGVtLnNldEF0dHJpYnV0ZSgnbmV4dC11cmwnLCB0aGlzLnJlc291cmNlX2RhdGEubmV4dCk7XG4gICAgICAgICAgICBuZXh0X2VsZW0uY2xhc3NOYW1lID0gJ2J1dHRvbidcbiAgICAgICAgICAgIG5leHRfZWxlbS5pbm5lckhUTUwgPSAnTG9hZCBNb3JlLi4uJztcbiAgICAgICAgICAgIG5leHRfZWxlbS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChldmVudCkgPT4geyBcbiAgICAgICAgICAgICAgICB0aGlzLl9vbkxvYWROZXh0Q2xpY2tlZChldmVudCkgXG4gICAgICAgICAgICB9IClcbiAgICAgICAgICAgIHRoaXMuX2xpc3RFbGVtZW50LmFwcGVuZENoaWxkKG5leHRfZWxlbSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjcmVhdGVFbGVtZW50KCkge1xuICAgICAgICBzdXBlci5jcmVhdGVFbGVtZW50KCk7XG5cbiAgICAgICAgdGhpcy5lbGVtZW50LnN0eWxlLmZsZXhEaXJlY3Rpb24gPSAnY29sdW1uJztcbiAgICAgICAgdGhpcy5fbGlzdEVsZW1lbnQuc3R5bGUuZmxleEdyb3cgPSAwO1xuXG4gICAgICAgIHRoaXMuZWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLnNwaW5uZXIuY3JlYXRlRWxlbWVudCgpKTtcbiAgICAgICAgdGhpcy5zcGlubmVyLmhpZGUoKTtcblxuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50O1xuICAgIH1cbn0iLCJjb25zdCBDb250cm9sID0gcmVxdWlyZShcIi4vY29udHJvbFwiKTtcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBTY3JvbGxlZCBleHRlbmRzIENvbnRyb2wge1xuICAgIGNvbnN0cnVjdG9yKG9wdGlvbnMpIHtcbiAgICAgICAgc3VwZXIob3B0aW9ucyk7XG4gICAgfVxuXG4gICAgc2Nyb2xsVG8ocG9zaXRpb24pIHtcbiAgICAgICAgdGhpcy5lbGVtZW50LnNjcm9sbFRvKHBvc2l0aW9uKTtcbiAgICB9XG5cbiAgICBjcmVhdGVFbGVtZW50KCkge1xuICAgICAgICBzdXBlci5jcmVhdGVFbGVtZW50KCk7XG5cbiAgICAgICAgdGhpcy5lbGVtZW50LnN0eWxlLm92ZXJmbG93WCA9ICdub25lJztcbiAgICAgICAgdGhpcy5lbGVtZW50LnN0eWxlLm92ZXJmbG93WSA9ICdhdXRvJztcbiAgICAgICAgdGhpcy5lbGVtZW50LnN0eWxlLmZsZXhHcm93ID0gMTtcbiAgICAgICAgdGhpcy5lbGVtZW50LmNsYXNzTGlzdC5hZGQoJ3Njcm9sbGVkJyk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudDtcbiAgICB9XG59XG4iLCJjb25zdCBDb250cm9sID0gcmVxdWlyZShcIi4vY29udHJvbFwiKTtcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBTcGlubmVyRm9yZ3JvdW5kIGV4dGVuZHMgQ29udHJvbCB7XG4gICAgY29uc3RydWN0b3Iob3B0aW9ucykge1xuICAgICAgICBzdXBlcihvcHRpb25zKTtcbiAgICB9XG5cbiAgICBjcmVhdGVFbGVtZW50KCkge1xuICAgICAgICB0aGlzLmVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgdGhpcy5lbGVtZW50LmNsYXNzTmFtZSA9ICdmb3JlZ3JvdW5kJztcblxuICAgICAgICB2YXIgc3Bpbm5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICBzcGlubmVyLmNsYXNzTmFtZSA9ICdzcGlubmVyJztcblxuICAgICAgICB0aGlzLmVsZW1lbnQuYXBwZW5kQ2hpbGQoc3Bpbm5lcik7XG5cbiAgICAgICAgcmV0dXJuKHRoaXMuZWxlbWVudCk7XG4gICAgfVxufVxuIiwiY29uc3QgQ29udHJvbCA9IHJlcXVpcmUoXCIuL2NvbnRyb2xcIik7XG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgU3Bpbm5lciBleHRlbmRzIENvbnRyb2wge1xuICAgIGNvbnN0cnVjdG9yKG9wdGlvbnMpIHtcbiAgICAgICAgc3VwZXIob3B0aW9ucyk7XG5cbiAgICAgICAgdGhpcy5fc3Bpbm5lckVsZW1lbnQgPSBudWxsO1xuICAgICAgICB0aGlzLl9sYWJlbEVsZW1lbnQgPSBudWxsO1xuICAgIH1cblxuICAgIHNldExhYmVsKGxhYmVsKSB7XG4gICAgICAgIHRoaXMuX2xhYmVsRWxlbWVudC5pbm5lckh0bWwgPSBsYWJlbDtcbiAgICB9XG5cbiAgICBcblxuICAgIHNob3coKSB7XG4gICAgICAgIHN1cGVyLnNob3coKTtcbiAgICB9XG5cbiAgICBjcmVhdGVFbGVtZW50KCkge1xuICAgICAgICBzdXBlci5jcmVhdGVFbGVtZW50KCk7XG5cbiAgICAgICAgdGhpcy5lbGVtZW50LmNsYXNzTmFtZSA9ICdzcGlubmVyLWNvbnRhaW5lcic7XG5cbiAgICAgICAgdGhpcy5fc3Bpbm5lckVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgdGhpcy5fc3Bpbm5lckVsZW1lbnQuY2xhc3NOYW1lID0gJ3NwaW5uZXInO1xuICAgICAgICB0aGlzLmVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5fc3Bpbm5lckVsZW1lbnQpO1xuXG4gICAgICAgIHRoaXMuX2xhYmVsRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICB0aGlzLl9sYWJlbEVsZW1lbnQuY2xhc3NOYW1lID0gJ3NwaW5uZXItbGFiZWwnO1xuICAgICAgICB0aGlzLmVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5fbGFiZWxFbGVtZW50KTtcblxuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50O1xuICAgIH1cbn0iLCJjb25zdCBDb250cm9sID0gcmVxdWlyZSgnLi9jb250cm9sJyk7XG5cblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBTcGl0dGVyIGV4dGVuZHMgQ29udHJvbCB7XG4gICAgY29uc3RydWN0b3IocGFuZTEsIHBhbmUyLCBvcHRpb25zID0ge30pIHtcbiAgICAgICAgLyogT3B0aW9uc1xuICAgICAgICAgKiAgZGlyZWN0aW9uID0gJ3Jvdyd8J2NvbHVtbicgKGRlZmF1bHQ9J3JvdycpXG4gICAgICAgICAqICBwYW5lMVNpemUgPSBjc3Mgc2l6ZSAoaWYgcGFuZTFTaXplIGlzIGdpdmVuLCBwYW5lMlNpemUgaXMgaWdub3JlZClcbiAgICAgICAgICogICgocGFuZTJTaXplID0gY3NzIHNpemUpKSAtPiBUaGlzIERvZXMgbm90IHdvcmtcbiAgICAgICAgICogIG1pblNpemUgPSBpbnRcbiAgICAgICAgICovXG4gICAgICAgIHN1cGVyKG9wdGlvbnMpO1xuXG4gICAgICAgIHRoaXMucGFuZTEgPSBwYW5lMTtcbiAgICAgICAgdGhpcy5wYW5lMiA9IHBhbmUyO1xuXG4gICAgICAgIHRoaXMucmVzaXplclNpemUgPSA1O1xuICAgICAgICB0aGlzLnJlc2l6ZXJFbGVtZW50ID0gbnVsbDtcblxuICAgICAgICB0aGlzLm1pblNpemUgPSB0aGlzLm9wdGlvbnMubWluU2l6ZSAhPSBudWxsID8gdGhpcy5vcHRpb25zLm1pblNpemUgOiA1MDtcblxuICAgICAgICB0aGlzLnBvczEgPSBudWxsO1xuICAgICAgICB0aGlzLnBvczIgPSBudWxsO1xuICAgICAgICB0aGlzLnBvczMgPSBudWxsO1xuICAgICAgICB0aGlzLnBvczQgPSBudWxsO1xuXG4gICAgICAgIHRoaXMuX3Jlc2l6ZU1vdXNlRG93biA9IChldikgPT4ge1xuICAgICAgICAgICAgZXYucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIHRoaXMucG9zMyA9IGV2LmNsaWVudFg7XG4gICAgICAgICAgICB0aGlzLnBvczQgPSBldi5jbGllbnRZO1xuICAgICAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgdGhpcy5fcmVzaXplTW91c2VNb3ZlKTtcbiAgICAgICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCB0aGlzLl9yZXNpemVNb3VzZVVwKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX3Jlc2l6ZU1vdXNlTW92ZSA9IChldikgPT4ge1xuICAgICAgICAgICAgZXYucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIHRoaXMucG9zMSA9IHRoaXMucG9zMyAtIGV2LmNsaWVudFg7XG4gICAgICAgICAgICB0aGlzLnBvczIgPSB0aGlzLnBvczQgLSBldi5jbGllbnRZO1xuICAgICAgICAgICAgdGhpcy5wb3MzID0gZXYuY2xpZW50WDtcbiAgICAgICAgICAgIHRoaXMucG9zNCA9IGV2LmNsaWVudFk7XG4gICAgICAgICAgICB0aGlzLl9yZXNpemUoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX3Jlc2l6ZU1vdXNlVXAgPSAoZXYpID0+IHtcbiAgICAgICAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIHRoaXMuX3Jlc2l6ZU1vdXNlTW92ZSk7XG4gICAgICAgICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgdGhpcy5fcmVzaXplTW91c2VVcCk7XG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIF9zZXRFbGVtZW50SGVpZ2h0KGVsZW1lbnQsIGhlaWdodCkge1xuICAgICAgICBlbGVtZW50LnN0eWxlLmhlaWdodCA9IGhlaWdodDtcbiAgICAgICAgZWxlbWVudC5zdHlsZS5taW5IZWlnaHQgPSBoZWlnaHQ7XG4gICAgICAgIGVsZW1lbnQuc3R5bGUubWF4SGVpZ2h0ID0gaGVpZ2h0O1xuICAgIH1cblxuXG4gICAgX3NldEVsZW1lbnRXaWR0aChlbGVtZW50LCB3aWR0aCkge1xuICAgICAgICBlbGVtZW50LnN0eWxlLndpZHRoID0gd2lkdGg7XG4gICAgICAgIGVsZW1lbnQuc3R5bGUubWluV2lkdGggPSB3aWR0aDtcbiAgICAgICAgZWxlbWVudC5zdHlsZS5tYXhXaWR0aCA9IHdpZHRoO1xuICAgIH1cblxuXG4gICAgX3Jlc2l6ZSgpIHtcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5kaXJlY3Rpb24gPT0gJ2NvbHVtbicpIHtcbiAgICAgICAgICAgIHZhciBtYXhTaXplID0gdGhpcy5lbGVtZW50Lm9mZnNldEhlaWdodCAtIHRoaXMubWluU2l6ZTtcbiAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMucGFuZTFTaXplICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICB2YXIgc2l6ZSA9ICh0aGlzLnBhbmUxLmVsZW1lbnQub2Zmc2V0SGVpZ2h0IC0gdGhpcy5wb3MyKTtcbiAgICAgICAgICAgICAgICBpZiAoc2l6ZSA+IG1heFNpemUpIHsgcmV0dXJuIH1cbiAgICAgICAgICAgICAgICBpZiAoc2l6ZSA8IHRoaXMubWluU2l6ZSkgeyByZXR1cm4gfVxuICAgICAgICAgICAgICAgIHRoaXMuX3NldEVsZW1lbnRIZWlnaHQodGhpcy5wYW5lMS5lbGVtZW50LCBzaXplICsgJ3B4Jyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHZhciBzaXplID0gKHRoaXMucGFuZTIuZWxlbWVudC5vZmZzZXRIZWlnaHQgKyB0aGlzLnBvczIpO1xuICAgICAgICAgICAgICAgIGlmIChzaXplID4gbWF4U2l6ZSkgeyByZXR1cm4gfVxuICAgICAgICAgICAgICAgIGlmIChzaXplIDwgdGhpcy5taW5TaXplKSB7IHJldHVybiB9XG4gICAgICAgICAgICAgICAgdGhpcy5fc2V0RWxlbWVudEhlaWdodCh0aGlzLnBhbmUyLmVsZW1lbnQsIHNpemUgKyAncHgnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhciBtYXhTaXplID0gdGhpcy5lbGVtZW50Lm9mZnNldFdpZHRoIC0gdGhpcy5taW5TaXplO1xuICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5wYW5lMVNpemUgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHZhciBzaXplID0gKHRoaXMucGFuZTEuZWxlbWVudC5vZmZzZXRXaWR0aCAtIHRoaXMucG9zMSk7XG4gICAgICAgICAgICAgICAgaWYgKHNpemUgPj0gbWF4U2l6ZSkgeyByZXR1cm4gfVxuICAgICAgICAgICAgICAgIGlmIChzaXplIDwgdGhpcy5taW5TaXplKSB7IHJldHVybiB9XG4gICAgICAgICAgICAgICAgdGhpcy5fc2V0RWxlbWVudFdpZHRoKHRoaXMucGFuZTEuZWxlbWVudCwgc2l6ZSArJ3B4Jyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHZhciBzaXplID0gKHRoaXMucGFuZTIuZWxlbWVudC5vZmZzZXRXaWR0aCArIHRoaXMucG9zMSk7XG4gICAgICAgICAgICAgICAgaWYgKHNpemUgPiBtYXhTaXplKSB7IHJldHVybiB9XG4gICAgICAgICAgICAgICAgaWYgKHNpemUgPCB0aGlzLm1pblNpemUpIHsgcmV0dXJuIH1cbiAgICAgICAgICAgICAgICB0aGlzLl9zZXRFbGVtZW50V2lkdGgodGhpcy5wYW5lMi5lbGVtZW50LCBzaXplICsncHgnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgX2NyZWF0ZVJlc2l6ZXJFbGVtZW50KCkge1xuICAgICAgICB0aGlzLnJlc2l6ZXJFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIHRoaXMucmVzaXplckVsZW1lbnQuc3R5bGUuekluZGV4ID0gJzEwMCc7XG4gICAgICAgIHRoaXMucmVzaXplckVsZW1lbnQuY2xhc3NOYW1lID0gJ3Jlc2l6ZXInO1xuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmRpcmVjdGlvbiA9PSAnY29sdW1uJykge1xuICAgICAgICAgICAgdGhpcy5yZXNpemVyRWxlbWVudC5zdHlsZS5oZWlnaHQgPSAodGhpcy5yZXNpemVyU2l6ZSkgKyAncHgnO1xuICAgICAgICAgICAgdGhpcy5yZXNpemVyRWxlbWVudC5zdHlsZS5tYXJnaW5Ub3AgPSAnLScgKyAodGhpcy5yZXNpemVyU2l6ZSAvIDIpICsgJ3B4JztcbiAgICAgICAgICAgIHRoaXMucmVzaXplckVsZW1lbnQuc3R5bGUubWFyZ2luQm90dG9tID0gJy0nICsgKHRoaXMucmVzaXplclNpemUgLyAyKSArICdweCc7XG4gICAgICAgICAgICB0aGlzLnJlc2l6ZXJFbGVtZW50LnN0eWxlLndpZHRoID0gJzEwMCUnO1xuICAgICAgICAgICAgdGhpcy5yZXNpemVyRWxlbWVudC5zdHlsZS5jdXJzb3IgPSAnbnMtcmVzaXplJ1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5yZXNpemVyRWxlbWVudC5zdHlsZS53aWR0aCA9ICh0aGlzLnJlc2l6ZXJTaXplKSArJ3B4JztcbiAgICAgICAgICAgIHRoaXMucmVzaXplckVsZW1lbnQuc3R5bGUubWFyZ2luTGVmdCA9ICctJyArICh0aGlzLnJlc2l6ZXJTaXplIC8gMikgKydweCc7XG4gICAgICAgICAgICB0aGlzLnJlc2l6ZXJFbGVtZW50LnN0eWxlLm1hcmdpblJpZ2h0ID0gJy0nICsgKHRoaXMucmVzaXplclNpemUgLyAyKSArJ3B4JztcbiAgICAgICAgICAgIHRoaXMucmVzaXplckVsZW1lbnQuc3R5bGUuaGVpZ2h0ID0gJzEwMCUnO1xuICAgICAgICAgICAgdGhpcy5yZXNpemVyRWxlbWVudC5zdHlsZS5jdXJzb3IgPSAnZXctcmVzaXplJ1xuICAgICAgICB9XG4gICAgICAgIC8vdGhpcy5yZXNpemVyRWxlbWVudC5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSAncmVkJztcbiAgICAgICAgdGhpcy5yZXNpemVyRWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLl9yZXNpemVNb3VzZURvd24pO1xuXG4gICAgICAgIHJldHVybiB0aGlzLnJlc2l6ZXJFbGVtZW50O1xuICAgIH1cblxuXG4gICAgY3JlYXRlRWxlbWVudCgpIHtcbiAgICAgICAgc3VwZXIuY3JlYXRlRWxlbWVudCgpO1xuXG4gICAgICAgIHRoaXMuZWxlbWVudC5zdHlsZS5mbGV4R3JvdyA9ICcxJztcblxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmRpcmVjdGlvbiA9PSAnY29sdW1uJykge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LnN0eWxlLmZsZXhEaXJlY3Rpb24gPSAnY29sdW1uJztcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuZWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLnBhbmUxLmNyZWF0ZUVsZW1lbnQoKSk7XG5cbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5wYW5lMVNpemUgIT0gbnVsbCB8fCB0aGlzLm9wdGlvbnMucGFuZTJTaXplICE9IG51bGwpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMucmVzaXphYmxlID09IHRydWUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5fY3JlYXRlUmVzaXplckVsZW1lbnQoKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMuZWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLnBhbmUyLmNyZWF0ZUVsZW1lbnQoKSk7XG5cbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5wYW5lMVNpemUgIT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5wYW5lMi5lbGVtZW50LnN0eWxlLmZsZXhHcm93ID0gMTtcblxuICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5kaXJlY3Rpb24gPT0gJ2NvbHVtbicpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9zZXRFbGVtZW50SGVpZ2h0KHRoaXMucGFuZTEuZWxlbWVudCwgdGhpcy5vcHRpb25zLnBhbmUxU2l6ZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuX3NldEVsZW1lbnRXaWR0aCh0aGlzLnBhbmUxLmVsZW1lbnQsIHRoaXMub3B0aW9ucy5wYW5lMVNpemUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5wYW5lMlNpemUgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHRoaXMucGFuZTEuZWxlbWVudC5zdHlsZS5mbGV4R3JvdyA9IDE7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5kaXJlY3Rpb24gPT0gJ2NvbHVtbicpIHtcbiAgICAgICAgICAgICAgICAgICAgLy9UaGlzIHdvcmtzIG5vd1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9zZXRFbGVtZW50SGVpZ2h0KHRoaXMucGFuZTIuZWxlbWVudCwgdGhpcy5vcHRpb25zLnBhbmUyU2l6ZSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fc2V0RWxlbWVudFdpZHRoKHRoaXMucGFuZTIuZWxlbWVudCwgdGhpcy5vcHRpb25zLnBhbmUyU2l6ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLnBhbmUxLmVsZW1lbnQuc3R5bGUuZmxleEdyb3cgPSAxO1xuICAgICAgICAgICAgICAgIHRoaXMucGFuZTIuZWxlbWVudC5zdHlsZS5mbGV4R3JvdyA9IDE7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnBhbmUxLmVsZW1lbnQuc3R5bGUuZmxleERpcmVjdGlvbiA9ICdjb2x1bW4nXG4gICAgICAgIHRoaXMucGFuZTIuZWxlbWVudC5zdHlsZS5mbGV4RGlyZWN0aW9uID0gJ2NvbHVtbidcblxuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50O1xuICAgIH1cbn0iLCJjb25zdCBDb250cm9sID0gcmVxdWlyZShcIi4vY29udHJvbFwiKTtcblxuY29uc3QgVkFMSURfVFlQRVMgPSBbJ3RleHQnLCAnZGF0ZScsICdkYXRldGltZS1sb2NhbCcsICdwYXNzd29yZCcsICdlbWFpbCcsICd0ZWwnLCAnbnVtYmVyJywgJ3RpbWUnLCAndXJsJ11cblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBUZXh0Qm94IGV4dGVuZHMgQ29udHJvbCB7XG4gICAgY29uc3RydWN0b3Iob3B0aW9ucykge1xuICAgICAgICAvKiBPcHRpb25zXG4gICAgICAgICAqICBwbGFjZWhvbGRlcj1cIlwiXG4gICAgICAgICAqICB0eXBlPVZBTElEX1RZUEUgb3IgdGV4dGFyZWFcbiAgICAgICAgICogIHJvd3M9MlxuICAgICAgICAgKi9cbiAgICAgICAgc3VwZXIob3B0aW9ucyk7XG4gICAgfVxuXG4gICAgdmFsdWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnQudmFsdWU7XG4gICAgfVxuXG4gICAgc2V0VmFsdWUodmFsdWUpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50LnZhbHVlID0gdmFsdWU7XG4gICAgfVxuXG4gICAgaXNCbGFuaygpIHtcbiAgICAgICAgaWYgKHRoaXMuZWxlbWVudC52YWx1ZSA9PSAnJykge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGxvY2soKSB7XG4gICAgICAgIHRoaXMuZWxlbWVudC5zZXRBdHRyaWJ1dGUoJ3JlYWRvbmx5JywgJycpO1xuICAgIH1cblxuICAgIHVubG9jaygpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50LnJlbW92ZUF0dHJpYnV0ZSgncmVhZG9ubHknKTtcbiAgICB9XG5cbiAgICBjcmVhdGVFbGVtZW50KCkge1xuICAgICAgICBpZiAodGhpcy5vcHRpb25zLnR5cGUgPT0gJ3RleHRhcmVhJykge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGV4dGFyZWEnKTtcbiAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMucm93cyAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5lbGVtZW50LnNldEF0dHJpYnV0ZSgncm93cycsIHRoaXMub3B0aW9ucy5yb3dzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMucmVzaXplICE9IHRydWUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmVsZW1lbnQuc3R5bGUucmVzaXplID0gJ25vbmUnXG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpO1xuICAgICAgICAgICAgaWYgKFZBTElEX1RZUEVTLmluY2x1ZGVzKHRoaXMub3B0aW9ucy50eXBlKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuZWxlbWVudC5zZXRBdHRyaWJ1dGUoJ3R5cGUnLCB0aGlzLm9wdGlvbnMudHlwZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmVsZW1lbnQuc2V0QXR0cmlidXRlKCdzaXplJywgMSk7XG5cbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5vbktleVVwKSB7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLCAoZXYpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMub25LZXlVcChldik7XG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5wbGFjZWhvbGRlciAhPSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQuc2V0QXR0cmlidXRlKCdwbGFjZWhvbGRlcicsIHRoaXMub3B0aW9ucy5wbGFjZWhvbGRlcik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50XG4gICAgfVxuXG59XG4iLCJjb25zdCBDb250cm9sID0gcmVxdWlyZShcIi4vY29udHJvbFwiKTtcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBUaWxlIGV4dGVuZHMgQ29udHJvbCB7XG4gICAgY29uc3RydWN0b3IodGl0bGUsIG9wdGlvbnMpIHtcbiAgICAgICAgc3VwZXIob3B0aW9ucylcblxuICAgICAgICB0aGlzLnRpdGxlID0gdGl0bGVcbiAgICB9XG5cbiAgICBjcmVhdGVFbGVtZW50KCkge1xuICAgICAgICBzdXBlci5jcmVhdGVFbGVtZW50KCk7XG5cbiAgICAgICAgdGhpcy5lbGVtZW50LmNsYXNzTmFtZSA9ICd0aWxlJztcbiAgICAgICAgdGhpcy5lbGVtZW50LnN0eWxlLmRpc3BsYXkgPSAnZmxleCc7XG4gICAgICAgIHRoaXMuZWxlbWVudC5zdHlsZS5mbGV4RGlyZWN0aW9uID0gJ2NvbHVtbic7XG4gICAgICAgIFxuICAgICAgICB0aGlzLl90aXRsZUVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdoMScpO1xuICAgICAgICB0aGlzLl90aXRsZUVsZW1lbnQuY2xhc3NOYW1lID0gJ3RpbGUtdGl0bGUnO1xuICAgICAgICB0aGlzLl90aXRsZUVsZW1lbnQuaW5uZXJIVE1MID0gdGhpcy50aXRsZTtcbiAgICAgICAgdGhpcy5lbGVtZW50LmFwcGVuZENoaWxkKHRoaXMuX3RpdGxlRWxlbWVudCk7XG5cbiAgICAgICAgdGhpcy5fdGlsZUJvZHlFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIHRoaXMuX3RpbGVCb2R5RWxlbWVudC5jbGFzc05hbWUgPSAndGlsZS1ib2R5JztcbiAgICAgICAgdGhpcy5lbGVtZW50LmFwcGVuZENoaWxkKHRoaXMuX3RpbGVCb2R5RWxlbWVudCk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudDtcbiAgICB9XG59IiwiY29uc3QgTG9nZ2VyID0gcmVxdWlyZShcIi4vYXBwL2xvZ2dlclwiKTtcbmNvbnN0IENvbm5lY3Rpb24gPSByZXF1aXJlKFwiLi9hcHAvY29ubmVjdGlvblwiKTtcbmNvbnN0IExvZ2luRGlhbG9nID0gcmVxdWlyZShcIi4vYXBwL2RpYWxvZy9sb2dpbi1kaWFsb2dcIik7XG5jb25zdCBQYXRpZW50QnJvd3NlciA9IHJlcXVpcmUoJy4vYXBwL3BhbmVsL3BhdGllbnQtYnJvd3NlcicpO1xuXG5sb2dnZXIgPSBuZXcgTG9nZ2VyKCk7XG5jb25uZWN0aW9uID0gbmV3IENvbm5lY3Rpb24obG9nZ2VyKTtcblxuZGxnTG9naW4gPSBuZXcgTG9naW5EaWFsb2coKTtcbnBubFBhdGllbnRCcm93c2VyID0gbmV3IFBhdGllbnRCcm93c2VyKClcblxuZGlzcGxheVBhdGllbnRzID0gKGRhdGEpID0+IHtcbiAgICB2YXIgcmVzdWx0ID0gXCJcIjtcbiAgICBcbiAgICBkYXRhWydwYXRpZW50cyddLmZvckVhY2goZWxlbWVudCA9PiB7XG4gICAgICAgIHJlc3VsdCArPSBgPHRyPjx0ZD4ke2VsZW1lbnRbJ2lkJ119PC90ZD48dGQ+JHtlbGVtZW50WyduYW1lJ119PC90ZD48dGQ+JHtlbGVtZW50Wyd1cmwnXX08L3RkPjwvdHI+YFxuICAgIH0pO1xuXG4gICAgZG9jdW1lbnQuYm9keS5pbm5lckhUTUwgPSAoXG4gICAgICAgIGA8dGFibGUgY2xhc3M9XCJ0YWJsZSB0YWJsZS1zdHJpcGVkIHRhYmxlLXNtXCI+XG4gICAgICAgICAgICA8dGhlYWQ+XG4gICAgICAgICAgICAgICAgPHRyPjx0ZD5JZDwvdGQ+PHRkPk5hbWU8L3RkPjx0ZD5VUkw8L3RkPjwvdHI+XG4gICAgICAgICAgICA8L2hlYWQ+XG4gICAgICAgICAgICA8dGJvZHk+XG4gICAgICAgICAgICAgICAgJHtyZXN1bHR9XG4gICAgICAgICAgICA8L3Rib2R5PlxuICAgICAgICA8L3RhYmxlPmBcbiAgICApO1xufVxuXG5zaG93TWFpbldpbmRvdyA9ICgpID0+IHtcbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHBubFBhdGllbnRCcm93c2VyLmNyZWF0ZUVsZW1lbnQoKSk7XG59XG5cblxuZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChkbGdMb2dpbi5jcmVhdGVFbGVtZW50KCkpO1xuXG5kbGdMb2dpbi5mb3JtLnNldFZhbHVlKHtcbiAgICBpbmRleF91cmw6ICdodHRwOi8vMTI3LjAuMC4xOjUwMDAvYXBpLycsXG4gICAgdXNlcm5hbWU6ICdhZG1pbicsXG4gICAgcGFzc3dvcmQ6ICdhJ1xufSlcblxuZGxnTG9naW4udHJ5TG9naW4oXG4gICAgKCkgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhcIkxvZ2luIFN1Y2Vzc2Z1bC5cIik7XG4gICAgICAgIHNob3dNYWluV2luZG93KCk7XG4gICAgfSxcbiAgICAoKSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiQ2FuY2VsbGVkLlwiKVxuICAgIH1cbik7XG5cblxuLypcbmNvbnN0IEljZDEwQ29kZXJEaWFsb2cgPSByZXF1aXJlKCcuL2FwcC9kaWFsb2cvaWNkMTBjb2Rlci1kaWFsb2cnKTtcblxuaWNkMTAgPSBuZXcgSWNkMTBDb2RlckRpYWxvZygpO1xuXG5kb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGljZDEwLmNyZWF0ZUVsZW1lbnQoKSk7XG5cbmljZDEwLnNob3coXG4gICAgKHZhbHVlKSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKHZhbHVlKTtcbiAgICB9LFxuICAgICgpID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coXCJDYW5jZWxsZWRcIik7XG4gICAgfVxuKTsqL1xuXG5cbi8qXG5jb25zdCBMaXN0Qm94ID0gIHJlcXVpcmUoJy4vY29udHJvbHMvbGlzdC1ib3gnKTtcbmNvbnN0IFRleHRCb3ggPSByZXF1aXJlKCcuL2NvbnRyb2xzL3RleHQtYm94Jyk7XG5cbnZhciBsc3QgPSBuZXcgTGlzdEJveChcbiAgICAoaXRlbSkgPT4ge1xuICAgICAgICByZXR1cm4gaXRlbS5pZDtcbiAgICB9LFxuICAgIChpdGVtKSA9PiB7XG4gICAgICAgIHJldHVybiBpdGVtLmxhYmVsO1xuICAgIH0sXG4gICAgKGl0ZW0pID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coaXRlbSk7XG4gICAgfSxcbiAgICB7XG4gICAgICAgIGhlaWdodDogJzEwMHB4J1xuICAgIH1cbik7XG5cbmRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQobHN0LmNyZWF0ZUVsZW1lbnQoKSk7XG52YXIgZGF0YSA9IFtdXG5mb3IgKHZhciBpID0gMDsgaSA8IDEwMDsgaSsrKSB7XG4gICAgZGF0YS5wdXNoKHtcbiAgICAgICAgaWQ6IGksXG4gICAgICAgIGxhYmVsOiBpXG4gICAgfSlcbn1cbmxzdC5zZXREYXRhKGRhdGEpO1xuXG50eHQgPSBuZXcgVGV4dEJveCgpO1xuZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0eHQuY3JlYXRlRWxlbWVudCgpKTtcbnR4dC5lbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJywgKGV2dCkgPT4ge1xuICAgIGxzdC5zZXRTZWxlY3Rpb24odHh0LnZhbHVlKCkpO1xuICAgIGNvbnNvbGUubG9nKHR4dC52YWx1ZSgpKTtcbn0pXG5cblxuY29uc3QgUmFkaW9MaXN0Qm94ID0gcmVxdWlyZSgnLi9jb250cm9scy9yYWRpby1saXN0LWJveCcpO1xuXG52YXIgcmFkbHN0ID0gbmV3IFJhZGlvTGlzdEJveChcbiAgICAoaXRlbSkgPT4ge1xuICAgICAgICByZXR1cm4gaXRlbS5pZDtcbiAgICB9LFxuICAgIChpdGVtKSA9PiB7XG4gICAgICAgIHJldHVybiBpdGVtLmxhYmVsO1xuICAgIH0sXG4gICAgKGl0ZW0pID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coaXRlbSk7XG4gICAgfSxcbiAgICB7XG4gICAgICAgIGhlaWdodDogJzEwMHB4J1xuICAgIH1cbik7XG5cbmRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQocmFkbHN0LmNyZWF0ZUVsZW1lbnQoKSk7XG52YXIgZGF0YSA9IFtdXG5mb3IgKHZhciBpID0gMDsgaSA8IDEwMDsgaSsrKSB7XG4gICAgZGF0YS5wdXNoKHtcbiAgICAgICAgaWQ6IGksXG4gICAgICAgIGxhYmVsOiAnTEJMJyArIGlcbiAgICB9KVxufVxucmFkbHN0LnNldERhdGEoZGF0YSk7XG5cbnJhZHR4dCA9IG5ldyBUZXh0Qm94KCk7XG5kb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHJhZHR4dC5jcmVhdGVFbGVtZW50KCkpO1xucmFkdHh0LmVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLCAoZXZ0KSA9PiB7XG4gICAgcmFkbHN0LnNldFNlbGVjdGlvbihyYWR0eHQudmFsdWUoKSk7XG4gICAgY29uc29sZS5sb2codHh0LnZhbHVlKCkpO1xufSlcblxuXG4vL1NlbGVjdCAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbmNvbnN0IFNlbGVjdCA9IHJlcXVpcmUoJy4vY29udHJvbHMvc2VsZWN0Jyk7XG5cbnNlbCA9IG5ldyBTZWxlY3QoXG4gICAgKGl0ZW0pID0+IHtcbiAgICAgICAgcmV0dXJuIGl0ZW0uaWQ7XG4gICAgfSxcbiAgICAoaXRlbSkgPT4ge1xuICAgICAgICByZXR1cm4gaXRlbS5sYWJlbDtcbiAgICB9LFxuICAgIHtcbiAgICAgICAgcGxhY2Vob2xkZXI6ICdNb2RpZmllcidcbiAgICB9XG4pO1xuXG5kb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHNlbC5jcmVhdGVFbGVtZW50KCkpO1xuXG5zZWwuc2V0RGF0YShkYXRhKTtcblxuXG5jb25zdCBCdXR0b24gPSByZXF1aXJlKCcuL2NvbnRyb2xzL2J1dHRvbicpO1xuXG5idG4gPSBuZXcgQnV0dG9uKFxuICAgICdTZWxlY3QgVmFsdWUnLFxuICAgIChldikgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhzZWwudmFsdWUoKSk7XG4gICAgfVxuKVxuXG5kb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGJ0bi5jcmVhdGVFbGVtZW50KCkpO1xuXG5cbmJ0biA9IG5ldyBCdXR0b24oXG4gICAgJ1NldCcsXG4gICAgKGV2KSA9PiB7XG4gICAgICAgIHNlbC5zZXRTZWxlY3Rpb24oMjApO1xuICAgIH1cbilcbmRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoYnRuLmNyZWF0ZUVsZW1lbnQoKSk7XG5cblxuLy9TZWxlY3QgRmllbGQgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG5cbmNvbnN0IFNlbGVjdEZpZWxkID0gcmVxdWlyZSgnLi9jb250cm9scy9mb3JtL3NlbGVjdC1maWVsZCcpO1xuXG5zZWxGID0gbmV3IFNlbGVjdEZpZWxkKFxuICAgICdudW1iZXInLFxuICAgIChpdGVtKSA9PiB7XG4gICAgICAgIHJldHVybiBpdGVtLmlkO1xuICAgIH0sXG4gICAgKGl0ZW0pID0+IHtcbiAgICAgICAgcmV0dXJuIGl0ZW0ubGFiZWw7XG4gICAgfSxcbiAgICB7XG4gICAgICAgIHBsYWNlaG9sZGVyOiAnTW9kaWZpZXInLFxuICAgICAgICBsYWJlbDogJ01vZGlmaWVyJ1xuICAgIH1cbilcblxuZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChzZWxGLmNyZWF0ZUVsZW1lbnQoKSk7XG5cbnNlbEYuc2V0RGF0YShkYXRhKTtcblxuYnRuID0gbmV3IEJ1dHRvbihcbiAgICAnTG9jaycsXG4gICAgKGV2KSA9PiB7XG4gICAgICAgIHNlbEYubG9jaygpO1xuICAgIH1cbilcbmRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoYnRuLmNyZWF0ZUVsZW1lbnQoKSk7XG5cbmJ0biA9IG5ldyBCdXR0b24oXG4gICAgJ3VubG9jaycsXG4gICAgKGV2KSA9PiB7XG4gICAgICAgIHNlbEYudW5sb2NrKCk7XG4gICAgfVxuKVxuZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChidG4uY3JlYXRlRWxlbWVudCgpKTtcblxuYnRuID0gbmV3IEJ1dHRvbihcbiAgICAnU2V0JyxcbiAgICAoZXYpID0+IHtcbiAgICAgICAgc2VsRi5zZXRWYWx1ZShkYXRhWzEwXSk7XG4gICAgfVxuKVxuZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChidG4uY3JlYXRlRWxlbWVudCgpKTtcblxuYnRuID0gbmV3IEJ1dHRvbihcbiAgICAnR2V0JyxcbiAgICAoZXYpID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coc2VsRi52YWx1ZSgpKTtcbiAgICB9XG4pXG5kb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGJ0bi5jcmVhdGVFbGVtZW50KCkpO1xuKi9cblxuXG4vL1NwbGl0dGVyIFdpbmRvXG4vKlxuY29uc3QgQ29udHJvbCA9IHJlcXVpcmUoJy4vY29udHJvbHMvY29udHJvbCcpO1xuY29uc3QgU3BsaXR0ZXIgPSByZXF1aXJlKCcuL2NvbnRyb2xzL3NwbGl0dGVyJyk7XG5jb25zdCBMaXN0Qm94ID0gcmVxdWlyZSgnLi9jb250cm9scy9saXN0LWJveCcpO1xuXG5wMDEgPSBuZXcgTGlzdEJveCgpO1xucDAyID0gbmV3IExpc3RCb3goKTtcblxucDEgPSBuZXcgTGlzdEJveChcbiAgICAoaXRlbSkgPT4ge1xuICAgICAgICByZXR1cm4gaXRlbS5pZDtcbiAgICB9LFxuICAgIChpdGVtKSA9PiB7XG4gICAgICAgIHJldHVybiBpdGVtLmxhYmVsO1xuICAgIH0sXG4gICAgKGl0ZW0pID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coaXRlbSk7XG4gICAgfSxcbik7XG5wMiA9IG5ldyBTcGxpdHRlcihwMDEsIHAwMiwge1xuICAgIHBhbmUyU2l6ZTogJzIwMHB4JyxcbiAgICBkaXJlY3Rpb246ICdjb2x1bW4nLFxuICAgIHJlc2l6YWJsZTogdHJ1ZVxufSlcblxuLy9wMiA9IG5ldyBDb250cm9sKCk7XG5cbnNwbCA9IG5ldyBTcGxpdHRlcihwMSwgcDIsIHtcbiAgICBwYW5lMlNpemU6ICcyNTBweCcsXG4gICAgLy9kaXJlY3Rpb246ICdjb2x1bW4nXG4gICAgcmVzaXphYmxlOiB0cnVlXG59KTtcblxuZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChzcGwuY3JlYXRlRWxlbWVudCgpKTtcblxuXG52YXIgZGF0YSA9IFtdXG5mb3IgKHZhciBpID0gMDsgaSA8IDEwMDsgaSsrKSB7XG4gICAgZGF0YS5wdXNoKHtcbiAgICAgICAgaWQ6IGksXG4gICAgICAgIGxhYmVsOiAnTEJMJyArIGlcbiAgICB9KVxufVxucDEuc2V0RGF0YShkYXRhKTtcbnAxLmVsZW1lbnQuc3R5bGUuYm9yZGVyID0gJ25vbmUnO1xucDEuZWxlbWVudC5zdHlsZS5ib3JkZXJSYWRpdXMgPSAnMCc7XG5cbi8vcDIuZWxlbWVudC5pbm5lckhUTUwgPSBcIkxvTFwiO1xuKi9cblxuXG4vKlxuY29uc3QgUGF0aWVudEJyb3dzZXIgPSByZXF1aXJlKCcuL2FwcC9wYW5lbC9wYXRpZW50LWJyb3dzZXInKTtcblxuYiA9IG5ldyBQYXRpZW50QnJvd3NlcigpO1xuXG5kb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGIuY3JlYXRlRWxlbWVudCgpKTtcbiovIl19
