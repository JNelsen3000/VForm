import React, { useId, useState } from "react";
import { VSelect } from "./VSelect";
import '@/components/Validation/Validation.css';

/**
 * Creates a select list that manages its own list of options, fetched as-needed and stored in state.
 * "getSelectList" should return a list of key-value-pairs when awaited.
 */
export const VFormDynamicSelect = ({
    labelText,
    keyPropertyPath,
    inputName = keyPropertyPath,
    inputId = inputName,
    errorMessage,
    handleChange,
    displayMode,
    getSelectList,
    selectedKeyValue = '',
    selectedDisplayValue = null,
    className = 'form-select',
    htmlAttributes = null,
    showErrorMessageAsTooltip = false
}) => {
    const [options, setOptions] = useState(null);
    const listFocused = async () => {
        if (!options) {
            await getSelectList()
                .then(res => setOptions(res));
        }
    };
    const emptyOptionId = useId();
    const getOptions = () => {
        return (<>
            <option key={emptyOptionId} value={''}>---</option>
            {options
                ? options.map(o => {
                    return <option key={o.key} value={o.key}>{o.value}</option>;
                })
                // if selectedId, create option
                : (selectedKeyValue ? <option key={selectedKeyValue} value={selectedKeyValue}>{selectedDisplayValue}</option> : null)
            }
        </>);
    };
    return (
        <VSelect
            labelText={labelText}
            inputName={inputName}
            inputId={inputId}
            inputValue={selectedKeyValue}
            errorMessage={errorMessage}
            handleChange={handleChange}
            displayMode={displayMode}
            className={className}
            showErrorMessageAsTooltip={showErrorMessageAsTooltip}
            propertyPath={keyPropertyPath}
            htmlAttributes={{
                ...htmlAttributes,
                // onClick: listFocused,
                onFocus: listFocused
            }}
        >
            {getOptions()}
        </VSelect>
    );
};
