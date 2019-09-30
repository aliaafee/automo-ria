const sqlite3 = require('sqlite3').verbose();
const querystring = require('querystring');
const feather = require('feather-icons');

const Dialog = require("./base-dialog");
const SearchBox = require("../controls/search-box");


class ICD10Dialog extends Dialog {
    constructor() {
        super("icd10-dialog");
        this.large = true;

        this.selected_category = null;
        this.selected_chapter = null;
        this.selected_block = null;

        this.on_save = null;

        this.db = new sqlite3.Database('./app/icd10.db', sqlite3.OPEN_READWRITE, (err) => {
            if (err) {
                console.error(err.message);
            }
            console.log('Connected to ICD10 Data.')
        });

        this.searchBox = new SearchBox(
            "search-box",
            (query, on_done) => {
                this.search(query, on_done) 
            },
            (code) => {
                this.set_selected_category(code, () => {});
            },
            "Search ICD10 Code"
        );
    }


    show(on_save) {
        this.on_save = on_save;
        this.selected_category = null;
        this.selected_chapter = null;
        this.selected_block = null;

        super.show();
    }


    gen_id(code) {
        return "CAT" + code.replace(".", 'X');
    }


    get_category(code, on_done) {
        var sql = `SELECT * FROM icd10class WHERE code=="${code}"`;

        this.db.get(sql, (err, row) => {
            if (err) {
                throw err;
            }
            on_done(row);
        });
    }


    get_block_categories(code, on_done) {
        var sql = `SELECT * FROM icd10class WHERE parent_block_code=="${code}"`;

        this.db.all(sql, [], (err, rows) => {
            if (err) {
                on_done();
                throw err;
            }
            on_done(rows);
        })
    }


    load_selected_block(on_done) {
        if (this.selected_block == null) {
            return;
        }
        $("#icd10-dialog #chapter-title").html(
            `Chapter ${this.selected_chapter.code} ${this.selected_chapter.preferred_plain}`
        );
        $("#icd10-dialog #block-title").html(
            `<span>${this.selected_block.code}</span> <span>${this.selected_block.preferred_plain}</span>`
        );

        this.get_block_categories(this.selected_block.code, (categories) => {
            if (categories == null) {
                $('#icd10-dialog #category-list').html("");
                return;
            }
            var result = ""
            categories.forEach((category) => {
                var main_cat = "";
                if (category.code.length <= 3) {
                    main_cat = "main-category";
                }

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

                result += `
                    <li id="${this.gen_id(category.code)}" href="#" class="category ${main_cat} list-group-item list-group-item-action">
                        <div class="d-flex w-100">
                                <div class="code d-flex" code="${category.code}">
                                    <input id="${this.gen_id(category.code)}RADIO" type="radio" tabindex="-1" />
                                    <div>
                                        ${category.code}
                                    </div>
                                </div>
                                <div class="category-text">
                                    <div class="preferred">
                                        ${category.preferred}
                                    </div>
                                    ${preferred_long}
                                    <div class="lusions">${lusion}</div>
                                </div>
                        </div>
                    </li>`
            });

            $('#icd10-dialog #category-list').html(result);

            $("#icd10-dialog .code").click((event) => {
                event.preventDefault();
                console.log($(event.currentTarget).attr("code"));
                this.set_selected_category($(event.currentTarget).attr("code"), () => { }, false);
            })

            $("#icd10-dialog a").click((event) => {
                event.preventDefault();
                var query = $(event.target).attr('href');
                var query_data = querystring.decode(query)
                console.log(query_data);
                let code = query_data['category?code']
                console.log(code);
                if (code != null) {
                    this.set_selected_category(code, () => { });
                }
            });

            on_done();
        })
    }


    set_selection_to_selected_category(scroll = true, clear = true) {
        if (clear) {
            $("#icd10-dialog .category input").prop('checked', false);
        }

        let selected_id = `#icd10-dialog #${this.gen_id(this.selected_category.code)}`

        let selected = $(selected_id)

        //Set Selection
        $(`${selected_id} input`).prop('checked', true);

        //Scroll to the category
        if (scroll) {
            $('#icd10-dialog #block-list').scrollTop(0);
            let position = selected.offset().top - selected.parent().offset().top;
            $('#icd10-dialog #block-list').scrollTop(position);
        }

        //Update the form
        $("#icd10-dialog #selected-category .code").text(this.selected_category.code);
        $("#icd10-dialog #selected-category .preferred").html(this.selected_category.preferred);
        $("#icd10-dialog #selected-category").removeClass("is-invalid");

        $("#icd10-dialog #selected-category .preferred-long").html(
            this.selected_category.preferred_long != null ?
                `(${this.selected_category.preferred_long})` : ""
        );

        this.load_modifier(
            this.selected_category.modifier_code,
            $('#icd10-dialog #modifier-group'),
            $('#icd10-dialog #selected-modifier'),
            $('#icd10-dialog #modifier-group label')
        );

        this.load_modifier(
            this.selected_category.modifier_extra_code,
            $('#icd10-dialog #modifier-extra-group'),
            $('#icd10-dialog #selected-modifier-extra'),
            $('#icd10-dialog #modifier-extra-group label')
        );
    }


    load_modifier(modifier_code, group, select, label) {
        if (modifier_code == null) {
            select.html("");
            group.hide();
            return;
        }
        select.html("");
        group.show();

        var sql = `
            SELECT code, code_short, preferred
            FROM icd10modifierclass
            WHERE modifier_code == "${modifier_code}"`;

        this.db.all(sql, [], (err, rows) => {
            if (err) {
                select.html("");
                group.hide();
                throw err;
            }

            select.append(new Option("<None>", ""));

            rows.forEach((row) => {
                select.append(new Option(
                    `${row.code_short} - ${row.preferred}`,
                    row.code
                ));
            });
        });

        var sql = `
            SELECT name
            FROM icd10modifier
            WHERE code == "${modifier_code}"`;

        this.db.get(sql, [], (err, row) => {
            if (err) {
                select.html("");
                group.hide();
                throw err;
            }
            label.text(row.name);
        });
    }


    set_selected_category(code, on_done, scroll = true) {
        this.get_category(code, (category) => {
            if (category == null) {
                on_done();
                return;
            }
            this.selected_category = category;

            if (this.selected_block != null) {
                if (this.selected_block.code == this.selected_category.parent_block_code) {
                    this.set_selection_to_selected_category(scroll);
                    on_done();
                    return;
                }
            }
            this.get_category(this.selected_category.parent_block_code, (block) => {
                if (block == null) {
                    on_done();
                    return;
                }
                this.selected_block = block;
                this.get_category(this.selected_block.parent_code, (chapter) => {
                    if (block == null) {
                        on_done();
                        return;
                    }
                    this.selected_chapter = chapter;
                    this.load_selected_block(() => {
                        this.set_selection_to_selected_category(scroll, false);
                        on_done();
                    });
                })
            });
        });
    }


    search(query, on_done) {
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

        this.db.all(sql, [], (err, rows) => {
            if (err) {
                throw err;
            }
            on_done(rows);
        })
    }


    searchCategories(query) {
        if (query == "") {
            $("#icd10-dialog #search-results").html(`
                <a class="list-group-item list-group-item-action disabled">
                    &nbsp;
                </a>
            `);
            return;
        }

        $("#icd10-dialog #search-query").dropdown("show");

        /*

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

        db.all(sql, [], (err, rows) => {
            if (err) {
                throw err;
            }
            var result = ""

            rows.forEach((row) => {
                result += `
                    <li code="${row.code}" href="#" class="search-result list-group-item list-group-item-action">
                        <span>${row.code}</span>
                        <span>${row.preferred_plain}</span>
                    </li>`
            });

            if (result == "") {
                result = `<li class="list-group-item list-group-item-action disabled">No Search Results.</li>`
            }

            $("#search-results").html(`${result}`);

            $(".search-result").click(function () {
                $(".search-result").removeClass("active");
                $(this).addClass("active");
                set_selected_category($(this).attr("code"), () => { });
            })
        })
        */
    }


    _on_save() {
        if (this.selected_category == null) {
            $("#icd10-dialog #selected-category").addClass("is-invalid");
            return;
        }

        let result = {
            'icd10class': this.selected_category,
            'icd10modifier_class_code':
                this.selected_category.modifier_code != null ?
                    $('#icd10-dialog #selected-modifier').val() == "" ? null : $('#icd10-dialog #selected-modifier').val() : null,
            'icd10modifier_extra_class':
                this.selected_category.modifier_extra_code != null ?
                    $('#icd10-dialog #selected-modifier-extra').val() == "" ? null : $('#icd10-dialog #selected-modifier-extra').val() : null,
            'comment': $("#icd10-dialog #comment").val()
        }

        this.close(() => {
            this.on_save(result);
        });
    }


    setupEvents() {
        $("#icd10-dialog #search-query").keyup(() => {
            let query = $("#icd10-dialog #search-query").val();
            this.set_selected_category(query, () => { }, true);
        })

        $("#icd10-dialog #save").click((event) => {
            event.preventDefault();
            this._on_save();
        })
    }


    getHeader() {
        return `
            <div class="modal-header">
                <input id="search-box" />
                ${this._getCloseButton()}
            </div>`
    }

    getBody() {
        return `
            <div id="dialog-body" class="modal-body p-0">
                <div class="d-flex">
                    <div class="col-7 p-0">
                        <div id="block-list">
                        <ul id="category-list" class="list-group list-group-flush">
                            
                        </ul>
                        </div>
                    </div>
                    <div class="col-5 p-3">
                        <form id="category-form">
                            <div id="category-group" class="form-group category">
                                <label for="exampleInputEmail1">Code</label>
                                <div id="selected-category" class="form-control d-flex">
                                    <div class="code d-flex">
                                        &nbsp;
                                    </div>
                                    <div class="category-text">
                                        <div class="preferred"></div>
                                        <div class="preferred-long"></div>
                                    </div>
                                </div>
                                <div class="invalid-feedback">Select a Code</div>
                            </div>
                            <div id="modifier-group" class="form-group">
                                <label for="selected-modifier">Modifier</label>
                                <select id="selected-modifier" class="form-control">
                                </select>
                            </div>
                            <div id="modifier-extra-group" class="form-group">
                                <label for="selected-modifier-extra">Modifier Extra</label>
                                <select id="selected-modifier-extra" class="form-control">
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="note">Comment</label>
                                <textarea id="comment" class="form-control" rows="5"></textarea>
                            </div>
                        </form>
                    </div>
                </div>
            </div>`
    }

    getFooter() {
        return `
            <div id="dialog-footer" class="modal-footer">
                <button id="save" type="submit" class="btn btn-primary">Save</button>
            </div>`
    }

    render(target) {
        super.render(target);
        this.searchBox.render()
    }



}

module.exports = ICD10Dialog;