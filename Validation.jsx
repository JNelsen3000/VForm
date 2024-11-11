import React, { useEffect, useState } from "react";
import '@/components/Validation/Validation.css';

const VForm = ({ validateAll, onSubmit, children }) => {
    const handleSubmit = (e) => {
        e.preventDefault();
        const isValid = validateAll();
        if (isValid) {
            onSubmit();
        };
    };
    return (
        <form noValidate={true} onSubmit={handleSubmit}>
            {children}
        </form>
    );
};

// reducer used to edit formValues by propertyPath, called recursively to manage dynamic object depth
const replaceNestedProp = (remainingPathItems, changeValue, oldEntity) => {
    const currentProp = remainingPathItems.shift();
    if (remainingPathItems.length == 0) { // item is at end of path
        if (!isNaN(currentProp)) {
            // if prop is a number, it is an index in an array
            const currentPropAsNum = parseInt(currentProp);
            if (!oldEntity) { return [changeValue]; }
            return [
                ...oldEntity.slice(0, currentPropAsNum),
                changeValue,
                ...oldEntity.slice(currentPropAsNum + 1)
            ];
        }
        // item is a property in an object
        if (!oldEntity) { return { [currentProp]: changeValue }; }
        return {
            ...oldEntity,
            [currentProp]: changeValue
        };
    }
    if (!isNaN(currentProp)) {
        // if prop is number, it is an index and the item is in an array.
        const currentPropAsNum = parseInt(currentProp);
        const result = [
            ...oldEntity.slice(0, currentPropAsNum),
            replaceNestedProp(remainingPathItems, changeValue, oldEntity.slice(currentPropAsNum, currentPropAsNum + 1)[0]),
            ...oldEntity.slice(currentPropAsNum + 1)
        ];
        return result;
    } else {
        // item is a property in an object
        return {
            ...oldEntity,
            [currentProp]: replaceNestedProp(remainingPathItems, changeValue, oldEntity[currentProp])
        };
    }
};
// if no default values provided, create shallow default object based on schema with nested arrays initialized
const getDefaultValues = (remainingSchema) => {
    const result = {};
    Object.keys(remainingSchema).forEach(propName => {
        const validator = remainingSchema[propName];
        if (validator && validator.type == 'array') {
            result[propName] = [];
        } else {
            result[propName] = undefined;
        }
    });
    return result;
};

const useVForm = (schema, defaultValues = null) => {
    const [formValues, setFormValues] = useState(() => {
        if (defaultValues) { return JSON.parse(JSON.stringify(defaultValues)); };
        const result = getDefaultValues(schema);
        return result;
    });
    // lists whose children have changed and need re-evaluated
    const [listsPendingValidation, setListsPendingValidation] = useState([]);
    // create array of errors for array validation based off of default values if they exist
    const addErrorArray = (itemSchema, values = []) => {
        const result = [];
        values.forEach(val => {
            const errorObject = { };
            Object.keys(itemSchema).forEach(propName => {
                const validator = itemSchema[propName];
                if (validator && validator.type == 'array') {
                    errorObject[propName] = addErrorArray(validator.itemSchema, val[propName]);
                }
            });
            result.push(errorObject);
        });
        return result;
    };
    // initialize errors object mimicking the schema by adding arrays where needed
    const [errors, setErrors] = useState(() => {
        const errorsObject = {};
        Object.keys(schema).forEach(propName => {
            const validator = schema[propName];
            if (validator && validator.type == 'array') {
                errorsObject[propName] = addErrorArray(validator.itemSchema, defaultValues ? defaultValues[propName] : undefined);
            }
        });
        return errorsObject;
    });
    const [listErrors, setListErrors] = useState({});

    /** handles html input onChange events from inputs registered with form */
    const handleChange = (onChangeEvent) => {
        const propertyPath = onChangeEvent.target.attributes.propertypath.value;
        const value = onChangeEvent.target.type == 'checkbox' ? onChangeEvent.target.checked : onChangeEvent.target.value;
        handleChangeByPropertyPathAndValue(propertyPath, value);
    };

    const handleChangeByPropertyPathAndValue = (propertyPath, value) => {
        setFormValueByPropertyPath(propertyPath, value);
        runValidationOnInput(propertyPath, value);

        const parentListsToRevalidate = Object.keys(listErrors)
            .filter(listName => listErrors[listName]) // error exists
            .filter(listName => propertyPath.split('.').includes(listName)) // property is descendant of list
            .filter(listName => !listsPendingValidation.some(list => list.name == listName)); // list is not already pending re-validation
        setListsPendingValidation(parentListsToRevalidate
            .map(x => ({
                name: x,
                path: propertyPath.substring(0, propertyPath.lastIndexOf(x) + x.length)
            })));
    };

    const setFormValueByPropertyPath = (propertyPath, value) => {
        let pathItems;

        if (Array.isArray(propertyPath)) {
            pathItems = propertyPath.flatMap(item =>
                typeof item === 'string' && item.includes('.') ? item.split('.') : item
            );
        } else if (typeof propertyPath === 'string') {
            pathItems = propertyPath.split('.');
        } else {
            console.error('Invalid propertyPath:', propertyPath);
            return;
        }

        setFormValues(prevVals => {
            const result = replaceNestedProp(pathItems, value, prevVals);
            return result;
        });
    };
    /**
     * Adds new item to dynamic array
     * @param {*} pathToArray Path to array
     * @param {*} defaultValue If item has nested arrays, the default value should have empty arrays for each nested array property
     */
    const addArrayItem = (pathToArray, defaultValue = {}) => {
        addArrayItems(pathToArray, [defaultValue]);
    };

    const replaceAllArrayItems = (propertyPath, newItems = []) => {
        setErrorByPath(propertyPath, null);
        setFormValueByPropertyPath(propertyPath, []);

        addArrayItems(propertyPath, newItems);
    };

    const addArrayItems = (pathToArray, items) => {
        const existingArray = getValueByPath(pathToArray, formValues);
        let newIndex = existingArray ? existingArray.length : 0;

        items.forEach(val => {
            setFormValueByPropertyPath(pathToArray + `.${newIndex}`, val);
            const errorObject = {};
            Object.keys(val).forEach(k => {
                const propVal = val[k];
                if (typeof (propVal) == 'object' && val.constructor.name == 'Array') {
                    errorObject[k] = [];
                }
            });
            setErrorByPath(pathToArray + `.${newIndex}`, errorObject);
            newIndex++;
        });

        const parentListsToRevalidate = Object.keys(listErrors)
            .filter(listName => listErrors[listName]) // error exists
            .filter(listName => pathToArray.split('.').includes(listName)) // property is descendant of list
            .filter(listName => !listsPendingValidation.some(list => list.name == listName)); // list is not already pending re-validation
        setListsPendingValidation(parentListsToRevalidate
            .map(x => ({
                name: x,
                path: pathToArray.substring(0, pathToArray.lastIndexOf(x) + x.length)
            })));
    };

    const removeArrayItems = (pathToArray, indexesOfItemsToRemove) => {
        const arrayPathItems = pathToArray.split('.');
        const array = getValueByPath(pathToArray, formValues);
        if (!array) { throw new Error(`Could not find array at path ${pathToArray}.  Ensure propertyPath is spelled correctly and includes index of item to remove.  Provided path: ${pathToArray}.`); }
        const errorArray = getValueByPath(pathToArray, errors);

        indexesOfItemsToRemove
            .sort((a, b) => b - a) // reverse order so splice indexes work
            .forEach(itemIndex => {
                array.splice(itemIndex, 1);
                errorArray.splice(itemIndex, 1);
            });

        handleChangeByPropertyPathAndValue(pathToArray, array);
        setErrors(prevVals => {
            const result = replaceNestedProp(arrayPathItems, errorArray, prevVals);
            return result;
        });

        const parentListsToRevalidate = Object.keys(listErrors)
            .filter(listName => listErrors[listName]) // error exists
            .filter(listName => pathToArray.split('.').includes(listName)) // property is descendant of list
            .filter(listName => !listsPendingValidation.some(list => list.name == listName)); // list is not already pending re-validation
        setListsPendingValidation(parentListsToRevalidate
            .map(x => ({
                name: x,
                path: pathToArray.substring(0, pathToArray.lastIndexOf(x) + x.length)
            })));
    };

    /** Removes array item by propertyPath.  Path must include index, i.e.: 'Toplevel.List.0' */
    const removeArrayItem = (propertyPath) => {
        if (!propertyPath) { throw new Error('No propertyPath provided at removeArrayItem call.'); }
        const itemIndex = parseInt(propertyPath.substring(propertyPath.length - 1));
        if (isNaN(itemIndex)) { throw new Error(`No index found at end of propertyPath: ${propertyPath}.  Be sure to end path with index of item to remove.`); }
        // get path to array excluding index and "."
        const pathToArray = propertyPath.substring(0, propertyPath.length - itemIndex.toString().length - 1);
        removeArrayItems(pathToArray, [itemIndex]);
    };
    const getValidatorByPath = (path) => {
        const nextLevel = (remainingPathItems, schema) => {
            let validator;
            if (remainingPathItems.length === 1) {
                validator = schema.itemSchema ? schema.itemSchema[remainingPathItems[0]] : schema[remainingPathItems[0]];
            } else {
                const currentProp = remainingPathItems.shift();
                const nextLevelValidator = schema.type === 'array' ? schema.itemSchema[currentProp] : schema[currentProp];
                if (remainingPathItems.length === 1) {
                    validator = nextLevelValidator.itemSchema ? nextLevelValidator.itemSchema[remainingPathItems[0]] : nextLevelValidator[remainingPathItems[0]];
                } else {
                    validator = nextLevel(remainingPathItems, nextLevelValidator);
                }
            }
            return validator;
        };

        let pathItems;

        if (Array.isArray(path)) {
            pathItems = path.flatMap(item =>
                typeof item === 'string' && item.includes('.') ? item.split('.') : item
            );
        } else if (typeof path === 'string') {
            pathItems = path.split('.').filter(x => isNaN(x));
        } else {
            console.error('Invalid path:', path);
            return;
        }

        return nextLevel(pathItems, schema);
    }; // validates input, setting or clearing error as needed
    const runValidationOnInput = (path, value) => {
        const validator = getValidatorByPath(path);
        if (validator) {
            let error = null;
            if (validator.isNestedListValidatorChild && validator.validateWithListItemRules.length) {
                // target is property of nested list item, may require the list item during validation
                const pathItems = path.split('.');
                pathItems.pop();
                const pathToItem = pathItems.join('.');
                const listItem = getValueByPath(pathToItem, formValues);
                error = validator.runValidation(value, listItem);
            } else {
                error = validator.runValidation(value);
            }
            setErrorByPath(path, error);
            return error;
        }
        return null;
    };

    const setErrorByPath = (path, error) => {
        let pathItems;

        if (Array.isArray(path)) {
            pathItems = path.flatMap(item =>
                typeof item === 'string' && item.includes('.') ? item.split('.') : item
            );
        } else if (typeof path === 'string') {
            pathItems = path.split('.');
        } else {
            console.error('Invalid path:', path);
            return;
        }

        setErrors(prevVals => {
            const result = replaceNestedProp(pathItems, error, prevVals);
            return result;
        });
    };

    const getErrorByPath = (path) => {
        return getValueByPath(path, errors);
    };
    // errors object contains no arrays except for nestedItem arrays.
    const getNestedEntityHasErrors = (path) => {
        const entityErrorObj = getValueByPath(path, errors);
        const itemIsValid = (item) => {
            let valid = true;
            const vals = Object.values(item);
            for (let i = 0; i < vals.length; i++) {
                const prop = vals[i];
                if (prop == null) { continue; }
                if (prop != null && typeof prop == 'object' && prop.constructor.name == 'Array') {
                    let arrayIsValid = true;
                    for (let j = 0; j < prop.length; j++) {
                        if (!itemIsValid(prop[j])) {
                            arrayIsValid = false;
                            break;
                        }
                    }
                    if (!arrayIsValid) { valid = false; break; };
                } else {
                    valid = false;
                    break;
                }
            }
            return valid;
        };
        return !itemIsValid(entityErrorObj);
    };
    // sets error for nested list as a whole, not for an item in a nested list
    const setListError = (listName, error) => {
        setListErrors(prevVals => ({
            ...prevVals,
            [listName]: error
        }));
    };
    // validates nested list as a whole and each item in list
    const validateArraySchema = (arraySchema, values, pathPrefix = '') => {
        const pathItems = arraySchema.propertyPath.split('.');
        const listName = pathItems[pathItems.length - 1];
        const items = getValueByPath(listName, values) ?? [];
        let arrayIsValid = true;
        const arrayError = arraySchema.runValidation(items);
        if (arrayError) { arrayIsValid = false; }
        setListError(listName, arrayError);
        Object.keys(arraySchema.itemSchema).forEach(itemPropertyName => {
            const validator = arraySchema.itemSchema[itemPropertyName];
            if (validator.type !== 'array') {
                items.forEach((item, itemIndex) => {
                    const error = validator.runValidation(item[itemPropertyName], item);
                    setErrorByPath(`${pathPrefix + listName}.${itemIndex}.${itemPropertyName}`, error);
                    if (error) { arrayIsValid = false; }
                });
            } else {
                let nestedArrayIsValid = true;
                items.forEach((item, itemIndex) => {
                    const itemIsValid = validateArraySchema(validator, item, `${pathPrefix + listName}.${itemIndex}.`);
                    if (!itemIsValid) { nestedArrayIsValid = false; }
                });
                if (!nestedArrayIsValid) { arrayIsValid = false; }
            }
        });
        return arrayIsValid;
    };

    const validateAll = () => {
        let valid = true;
        Object.keys(schema).forEach(propName => {
            const validator = schema[propName];
            if (validator.type !== 'array') {
                const error = runValidationOnInput(propName, formValues[propName]);
                if (error) { valid = false; }
            } else {
                const validArray = validateArraySchema(validator, formValues);
                if (!validArray) { valid = false; }
            }
        });
        return valid;
    };
    /** Returns properties required for HTML inputs.  Properties are: onChange, propertypath, type, error, and value.  propertypath is a custom attribute required for validation.
     */
    const getInputProperties = (propertyPath, type = 'text') => {
        const value = getValueByPath(propertyPath, formValues) ?? '';
        return {
            onChange: handleChange,
            propertypath: propertyPath,
            type,
            value
        };
    };
    /** Returns properties required for VFormControl.  Properties are: handleChange, propertyPath, type, errorMessage, and inputValue. */
    const registerVFormControl = (propertyPath, type = 'text') => {
        const inputProps = getInputProperties(propertyPath, type);
        const error = getErrorByPath(propertyPath);

        return {
            handleChange: inputProps.onChange,
            handleChangeByPropertyPathAndValue,
            propertyPath,
            type,
            errorMessage: error,
            inputValue: inputProps.value
        };
    };
    const registerDateRangeControl = (startDatePropertyPath, endDatePropertyPath) => {
        const startDateErrorMessage = getValueByPath(startDatePropertyPath, errors);
        const endDateErrorMessage = getValueByPath(endDatePropertyPath, errors);
        const startDateValue = getValueByPath(startDatePropertyPath, formValues);
        const endDateValue = getValueByPath(endDatePropertyPath, formValues);

        return {
            handleChangeByPropertyPathAndValue,
            startDatePropertyPath,
            endDatePropertyPath,
            errorMessage: startDateErrorMessage ?? endDateErrorMessage,
            startDateValue,
            endDateValue
        };
    };
    const registerVFormControlWithDisplayValue = (keyPropertyPath, displayPropertyPath) => {
        const errorMessage = getValueByPath(keyPropertyPath, errors);
        const selectedKeyValue = getValueByPath(keyPropertyPath, formValues) ?? '';
        const selectedDisplayValue = getValueByPath(displayPropertyPath, formValues) ?? '';
        return {
            handleChange,
            handleChangeByPropertyPathAndValue,
            keyPropertyPath,
            displayPropertyPath,
            errorMessage,
            selectedKeyValue,
            selectedDisplayValue
        };
    };
    // retrieves item in provided object by the provided path
    const getValueByPath = (propertyPath, fromObject) => {
        const remainingPathItems = propertyPath.split('.');
        if (remainingPathItems.length == 1) {
            return fromObject[propertyPath];
        }
        const nextLevel = (remainingPathItems, nextObject) => {
            const currentProp = remainingPathItems.shift();
            if (remainingPathItems.length == 1) {
                if (!nextObject || !nextObject[currentProp]) {
                    console.error(`no next object or next object ${currentProp} in nested "getValueByPath".  path: ${propertyPath}, remainingPathItems: ${remainingPathItems.join(', ')}`);
                }
                return nextObject[currentProp][remainingPathItems[0]];
            } else {
                if (!nextObject) {
                    console.error(`no next object in nested "getValueByPath".  path: ${propertyPath}, remainingPathItems: ${remainingPathItems.join(', ')}`);
                }
                return nextLevel(remainingPathItems, nextObject[currentProp]);
            }
        };
        return nextLevel(remainingPathItems, fromObject);
    };
    // clears errors and values.  uses newValues if provided
    const resetForm = (newValues = null) => {
        setFormValues(() => {
            if (newValues) { return JSON.parse(JSON.stringify(newValues)); };
            const result = getDefaultValues(schema);
            return result;
        });
        setErrors(() => {
            const errorsObject = {};
            Object.keys(schema).forEach(propName => {
                const validator = schema[propName];
                if (validator && validator.type == 'array') {
                    errorsObject[propName] = addErrorArray(validator.itemSchema, newValues ? newValues[propName] : undefined);
                }
            });
            return errorsObject;
        });
    };
    // when a nestedList with an error has a change to a child
    useEffect(() => {
        listsPendingValidation
            .reduce((acc, val) => {
                if (acc.some(list => list.name == val.name)) { return acc; }
                acc.push(val);
                return acc;
            }, [])
            .forEach(nameAndPath => {
                const listValidator = getValidatorByPath(nameAndPath.path);
                if (listValidator && listErrors[nameAndPath.name]) {
                    console.log('running listValidator on ' + nameAndPath.name);
                    const value = getValueByPath(nameAndPath.path, formValues);
                    const error = listValidator.runValidation(value);
                    setListError(nameAndPath.name, error);
                }
            });
        if (listsPendingValidation.length) { setListsPendingValidation([]); }
    }, [listsPendingValidation]);

    return {
        /** An object with properties that match all nested lists in schema.  The values are error messages if the lists are invalid. */
        listErrors,
        /** All current values tracked by the form, maintained by the useVForm hook. */
        formValues,
        /** Property path should include indexes if target is within a nested list.  For example, to target the size of first item in "tires" on a "car" object: 'tires.0.size' */
        handleChangeByPropertyPathAndValue,
        /** Property path should include indexes if target is within a nested list.  For example, to target the size of first item in "tires" on a "car" object: 'tires.0.size' */
        setErrorByPath,
        /** Property path should include indexes if target is within a nested list.  For example, to target the size of first item in "tires" on a "car" object: 'tires.0.size' */
        getErrorByPath,
        /** An object matching the structure of the entity with properties that match all invalid form items.  To retrieve nested errors, "getErrorByPath" could be used instead. */
        errors,
        /** Returns true if selected entity is invalid.  Provide the propertyPath of the entity to target. */
        getNestedEntityHasErrors,
        /** Adds new item to nested list, updates "errors", and queues the list for revalidation if list was invalid. */
        addArrayItem,
        /** Adds multiple new items to nested list, updates "errors", and queues the list for revalidation if list was invalid. */
        addArrayItems,
        /** Replaces all items in nested list, updates "errors", and queues the list for revalidation if list was invalid. */
        replaceAllArrayItems,
        /** Removes item from nested list, updates "errors", and queues the list for revalidation if list was invalid. */
        removeArrayItem,
        /** Removes multiple items from nested list, updates "errors", and queues the list for revalidation if list was invalid. */
        removeArrayItems,
        /** Returns "onChange", "type", "value", and "propertypath" (required for useVForm) for use in HTML inputs. */
        getInputProperties,
        /** Returns minimum required properties for VForm components to register with useVForm hook.  "type" defaults to "text". */
        registerVFormControl,
        /** Returns minimum required properties for VForm components with display values to register with useVForm hook. */
        registerVFormControlWithDisplayValue,
        /** Returns minimum required properties for VFormDateRangeInput to register with useVForm hook. */
        registerDateRangeControl,
        /** Runs all validation, used by VForm component. */
        validateAll,
        /** Clears all errors and form values.  Optionally replaces form values with provided new values. */
        resetForm
    };
};

export {
    VForm,
    useVForm
};
