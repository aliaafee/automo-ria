const NavBar = require("./navbar");
const ICD10Dialog = require("./dialogs/icd10coder-dialog");
const ResourceForm = require("./controls/resource-form");
const TextField = require("./controls/text-field");


class MainWindow {
    constructor(connection) {
        this.connection = connection;
        this.navbar = new NavBar();
        this.icd10Dialog = new ICD10Dialog();

        this.patient_form = null;
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

    displayPatient(patient) {
        console.log(patient);
        $('#main').html(`
            <div class="container">
                <form id="patient-form"></form>
            </div>
        `);
        this.patient_form = new ResourceForm(
            'patient-form',
            'patient',
            this.connection,
            patient.url,
            patient.url,
            {
                title: "Patient Data"
            }
        )

        this.patient_form.addField(
            new TextField(
                'patient-name',
                'name',
                {
                    label: "Name",
                    placeholder: "Name",
                    //helpText: "Full name of patient",
                    //invalidFeedback: "The name is not valid",
                    required: true,
                    //default: "",
                }
            )
        )

        this.patient_form.render();
        this.patient_form.getData();
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

        $('#btn-patient-one').click(() => {
            console.log("Patient One");
            this.connection.get(
                this.connection.index_url,
                data => {
                    this.connection.get(
                        data['patients'],
                        data => {
                            this.displayPatient(data.patients[0]);
                        }
                    )
                }
            )
        });

        $('#btn-icd10').click(() => {
            this.icd10Dialog.render($("#dialog"));
            this.icd10Dialog.show((problem) => {
                console.log(problem);
            });
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
                                    <a id="btn-patient-one" class="nav-link" href="#">
                                        Load Patient One
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