/* eslint-disable react/no-unknown-property */
import React from 'react';
import { VErrorMessage } from './VErrorMessage';
import '@/components/Validation/Validation.css';
import { format, parseISO } from 'date-fns';

export const VFormControl = ({
    labelText = null,
    type,
    propertyPath,
    inputName = propertyPath,
    inputId = inputName,
    inputValue = null,
    errorMessage,
    htmlAttributes = {},
    handleChange,
    displayMode = false,
    disabled = false,
    className = null,
    labelClassName = null,
    labelAttributes = null,
    showErrorMessageAsTooltip = false
}) => {
    if (showErrorMessageAsTooltip) { htmlAttributes.title = errorMessage ?? htmlAttributes.title; }

    const errorElement = showErrorMessageAsTooltip ? null : <VErrorMessage errorMessage={errorMessage} />;

    const classes = ['validated', `validated-${type}`, className];
    if (errorMessage != null) { classes.push(`invalid-input invalid-input-${type}`); }
    if (displayMode) {
        classes.push('display-mode');
        if (htmlAttributes.title) { htmlAttributes.title += '  You may not edit this field.'; } else { htmlAttributes.title = 'You may not edit this field.'; }
    }
    
    let input;
    switch (type) {
        case 'checkbox':
            input = (
                <input
                    disabled={displayMode || disabled}
                    checked={!!inputValue}
                    id={inputId}
                    name={inputName}
                    onChange={handleChange}
                    className={classes.join(' ')}
                    type="checkbox"
                    propertypath={propertyPath}
                    {...htmlAttributes}
                />
            );
            break;
        case 'date':
        {
            const val = parseISO(inputValue);
            const displayVal = (val == 'Invalid Date' ? '' : format(val, 'yyyy-MM-dd'));
            input = (
                <input
                    readOnly={displayMode}
                    value={displayVal ?? ''}
                    id={inputId}
                    name={inputName}
                    onChange={handleChange}
                    type={type}
                    className={classes.join(' ')}
                    propertypath={propertyPath}
                    {...htmlAttributes}
                />
            );
            break;
        }
        default:
            input = (
                <input
                    readOnly={displayMode}
                    disabled={disabled}
                    value={inputValue ?? ''}
                    id={inputId}
                    name={inputName}
                    onChange={handleChange}
                    type={type}
                    className={classes.join(' ')}
                    propertypath={propertyPath}
                    {...htmlAttributes}
                />
            );
    }
    return (
        <div className={"validated-form-control-div " + (type == "check" ? ' form-check' : '')}>
            {labelText && <label htmlFor={inputId} className={labelClassName} {...labelAttributes} >{labelText}</label>}
            {input}
            {errorElement}
        </div>
    );
};
