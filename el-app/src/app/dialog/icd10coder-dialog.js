const sqlite3 = require('sqlite3').verbose();
const querystring = require('querystring');

const Dialog = require('../../controls/dialog/dialog');
const SearchBox = require('../../controls/search-box');
//const Spinner = require('../../controls/spinner');
const Button = require('../../controls/button');
const RadioListBox = require('../../controls/radio-list-box');
const Form = require('../../controls/form/form');
const TextField = require('../../controls/form/text-field');


class Icd10CoderDialog extends Dialog {
    constructor(options = {}) {
        options.width = '80%';

        super(options);

        this.selectedCategory = null;

        this.icd10db = new sqlite3.Database(
            './src/icd10.db',
            sqlite3.OPEN_READWRITE,
            (err) => {
                if (err) {
                    console.error(err.message);
                }
            }
        );

        this.searchBox = new SearchBox(
            (query, on_done) => {
                return this._search(query, on_done);
            },
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
        );

        this.btnOk = new Button(
            options.okLabel != null ? options.okLabel : 'Save',
            (ev) => {
                this._onOk(ev);
            },
            {
                width: '80px'
            }
        );

        this.categoryList = new RadioListBox(
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
                        this.setSelectedCategory(code, () => {});
                    }
                }
            }
        )

        this.form = new Form();
        this.form.addField(new TextField(
            'comment',
            {
                label: "Comment",
                labelTop: true,
                type: 'textarea',
                rows: 5
            }
        ));

        //this.spinner = new Spinner();
    }

    value() {
        return {
            category: this.categoryList.value()
        }
    }

    getCategory(code, onDone) {
        var sql = `SELECT * FROM icd10class WHERE code=="${code}"`;

        this.icd10db.get(sql, (err, row) => {
            if (err) {
                throw err;
            }
            onDone(row);
        });
    }

    loadSelectedBlock(onDone) {
        var sql = `SELECT * FROM icd10class WHERE parent_block_code=="${this.selectedBlock.code}"`;

        this.icd10db.all(sql, [], (err, rows) => {
            if (err) {
                console.log("error");
                throw err;
            }
            this.categoryList.setData(rows);
            onDone();
        })
    }

    setSelectedCategory(code, onDone, scroll = true) {
        this.getCategory(code, (category) => {
            if (category == null) {
                onDone();
                return;
            }
            this.selectedCategory = category;

            if (this.selectedBlock != null) {
                if (this.selectedBlock.code == this.selectedCategory.parent_block_code) {
                    this.categoryList.setSelection(this.selectedCategory.code)
                    onDone();
                    return;
                }
            }

            this.getCategory(this.selectedCategory.parent_block_code, (block) => {
                this.selectedBlock = block;
                this.loadSelectedBlock(() => {
                    this.categoryList.setSelection(this.selectedCategory.code);
                    onDone();
                })
            })
        })
    }

    _onSelectSearchResult(item) {
        this.setSelectedCategory(item.code, () => { });
    }

    _onSelectCategory(category) {
        this.selectedCategory = category;
    }

    _search(query, on_done) {
        var preferred_and_query = [];
        query.split(" ").forEach((word) => {
            preferred_and_query.push(`preferred_plain LIKE "%${word}%"`);
        })

        var preferred_long_and_query = [];
        query.split(" ").forEach((word) => {
            preferred_long_and_query.push(`preferred_long LIKE "%${word}%"`);
        })

        var sql = `
            SELECT code, preferred_plain 
            FROM icd10class
            WHERE kind == "category" AND ${preferred_and_query.join(" AND ")}
    
            UNION
    
            SELECT code, preferred_plain
            FROM icd10class
            WHERE kind == "category" AND ${preferred_long_and_query.join(" AND ")}
            
            UNION
            
            SELECT code, preferred_plain
            FROM icd10class
            WHERE kind == "category" AND code LIKE "%${query}%"
            
            LIMIT 20`

        //this.spinner.show();
        this.icd10db.all(sql, [], (err, rows) => {
            if (err) {
                //this.spinner.hideSoft();
                throw err;
            }
            //this.spinner.hideSoft();
            on_done(rows);
        })
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

        //this.headerElement.appendChild(this.spinner.createElement());
        //this.spinner.hideSoft();

        this.bodyElement.appendChild(this.categoryList.createElement());
        this.categoryList.element.classList.add('category-list');

        this.bodyElement.appendChild(this.form.createElement());
        this.form.element.classList.add('form');

        this.footerElement.appendChild(this.btnOk.createElement());

        return this.element;
    }
}


module.exports = Icd10CoderDialog;