import React from "react";
import { VErrorMessage } from "./VErrorMessage";
import '@/VForm/Validation.css';

export const VSelect = ({
    labelText = null,
    inputName,
    inputId = inputName,
    inputValue = null,
    children,
    errorMessage,
    htmlAttributes,
    handleChange,
    displayMode = false,
    className = '',
    disabled = false,
    groupButton = null,
    showErrorMessageAsTooltip = false,
    onClick = null
}) => {
    const classes = ['validated', className];
    if (errorMessage) {
        classes.push('invalid-input invalid-input-select');
        if (showErrorMessageAsTooltip) { htmlAttributes.title = errorMessage; }
    }
    if (displayMode) { classes.push('display-mode'); }

    const input = <select
        id={inputId}
        name={inputName}
        value={inputValue ?? ''}
        onChange={handleChange}
        className={classes.join(' ')}
        disabled={disabled || displayMode}
        {...htmlAttributes}
        onClick={onClick}
    >
        {children}
    </select>;

    let inputGroup = null;
    if (groupButton) {
        inputGroup = <div className="input-group">{input}{groupButton}</div>;
    }

    return (
        <div className="validated-select-div">
            {labelText && <label htmlFor={inputId}>{labelText}</label>}
            {inputGroup || input}
            {errorMessage && !showErrorMessageAsTooltip && <VErrorMessage errorMessage={errorMessage} />}
        </div>
    );
};
