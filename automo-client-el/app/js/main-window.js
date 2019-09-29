const NavBar = require("./navbar");
const ICD10Dialog = require("./dialog/icd10coder-dialog");


class MainWindow {
    constructor(connection) {
        this.connection = connection;
        this.navbar = new NavBar();
        this.icd10Dialog = new ICD10Dialog();
    }

    initialize() {
        this.navbar.setTitle("AutoMO");
        if (this.connection.isLoggedIn()) {
            this.navbar.setUserName(this.connection.user.getName());
        } else {
            this.navbar.setUserName("");
        }
    }

    setLogger(logger) {
        logger.setTarget($("#status"));
    }

    displayPatientList(data) {
        var result = "";
    
        data['patients'].forEach(element => {
            result += `<tr><td>${element['id']}</td><td>${element['name']}</td><td>${element['url']}</td></tr>`
        });
    
        $('#main').html(
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

    _setupEvents() {
        $('#btn-patient-list').click(() => {
            console.log("Yo");
            this.connection.get(
                this.connection.index_url,
                data => {
                    this.connection.get(
                        data['patients'],
                        data => {
                            this.displayPatientList(data);
                        }
                    )
                }
            )
        });

        $('#btn-patient-list').click(() => {
            this.connection.get(
                this.connection.index_url,
                data => {
                    this.connection.get(
                        data['patients'],
                        data => {
                            this.displayPatientList(data);
                        }
                    )
                }
            )
        });

        $('#btn-icd10').click(() => {
            this.icd10Dialog.render($("#dialog"));
            this.icd10Dialog.show();
        });
    }

    render(target) {
        target.html(`
            <nav id="navbar">
                Navbar
            </nav>
            <div class="container-fluid">
                <div class="row">
                    <div class="col sidebar bg-light">
                        <div id="sidebar" class="sidebar-sticky">
                            <!--Sidebar Section Heading-->
                            <h6
                                class="sidebar-heading d-flex justify-content-between align-items-center px-3 mt-2 mb-1 text-muted">
                                <span>Patients</span>
                                <a class="d-flex align-items-center text-muted" href="#">
                                    <span data-feather="plus-circle"></span>
                                </a>
                            </h6>
                            <ul class="nav flex-column mb-2">
                                <li class="nav-item">
                                    <a id="btn-patient-list" class="nav-link" href="#">
                                        List All Patients
                                    </a>
                                </li>
                                <li class="nav-item">
                                    <a id="btn-icd10" class="nav-link" href="#">
                                        ICD10 Coder
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div class="col main">
                        <div id="main" class="main-sticky">
                            Main
                        </div>
                    </div>
                </div>
                <div id="status" class="row footer bg-light">
                    Status
                </div>
            </div>`)
        this.navbar.render($('#navbar'));

        this._setupEvents();
    }
}

module.exports = MainWindow;