from flask.json import JSONEncoder
from datetime import datetime
from  dateutil.relativedelta import relativedelta
from .template_filters import format_duration


class CustomJSONEncoder(JSONEncoder):
    def default(self, obj):
        try:
            if isinstance(obj, relativedelta):
                return format_duration(obj)

            if isinstance(obj, datetime):
                return obj.isoformat()

            iterable = iter(obj)
        except TypeError:
            pass
        else:
            return list(iterable)
        return JSONEncoder.default(self, obj)
