
import sqlalchemy

class SerializerMixin(object):
    serialized_attrs = []

    def _serialize_attr(self, attr):
        if hasattr(attr, 'get_serialized'):
            return attr.get_serialized()
        return attr

    def get_serialized(self):
        result = {}
        for attr_name in self.serialized_attrs:
            attr = getattr(self, attr_name)
            if type(attr) is sqlalchemy.orm.collections.InstrumentedList:
                attr_list = []
                for item in attr:
                    attr_list.append(self._serialize_attr(item))
                result[attr_name] = attr_list
            else:
                result[attr_name] = self._serialize_attr(attr)
        return result


class ValidatorMixin(object):
    validators = {}

    def find_type(self, class_, colname):
        if hasattr(class_, '__table__') and colname in class_.__table__.c:
            return class_.__table__.c[colname].type
        for base in class_.__bases__:
            return self.find_type(base, colname)
        raise NameError(colname)

    def is_valid_attr(self, name, value):
        print(name, value)
        if not hasattr(self, name):
            return False

        if name in self.validators:
            if not self.validators[name](value):
                return False

        try:
            col_type = self.find_type(self, name)
        except NameError:
            return False

        col_python_type_name = col_type.python_type.__name__

        if col_python_type_name == 'str':
            col_length = col_type.length
            if col_length is None:
                return True
            if len(value) > col_length:
                return False
            return True

        return False



    def setattr(self, name, value):
        """Only call after validating"""
        if not hasattr(self, name):
            raise KeyError(name)

        try:
            col_type = self.find_type(self, name)
        except NameError:
            raise KeyError(name)

        col_python_type_name = col_type.python_type.__name__

        if col_python_type_name == 'str':
            setattr(self, name, value)
            return

        #Handle other types here



        
