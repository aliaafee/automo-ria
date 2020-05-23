"""AutoMO Exceptions"""

class AutoMODatabaseError(Exception):
    """Base AutoMO Database Exception"""
    pass


class FieldValueError(AutoMODatabaseError):
    """Error raised when a field is invalid.
      Contains a list of invalid_fields"""

    def __init__(self, msg, invalid_fields=[]):
        self.msg = msg
        self.invalid_fields = invalid_fields

    def __str__(self):
        return "Invalid fields {}".format(", ".join(self.invalid_fields))

