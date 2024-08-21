import React, { useEffect, useState } from "react";
import '@/VForm/Validation.css';

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

const useValidatedForm = (schema, initialValues = {}, options = {}) => {
    const [uiValues, setUiValues] = useState(JSON.parse(JSON.stringify(initialValues)));
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (options.manualReset !== true) {
            setUiValues(initialValues);
            setErrors({});
        }
    }, [initialValues]);

    const validate = (inputName, val) => {
        let errorMessage = null;
        // schema was built with Validation class for each property that needs validated
        const validator = schema[inputName];
        if (validator) {
            errorMessage = validator.runValidation(val, uiValues);
        }
        // update "errors" object with result
        if (errorMessage) {
            setErrors((prev) => ({
                ...prev,
                [inputName]: errorMessage
            }));
        } else {
            setErrors((prev) => {
                delete prev[inputName];
                return { ...prev };
            });
        }
        return errorMessage;
    };

    const validateAll = () => {
        let valid = true;
        for (const prop in schema) {
            const errorMessage = validate(prop, uiValues[prop]);
            if (errorMessage) {
                valid = false;
            }
        }
        return valid;
    };

    const handleChangeByValueAndName = (value, propName) => {
        if (!options.noValidationOnChange) {
            validate(propName, value);
        }
        setUiValues((prevVals) => ({
            ...prevVals,
            [propName]: value
        }));
    };
    // accepts onChange event and parses out "name" and "value" from the target.name and target.value (or target.checked if checkbox)
    // checks schema for validator and validates if there is an entry.  finally, updates "uiValues".
    const handleChange = (e) => {
        e.persist();
        const name = e.target.name;
        const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        if (!options.noValidationOnChange) {
            validate(name, val);
        }
        setUiValues((prevVals) => ({
            ...prevVals,
            [name]: val
        }));
    };
    /**
     * Sets a property as invalid and displays provided message
     * @param {*} propName The property to mark as invalid
     * @param {*} message The error message to display
     */
    const setPropertyError = (propName, message) => {
        setErrors((prev) => ({
            ...prev,
            [propName]: message
        }));
    };
    /**
     * Helper method to set up VFormControl
     * @returns Properties and methods required for VFormControl
     */
    const registerVFormControl = ({
        propertyName,
        labelText,
        type = 'text',
        inputId = propertyName
    }) => {
        const result = {
            handleChange,
            handleChangeByValueAndName,
            inputName: propertyName,
            type,
            inputId: inputId ?? propertyName,
            inputValue: uiValues[propertyName] ?? '',
            errorMessage: errors[propertyName],
            labelText
        };
        return result;
    };
    /**
     * Helper method to set up input that uses a key value and a display value, such as VSelect
     * @returns Methods and properties required for validation
     */
    const registerInputWithDisplayValue = ({
        keyPropertyName,
        displayPropertyName,
        labelText,
        inputId = keyPropertyName
    }) => {
        const result = {
            handleChange,
            handleChangeByValueAndName,
            keyPropertyName,
            inputName: keyPropertyName,
            displayPropertyName,
            inputId: inputId ?? keyPropertyName,
            selectedKeyValue: uiValues[keyPropertyName] ?? '',
            selectedDisplayValue: uiValues[displayPropertyName] ?? '',
            errorMessage: errors[keyPropertyName],
            labelText
        };
        return result;
    };

    const clearErrors = () => {
        setErrors({});
    };

    const clearError = (property) => {
        if (!property) { return; }
        setErrors(prevVals => {
            delete prevVals[property];
            return { ...prevVals };
        });
    };

    const resetForm = (newInitialValues = {}) => {
        setUiValues(newInitialValues);
        clearErrors();
    };

    return {
        uiValues,
        errors,
        clearErrors,
        clearError,
        resetForm,
        setPropertyError,
        handleChange,
        handleChangeByValueAndName,
        validateAll,
        validate,
        registerVFormControl,
        registerInputWithDisplayValue
    };
};

const useValidatedList = (schemaPerItem, listValidator = null, initialValues = [], options = {}) => {
    const listValidationKeyPropertyName = 'validationKeyProperty';

    const [uiValues, setUiValues] = useState(
        JSON.parse(JSON.stringify(initialValues.map(x => {
            if (!x[listValidationKeyPropertyName]) {
                x[listValidationKeyPropertyName] = crypto.randomUUID();
            }
            return x;
        })))
    );
    const [errorObjects, setErrorObjects] = useState(uiValues.map(x => ({ errors: {}, [listValidationKeyPropertyName]: x[listValidationKeyPropertyName] })));
    const [listError, setListError] = useState();

    const addItem = (item) => {
        item[listValidationKeyPropertyName] = crypto.randomUUID();
        setUiValues(prevVals => ([
            ...prevVals,
            item
        ]));
        setErrorObjects(prevVals => ([
            ...prevVals,
            {
                [listValidationKeyPropertyName]: item[listValidationKeyPropertyName],
                errors: {}
            }
        ]));
    };

    const removeItem = (item) => {
        const itemKey = item[listValidationKeyPropertyName];
        setUiValues(prevVals => ([
            ...prevVals.filter(x => x[listValidationKeyPropertyName] != itemKey)
        ]));
        setErrorObjects(prevVals => ([
            ...prevVals.filter(x => x[listValidationKeyPropertyName] != itemKey)
        ]));
    };

    const validate = (inputName, val, item) => {
        const itemKey = item[listValidationKeyPropertyName];
        let errorMessage = null;
        // schema was built with Validation class for each property that needs validated
        const validator = schemaPerItem[inputName];
        if (validator) {
            errorMessage = validator.runValidation(val, item);
        }
        // update "errors" object with result
        if (errorMessage) {
            setErrorObjects((prevVals) => ([
                ...prevVals.filter(x => x[listValidationKeyPropertyName] != itemKey),
                {
                    [listValidationKeyPropertyName]: itemKey,
                    errors: {
                        ...prevVals.find(x => x[listValidationKeyPropertyName] == itemKey).errors,
                        [inputName]: errorMessage
                    }
                }
            ]));
        } else {
            setErrorObjects(prevVals => {
                const errorObject = prevVals.find(x => x[listValidationKeyPropertyName] == itemKey);
                delete errorObject.errors[inputName];
                return [
                    ...prevVals.filter(x => x[listValidationKeyPropertyName] != itemKey),
                    {
                        [listValidationKeyPropertyName]: itemKey,
                        errors: {
                            ...errorObject.errors
                        }
                    }
                ];
            });
        }
        return errorMessage;
    };

    const validateList = () => {
        const listError = listValidator.runValidation(uiValues);
        setListError(listError);
        return listError;
    };

    const validateAll = () => {
        let valid = true;
        for (const prop in schemaPerItem) {
            uiValues.forEach(val => {
                const errorMessage = validate(prop, val[prop], val);
                if (errorMessage) {
                    valid = false;
                }
            });
        }
        if (listValidator) {
            const listError = validateList();
            if (listError) {
                valid = false;
            }
        }
        return valid;
    };

    const handleListChange = (e, item) => {
        e.persist();
        const name = e.target.name;
        const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        handleListChangeByValueAndName(val, name, item);
    };

    const handleListChangeByValueAndName = (value, propName, item) => {
        const itemKey = item[listValidationKeyPropertyName];
        if (!options.noValidationOnChange) {
            validate(propName, value, item);
        }
        setUiValues((prevVals) => ([
            ...prevVals.filter(x => x[listValidationKeyPropertyName] != itemKey),
            {
                ...prevVals.find(x => x[listValidationKeyPropertyName] == itemKey),
                [propName]: value
            }
        ]));
    };

    const setPropertyError = (property, errorMessage, item) => {
        const itemKey = item[listValidationKeyPropertyName];
        setErrorObjects(prevVals => [
            ...prevVals.filter(x => x[listValidationKeyPropertyName] != itemKey),
            {
                [listValidationKeyPropertyName]: itemKey,
                errors: {
                    ...prevVals.find(x => x[listValidationKeyPropertyName] == itemKey).errors,
                    [property]: errorMessage
                }
            }
        ]);
    };

    const clearPropertyError = (property, item) => {
        const itemKey = item[listValidationKeyPropertyName];
        setErrorObjects(prevVals => {
            const errorObject = prevVals.find(x => x.id == itemKey);
            delete errorObject[property];
            return [
                ...prevVals.filter(x => x.id != itemKey),
                {
                    ...errorObject
                }
            ];
        });
    };

    const resetList = (newInitialValues = []) => {
        if (newInitialValues.some(x => !x[listValidationKeyPropertyName])) { throw new Error('Each item in validated list requires a unique key property whose name matches the passed-in "validationKeyPropertyName" (or "id" by default).'); }
        const newVals = JSON.parse(JSON.stringify(newInitialValues));
        setUiValues(newVals);
        setErrorObjects(newVals.map(x => ({
            errors: [],
            id: x[listValidationKeyPropertyName]
        })));
    };

    const getErrorObjectForItem = (item) => {
        return errorObjects.find(x => x[listValidationKeyPropertyName] == item[listValidationKeyPropertyName]).errors;
    };

    useEffect(() => {
        if (listError) {
            validateList();
        }
    }, [uiValues]);

    return {
        uiValues,
        listError,
        handleListChange,
        handleListChangeByValueAndName,
        addItem,
        removeItem,
        setPropertyError,
        clearPropertyError,
        validateAll,
        resetList,
        getErrorObjectForItem,
        listValidationKeyPropertyName
    };
};

export {
    VForm,
    useValidatedForm,
    useValidatedList
};
