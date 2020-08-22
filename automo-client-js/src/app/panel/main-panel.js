const Control = require('../../controls/control');
const Button = require('../../controls/button')
const PatientBrowser = require('../panel/patient-browser');


module.exports = class MainPanel extends Control {
    constructor(onUser, onLogout, options={}) {
        super(options);

        this._menuItems = [];
        this._sidebarItems = [];

        this._patientBrowser = new PatientBrowser();

        this._userButton = new Button(
            'Username',
            (event) => {
                console.log("Open User Dialog");
                onUser();
            },
            {
                icon: 'user'
            }
        )
        this._logoutButton = new Button(
            'Logout',
            (event) => {
                console.log("Logout")
                onLogout();
            },
            {
                icon: 'log-out'
            }
        )

        this.addMenuSpacer();
        this.addMenuItem(this._userButton)
        this.addMenuItem(this._logoutButton)

        this.addSidebarItem(
            new Button(
                'Patients',
                () => {},
                {
                    icon: 'users'
                }
            )
        )
        this.addSidebarItem(
            new Button(
                'New Admission', 
                (event) => {
                    admitWizard.show(
                        (admission) => {
                            console.log(admission)
                            this._patientBrowser.setPatient(
                                admission.patient,
                                () => {},
                                () => {},
                                admission
                            )
                        },
                        () => {
                            console.log("Cancelled")
                        }
                    )
                },
                {
                    icon: 'file-plus'
                }
            )
        )
        this.addSidebarSpacer()
        this.addSidebarItem(
            new Button(
                'Settings',
                () => {
                    console.log('Settings')
                },
                {
                    icon: 'settings'
                }
            )
        )
    }

    addMenuItem(item) {
        this._menuItems.push(item);
    }

    addMenuSpacer() {
        this._menuItems.push('_spacer');
    }

    addSidebarItem(item) {
        this._sidebarItems.push(item);
    }

    
    addSidebarSpacer() {
        this._sidebarItems.push('_spacer');
    }

    _createMenuBarElement() {
        this._menuBarElement = document.createElement('div')
        this._menuBarElement.className = 'menu-bar';

        var titleElem = document.createElement('div');
        titleElem.className = 'menu-bar-title';
        titleElem.innerText = window.localSettings['department']['name'];
        this._menuBarElement.appendChild(titleElem)
        
        var subTitleElem = document.createElement('div');
        subTitleElem.className = 'menu-bar-subtitle';
        subTitleElem.innerText = `(${window.localSettings['hospital']['name']})`;
        this._menuBarElement.appendChild(subTitleElem)
        

        this._menuItems.forEach((item) => {
            if (item == '_spacer') {
                var elem = document.createElement('div');
                elem.className = 'menu-bar-spacer';
                this._menuBarElement.appendChild(elem);
                return;
            }
            var elem = item.createElement();
            elem.classList.add('menu-bar-item');
            this._menuBarElement.appendChild(elem)
        })

        return this._menuBarElement;
    }

    _createSideBarElement() {
        this._sideBarElement = document.createElement('div')
        this._sideBarElement.className = 'side-bar';

        this._sidebarItems.forEach((item) => {
            if (item == '_spacer') {
                var elem = document.createElement('div');
                elem.className = 'side-bar-spacer';
                this._sideBarElement.appendChild(elem);
                return;
            }
            var elem = item.createElement();
            elem.classList.add('side-bar-item');
            this._sideBarElement.appendChild(elem)
        })

        return this._sideBarElement;
    }

    createElement() {
        super.createElement();

        this._userButton.label = connection.user.getName();

        this.element.className = 'main-panel';

        this.element.appendChild(this._createMenuBarElement())

        var bodyElem = document.createElement('div');
        bodyElem.className = 'main-panel-body';
        this.element.appendChild(bodyElem);

        bodyElem.appendChild(this._createSideBarElement())

        this._mainElement = document.createElement('div')
        this._mainElement.className = 'main-content';
        bodyElem.appendChild(this._mainElement)

        this._mainElement.appendChild(this._patientBrowser.createElement());        

        return this.element;
    }
}