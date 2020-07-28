const querystring = require('querystring');

const SanitizeHTML =  require('../../controls/sanitize-html');
const Dialog = require('../../controls/dialog/dialog');
const ResourceSearchBox = require('../../controls/resource-search-box');
const Button = require('../../controls/button');
const ResourceRadioList = require('../../controls/resource-radio-list');
const Form = require('../../controls/form/form');
const TextField = require('../../controls/form/text-field');
const SelectField = require('../../controls/form/select-field');
const sanitizeHtml = require('../../controls/sanitize-html');


module.exports = class Icd10CoderDialog extends Dialog {
    constructor(options = {}) {
        super(
            {
                title: 'ICD-10 Code'
            }
        );

        this.onOk = null
        this.onCancel = null

        this.selectedCategory = null;
        this.selectedBlockCode = null;

        this.selectedModifier = null;
        this.selectedModifierExtra = null;

        this.searchBox = new ResourceSearchBox(
            (item) => {
                return item.code;
            },
            (item) => {
                return document.createTextNode(`${item.code} ${item.preferred_plain}`);
            },
            (item) => {
                this._onSelectSearchResult(item);
            },
            {
                placeholder: 'Search ICD-10 Code',
                popupHeight: '40%',
                cache: true
            }
        )

        this.btnOk = new Button(
            options.okLabel != null ? options.okLabel : 'Add',
            (ev) => {
                this.onOk(this.value())
                this.hide()
            },
            {
                width: '80px',
                style: 'clear',
                icon: 'plus',
                className: 'hide-icon'
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
                cache: true,
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
                grow: true,
                maxGrow: 100
            }
        ));
    }

    show(onOk, onCancel) {
        this.onOk = onOk
        this.onCancel = onCancel

        this.searchBox.setResourceUrl(connection.resource_index.icd10.categories)
        
        this.selectedCategory = null;
        this.selectedBlockCode = null;

        this.selectedModifier = null;
        this.selectedModifierExtra = null;

        super.show(onCancel);
    }

    hide() {
        super.hide();
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
                this.selectedCategory = this.categoryList.value()
                onDone();
                return
            }
        }

        this.selectedBlockCode = this.selectedCategory.parent_block_code;

        this.loadSelectedBlock(() => {
            requestAnimationFrame(() => {
                //Extra time needed to allow the DOM to update before we can scroll to it
                this.categoryList.setSelection(this.selectedCategory.code);
                this.selectedCategory = this.categoryList.value()
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
        let label = document.createElement('div');
        label.className = "category-label"

        let code = document.createElement('div')
        code.className = "code"
        code.setAttribute("code", category.code)
        code.innerText = category.code
        label.appendChild(code)

        let text = document.createElement('div')
        text.className = "text"
        label.appendChild(text)

        let pref = sanitizeHtml(category.preferred, ['A'], ['href']);
        pref.className = "preferred"
        text.appendChild(pref)

        if (category.preferred_long) {
            let prefL = sanitizeHtml(category.preferred_long, ['A'], ['href']);
            prefL.className = 'preferred-long'
            text.appendChild(prefL)
        }

        let lusion = document.createElement('div')
        lusion.className = "lusions"
        lusion.append(
            ...[
                ['inclusion', ''],
                ['exclusion', 'Excl.:'],
                ['note', 'Note:']
            ].map(([key, label]) => {
                if (category[key]) {
                    let elem = document.createElement('div')
                    elem.className = 'lusion'
                    if (label) {
                        let lbl = document.createElement('div')
                        lbl.className = 'label'
                        lbl.innerText = label
                        elem.appendChild(lbl)
                    }
                    let content = sanitizeHtml(category[key], ['DIV', 'SPAN', 'A'], ['href'])
                    elem.appendChild(content)
                    return elem
                }
            }).filter( v => v)
        )
        text.appendChild(lusion)

        return label
    }

    createHeaderElement() {
        let header = super.createHeaderElement();

        header.appendChild(this.searchBox.createElement());
        header.appendChild(this.btnOk.createElement());

        return header
    }

    createBodyElement() {
        let body = super.createBodyElement();

        let catList = this.categoryList.createElement()
        catList.classList.add('category-list')
        body.appendChild(catList)

        let form = this.form.createElement()
        form.classList.add('form')
        body.appendChild(form)

        this.form.hideField('icd10modifier_class');
        this.form.hideField('icd10modifier_extra_class');

        return body
    }

    createElement() {
        let elem = super.createElement();

        elem.id = 'icd10coder';

        return elem;
    }
}