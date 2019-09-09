
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
