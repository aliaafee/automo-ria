from .. import models as md

from . import api
from .item_getters import get_items_list, get_item, post_item


@api.route("/beds/")
def get_beds():
    return get_items_list(md.Bed, 'api.get_beds')


@api.route("/beds/<int:bed_id>")
def get_bed(bed_id):
    return get_item(md.Bed, bed_id)


@api.route("/beds/<int:bed_id>", methods=['POST'])
def post_bed(bed_id):
    return post_item(md.Bed, bed_id)