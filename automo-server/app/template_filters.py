def register_filters(app):
    app.jinja_env.filters['formate_date'] = format_date
    app.jinja_env.filters['format_datetime'] = format_datetime
    app.jinja_env.filters['format_duration'] = format_duration
    app.jinja_env.filters['format_duration_verbose'] = format_duration_verbose


DATE_FORMAT = "%d/%m/%Y"
DATETIME_FORMAT = "%d/%m/%Y %H:%M:%S"

def format_date(date_object):
    """Format date"""
    if date_object is None:
        return ""

    return date_object.strftime(DATE_FORMAT)


def format_datetime(datetime_object):
    """Format datetime"""
    if datetime_object is None:
        return ""

    return datetime_object.strftime(DATETIME_FORMAT)


def format_duration(duration): #from_date, to_date):
    """Format python relative delta duration to human readable form."""
    if duration is None:
        return ""
    if duration.years < 1:
        if duration.months < 1:
            if duration.days < 1:
                if duration.hours < 1:
                    return "{0}min {1}sec".format(duration.minutes, duration.seconds)
                return "{0}h".format(duration.hours)
            return "{0}d".format(duration.days)
        return "{0}m {1}d".format(duration.months, duration.days)
    if duration.years < 5 and duration.months > 0:
        return "{0}y {1}m".format(duration.years, duration.months)
    return "{0}y".format(duration.years)


def format_duration_verbose(duration): #from_date, to_date):
    """Format python relative delta duration to human readable form."""
    if duration is None:
        return ""
    if duration.years < 1:
        if duration.months < 1:
            if duration.days < 1:
                if duration.hours < 1:
                    return "{0}minutes {1}seconds".format(duration.minutes, duration.seconds)
                return "{0}hours".format(duration.hours)
            return "{0}days".format(duration.days)
        return "{0}months {1}days".format(duration.months, duration.days)
    if duration.years < 5 and duration.months > 0:
        return "{0}years {1}months".format(duration.years, duration.months)
    return "{0}years".format(duration.years)
