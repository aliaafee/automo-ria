const querystring = require('querystring');

const sqlite3 = require('sqlite3').verbose();

var selected_category = null;
var selected_block = null;
var selected_chapter = null;


let db = new sqlite3.Database('./app/icd10.db', sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to icd10data.');
});


function get_category(code, on_done) {
    var sql = `SELECT * FROM icd10class WHERE code=="${code}"`;

    db.get(sql, (err, row) => {
        if (err) {
            throw err;
        }
        on_done(row);
    });
}


function get_block_categories(code, on_done) {
    var sql = `SELECT * FROM icd10class WHERE parent_block_code=="${code}"`;

    db.all(sql, [], (err, rows) => {
        if (err) {
            on_done();
            throw err;
        }
        on_done(rows);
    })
}


function fix_links(text) {
    if (text == null) {
        return text;
    }
    w = text.replace("<a", "<span")
    w = w.replace("</a>", "</span>")
    return w;
}

function gen_id(code) {
    return "CAT" + code.replace(".", 'X');
}


function load_selected_block(on_done) {
    if (selected_block == null) {
        return;
    }
    $("#chapter-title").html(
        `Chapter ${selected_chapter.code} ${selected_chapter.preferred_plain}`
    );
    $("#block-title").html(
        `<span>${selected_block.code}</span> <span>${selected_block.preferred_plain}</span>`
    );

    get_block_categories(selected_block.code, (categories) => {
        if (categories == null) {
            $('#category-list').html("");
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
                <li id="${gen_id(category.code)}" href="#" class="category ${main_cat} list-group-item list-group-item-action">
                    <div class="d-flex w-100">
                            <div class="code">
                                <a href="#" class="category-link" code="${category.code}">
                                    ${category.code}
                                </a>
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

        $('#category-list').html(result);

        $(".category-link").click(function () {
            event.preventDefault();
            set_selected_category($(this).attr("code"), () => { }, false);
        })

        $("a").click(function (event) {
            event.preventDefault();
            //This works, but at the expense of useability.
            //Need to click the link on the code to select a category
            //Not very intitutive
            //Need to fix
            var query = $(this).attr('href');
            var query_data = querystring.decode(query)
            console.log(query_data);
            code = query_data['category?code']
            console.log(code);
            if (code != null) {
                set_selected_category(code, () => {});
            }
        });

        on_done();
    })
}


function set_selection_to_selected_category(scroll = true, clear = true) {
    if (clear) {
        $(".category").removeClass("active");
    }

    selected_id = `#${gen_id(selected_category.code)}`

    console.log(selected_id);

    selected = $(selected_id)

    //Scroll to the category
    if (scroll) {
        $('#block-list').scrollTop(0);
        $('#block-list').scrollTop(selected.offset().top);
    }

    //Set Selection
    selected.addClass("active");
}


function set_selected_category(code, on_done, scroll = true) {
    get_category(code, (category) => {
        if (category == null) {
            on_done();
            return;
        }
        selected_category = category;
        console.log(selected_category);

        if (selected_block != null) {
            if (selected_block.code == selected_category.parent_block_code) {
                set_selection_to_selected_category(scroll);
                on_done();
                return;
            }
        }
        get_category(selected_category.parent_block_code, (block) => {
            if (block == null) {
                on_done();
                return;
            }
            selected_block = block;
            get_category(selected_block.parent_code, (chapter) => {
                if (block == null) {
                    on_done();
                    return;
                }
                selected_chapter = chapter;
                load_selected_block(() => {
                    set_selection_to_selected_category(scroll, false);
                    on_done();
                });
            })
        });
    });
}


$("#search-query").keyup(function () {
    let query = $(this).val()

    if (query == "") {
        $("#search-results").html(`<a class="list-group-item list-group-item-action disabled">&nbsp;</a>`);
        return;
    }

    var preferred_and_query = [];
    query.split(" ").forEach((word) => {
        preferred_and_query.push(`preferred_plain LIKE "%${word}%"`);
    })

    var preferred_long_and_query = [];
    query.split(" ").forEach((word) => {
        preferred_long_and_query.push(`preferred_long LIKE "%${word}%"`);
    })

    var sql =   `
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
});