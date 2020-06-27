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
    required_attrs = []
    editable_relationships = []


    def validate_and_update(self, data):
        invalid_fields = {}

        #Check if primary_key field has not been changed if present
        primary_key_name = sqlalchemy.inspect(self.__class__).primary_key[0].name
        if primary_key_name in data.keys():
            if getattr(self, primary_key_name) != data[primary_key_name]:
                invalid_fields[primary_key_name] = 'Field cannot be edited'

        #Check if there are no blank required fields
        for required_attr in self.required_attrs:
            if (required_attr in data.keys()):
                if not data[required_attr]:
                    invalid_fields[required_attr] = 'Cannot be blank'

        #Validate and update fields
        for name, value in data.items():
            result = self.validate_and_update_field(name, value)
            if result:
                invalid_fields[name] = result

        return invalid_fields


    def validate_and_insert(self, data):
        invalid_fields = {}

        #Check if primary_key field has not been changed if present
        primary_key_name = sqlalchemy.inspect(self.__class__).primary_key[0].name
        if primary_key_name in data.keys():
            if getattr(self, primary_key_name) != data[primary_key_name]:
                invalid_fields[primary_key_name] = 'Field cannot be set'

        #Check if there are no blank required fields
        for required_attr in self.required_attrs:
            if (required_attr not in data.keys()):
                invalid_fields[required_attr] = 'Required'
            else:
                if not data[required_attr]:
                    invalid_fields[required_attr] = 'Cannot be blank'

        for name, value in data.items():
            result = self.validate_and_update_field(name, value)
            if result:
                invalid_fields[name] = result

        return invalid_fields


    def validate_and_update_field(self, name, value):
        if not hasattr(self, name):
            return 'Attribute not found'

        attr = getattr(self, name)
        col_class = getattr(self.__class__, name)
        if not hasattr(col_class, 'property'):
            return 'Attribut is not a column'
        col_property = getattr(self.__class__, name).property

        if isinstance(col_property,sqlalchemy.orm.relationships.RelationshipProperty):
            if name not in self.editable_relationships:
                return 'Attribute cannot be set'
                
            if  col_property.uselist:
                return 'Attribute is a list, cannot set'

            if value is None:
                setattr(self, name, None)
                return None
            
            if attr == None:
                #Create new row and insert data
                col_class = col_property.mapper.class_()
                new_item = type(col_class)()
                
                setattr(self, name, new_item)
                attr = getattr(self, name)

                return attr.validate_and_insert(value)
            
            #Update the data in the row
            return attr.validate_and_update(value)

        
        if not isinstance(col_property, sqlalchemy.orm.properties.ColumnProperty):
            return 'Attribute cannot be set'

        col_type = col_property.columns[0].type

        converted_value = None

        if value is None:
            converted_value = None

        elif type(col_type) is sqlalchemy.sql.sqltypes.Text:
            try:
                converted_value = str(value)
            except Exception as e:
                return 'Text not valid. {}'.format(e)

        elif type(col_type) is sqlalchemy.sql.sqltypes.String:
            col_length = col_type.length
            if len(value) > col_length:
                return 'String is too long'
            try:
                converted_value = str(value)
            except Exception as e:
                return 'String not valid. {}'.format(e)

        elif type(col_type) is sqlalchemy.sql.sqltypes.Integer:
            try:
                converted_value = int(value)
            except ValueError:
                return 'Invalid integer'

        elif type(col_type) is sqlalchemy.sql.sqltypes.Float:
            try:
                converted_value = float(value)
            except ValueError:
                return 'Invalid float'

        elif type(col_type) is sqlalchemy.sql.sqltypes.DateTime:
            try:
                converted_value = dateutil.parser.isoparse(value)
            except ValueError:
                return 'Invalid date'

        setattr(self, name, converted_value)
        return None
    



        
