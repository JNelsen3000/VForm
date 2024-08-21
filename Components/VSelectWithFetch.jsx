import React, { useId, useState } from "react";
import { VSelect } from "./VSelect";
import '@/VForm/Validation.css';

export const VSelectWithFetch = ({
    labelText,
    inputName,
    inputId = inputName,
    errorMessage,
    handleChange,
    displayMode,
    getSelectList,
    selectedKeyValue = '',
    selectedDisplayValue = null,
    className = '',
    htmlAttributes = null,
    showErrorMessageAsTooltip = false,
    loadingMessage
}) => {
    const [options, setOptions] = useState(null);
    const [isFetchingOptions, setIsFetchingOptions] = useState(false);
    const listFocused = async () => {
        if (!options) {
            setIsFetchingOptions(true);
            await getSelectList()
                .then(res => setOptions(res)).finally(() => { setIsFetchingOptions(false); });
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
        <div style={{ position: 'relative' }}>
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
                htmlAttributes={{
                    ...htmlAttributes,
                    onFocus: listFocused
                }}
            >
                {getOptions()}
            </VSelect>
            {isFetchingOptions && <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'absolute',
                    top: '60%'
                }}
            >
              {loadingMessage}
            </div>}
        </div>
    );
};
