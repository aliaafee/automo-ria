const sqlite3 = require('sqlite3').verbose();
const Dialog = require('../../controls/dialog/dialog');
const SearchBox = require('../../controls/search-box');
//const Spinner = require('../../controls/spinner');
const Button = require('../../controls/button');


class Icd10CoderDialog extends Dialog {
    constructor(options = {}) {
        options.width = '80%';

        super(options);

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

        //this.spinner = new Spinner();
    }

    value() {
        return {
            code: 'YADAYADY'
        }
    }

    _onSelectSearchResult(item) {
        console.log(item);
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

    createElement() {
        super.createElement();

        this.headerElement.appendChild(this.searchBox.createElement());
        this.searchBox.element.style.flexGrow = 1;

        //this.headerElement.appendChild(this.spinner.createElement());
        //this.spinner.hideSoft();

        this.footerElement.appendChild(this.btnOk.createElement());

        return this.element;
    }
}


module.exports = Icd10CoderDialog;