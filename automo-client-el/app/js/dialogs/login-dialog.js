const Dialog = require("./base-dialog");


class LoginDialog extends Dialog {
    constructor() {
        super("login-dialog");
        this.canDismiss = false;
        this.fade = false;
        this.centered = true
        this.on_login = null;
    }

    show(on_login) {
        this.on_login = on_login;
        super.show();
    }

    _on_login() {
        if (this.on_login == null) {
            this.close()
            return;
        }
        var data = {
            index_url: $("#indexurl").val(),
            username: $("#username").val(),
            password: $("#password").val(),
        }
        this.close(() => {
            this.on_login(data);
        });
    }

    render(target) {
        super.render(target);
        
        $('#dialog-title').html("Login");

        $('#dialog-body').html(`
            <form>
                <div class="form-group">
                    <input id="indexurl" class="form-control" type="text" placeholder="Server"
                        value="http://127.0.0.1:5000/api/">
                </div>
                <div class="form-group">
                    <input value="admin" id="username" class="form-control" type="text" placeholder="Username">
                </div>
                <div class="form-group">
                    <input value="a" id="password" class="form-control" type="password" placeholder="Password">
                </div>
            </form>`);

        $('#dialog-footer').html(`
            <button id="btn-login" type="button" class="btn btn-primary">Login</button>
            <!--<button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>-->
        `);

        $('#btn-login').click(() => {
            this._on_login();
        });
    }
}

module.exports = LoginDialog;