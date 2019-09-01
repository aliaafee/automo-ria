"""Administration Panal"""
from flask_login import login_required

from ...decorators import admin_required

from . import admin


@admin.route('/admin')
@login_required
@admin_required
def admin_panel():
    return "Administrator Panel"