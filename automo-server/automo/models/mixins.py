import dateutil

import sqlalchemy
from .dbexception import FieldValueError
from pprint import pprint

class SerializerMixin(object):
    serialized_attrs = []

    def _serialize_attr(self, attr):
        if hasattr(attr, 'get_serialized'):
            return attr.get_serialized()
        return attr

    def get_serialized(self, attrs=None):
        serialized_attrs = attrs if attrs else self.serialized_attrs
        result = {}
        for attr_name in serialized_attrs:
            attr = getattr(self, attr_name)
            if type(attr) is sqlalchemy.orm.collections.InstrumentedList:
                attr_list = []
                for item in attr:
                    attr_list.append(self._serialize_attr(item))
                result[attr_name] = attr_list
            else:
                result[attr_name] = self._serialize_attr(attr)
        if hasattr(self, 'url'):
            result['url'] = self.url()
        return result


class ValidatorMixin(object):
    validators = {}

    def find_type(self, class_, colname):
        if hasattr(class_, '__table__') and colname in class_.__table__.c:
            return class_.__table__.c[colname].type
        #for base in class_.__bases__:
        #    return self.find_type(base, colname)
        raise NameError(colname)


    def validate_and_setdata(self, data):
        """Accepts data as dictionary, validates and inserts it,
           Inserts no fields when error is found and raises an error"""

        pprint(data)

        invalid_fields = []
        for name, value in data.items():
            if not self.is_valid_attr(name, value):
                invalid_fields.append(name)

        if invalid_fields:
            raise FieldValueError("Invalid fields", invalid_fields)

        for name, value in data.items():
            self.setattr(name, value)


    def process_validators(self, name, value):
        """Process any custom validators if they have been set"""
        if name in self.validators:
            if not self.validators[name](name, value):
                return False
        return True


    def is_valid_attr(self, name, value):
        """Check wheter the attr exists and the value is valid datatype"""
        if not hasattr(self, name):
            return False

        try:
            col_type = self.find_type(self, name)
        except NameError:
            return False

        col_python_type_name = col_type.python_type.__name__

        print(type(col_type))

        if type(col_type) is sqlalchemy.sql.sqltypes.String:
            #Validate Strings
            col_length = col_type.length
            if len(value) > col_length:
                return False
            return True

        if type(col_type) is sqlalchemy.sql.sqltypes.Text:
            #Validate Text
            return True

        if type(col_type) is sqlalchemy.sql.sqltypes.Float:
            #Validate Floats
            try:
                float(value)
            except ValueError:
                return False
            return True

        if isinstance(col_type, sqlalchemy.sql.sqltypes.DateTime):
            #Validate DateTime
            try:
                dateutil.parser.isoparse(value)
            except ValueError:
                return False
            return True            

        print("Invalid")
        return False


    def setattr(self, name, value):
        """Only call after validating, setattr after converting."""
        if not hasattr(self, name):
            raise KeyError(name)

        try:
            col_type = self.find_type(self, name)
        except NameError:
            raise KeyError(name)

        if type(col_type) is sqlalchemy.sql.sqltypes.String:
            #Set Strings
            setattr(self, name, value)
            return

        if type(col_type) is sqlalchemy.sql.sqltypes.Text:
            #Set Text
            setattr(self, name, value)
            return

        if type(col_type) is sqlalchemy.sql.sqltypes.Float:
            #Set Floats
            setattr(self, name, float(value))
            return

        if isinstance(col_type, sqlalchemy.sql.sqltypes.DateTime):
            #Set DateTime
            setattr(self, name, dateutil.parser.isoparse(value))
            return

        #Handle other types here



        
