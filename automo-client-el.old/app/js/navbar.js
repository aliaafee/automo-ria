const feather = require('feather-icons');

class NavBar {
    constructor () {

    }

    setTitle(title) {
        $('#lbl-title').html(title);
    }

    setUserName(username) {
        $('#lbl-username').html(username);
    }

    setLogoutFunction(logoutFunction) {
        $('#btn-logout').on('click', logoutFunction);
    }

    render(target) {
        target.addClass('navbar navbar-dark navbar-expand fixed-top bg-dark shadow p-0');
        target.html(`
            <a id="lbl-title" class="navbar-brand col mr-0" href="#">
                
            </a>
            <div class="collapse navbar-collapse">
                <ul class="navbar-nav mr-auto">

                </ul>
                <ul class="navbar-nav justify-content-end">
                    <li class="nav-item">
                        <a id="btn-username" class="nav-link" href="#">
                            <span data-feather="user"></span>
                            <span id="lbl-username"></span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a id="btn-logout" class="nav-link" href="#">
                            ${feather.icons['log-out'].toSvg()}
                            Logout
                        </a>
                    </li>
                </ul>
            </div>`)
    }
}

module.exports = NavBar;