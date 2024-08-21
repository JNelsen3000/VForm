# VForm
React Form Validation made easy!

  This library will handle form state management and validation, while giving you total control and letting you easily add your own custom logic to the process.  By default, the form will run all validation on form submission and prevent the submit from succeeding if any validation checks fail.

## Step one: Create a schema.

The schema object should be an object with properties that correspond to whichever properties require validation. Assign a "Validator" to each property and call the desired function(s) to set up validation.  For example:
```
const schema = {
  requiredProp: new Validator().required(),
  propWithMinValue: new Validator().min(10),
  propWithSeveralRules: new Validator().required().minLength(12).maxLength(45)
}
```
      
Each rule has a default error message, but can receive a custom one.  If the rule requires an argument, just pass in the custom error message after it.  For example:
```
const schema = {
  propWithCustMessage: new Validator().required('You really need this property'),
  propWithParameterAndMessage: new Validator().min(5, 'This needs to be at least 5')
}
```
Custom validation can easily be set up, which is useful for including current values from the jsx component holding the form.  It will receive the value from the input and should return null if valid or an error message (string) if invalid.  For example:
```
const schema = {
  propWithCustomValidation: new Validator().required().custom((val) => {
    if (val != 'what i want') { return 'This is not what i want'; }
    return null;
  })
}
```
## Step two: Call the hook.

Call the "useValidatedForm" hook, passing in the schema object and the entity that the form is viewing/editing/creating.  The "useValidatedForm" hook will return "uiValues", "errors", "handleChange", "handleChangeByValueAndName", "validateAll" and more.  You may optionally pass in an "options" parameter.  This "options" parameter supports the following:

- "manualReset": a bool telling the form not to reset automatically when the entity prop changes.  Defaults to false.
- "noValidationOnChange": a bool telling the form not to validate onChange, only onSubmit.  Defaults to false.

Returned by the "useValidatedForm" hook:
- "uiValues" is the object that holds the current values for the form, separate from the initial values which will remain unchanged.
- "errors" is an object that will track invalid inputs.  if an input is invalid, the "errors" object will have a property with the same name as the property assigned to the input.  The value will be the relevant error message.  For example, if the 'name' property must not be longer than 5 characters and it's value is 'abcdefgh', the errors object could look like this:
           `{ name: 'Name must not be longer than 5 characters' }`
- "handleChange", and "handleChangeByValueAndName" are methods to allow the form to continue tracking all values.  Use these in the components placed in the form later.
- "clearErrors" and "clearError" allow you to manually clear all errors or a single error by propname.
- "setPropertyError" allows you to manually set an error message for a property.  Pass in the prop name and an error message.
- "resetForm" can be called to manually reset the form, passing in any new initial values.
- "validate" lets you force the form to validate a specific field.  Pass in the prop name and value.
- "registerVFormControl" allows you to easily register a VFormControl by returning a set of commonly used properties for you.
- "registerInputWithDisplayValue" is similar to "registerVFormControl", with a couple other properties unique to inputs that also use a display value.  Examples for each are shown in step 3 below.  NOTE: IT WILL NOT RETURN HTMLATTRIBUTES.
- "validateAll" will be provided to the form to allow it to run validation against all inputs on submit.  It can also be called manually.

"useValidatedForm" example:
```
// without options
const { validateAll, handleChange, handleChangeByValueAndName, uiValues, errors } = useValidatedForm(schema, entity);

// with options
const options = { manualReset: true, noValidationOnChange: true };
const { validateAll, handleChange, handleChangeByValueAndName, uiValues, errors } = useValidatedForm(schema, entity, options);
```
# Step three: Add components.
Nest the desired components within a "VForm" component.  The "VForm" should receive "validateAll" and an "onSubmit" handler. This handler will receive an object with all values contained in the form.  it will only be called when all validation passes.
Example:
```
<Vform validateAll={validateAll} onSubmit={mySubmitHandler}>
  <VFormControl
    labelText={myLabel}
    inputName={myInputName}
    type={'text'}
    inputValue={uiValues.myInputName}
    errorMessage={errors.myInputName}
    handleChange={handleChange}
  />
</VForm>
```
The options for components are "VFormControl", "VSelect", "VDateRange", "VUTCDateTimeInput", "VSelectListWithDynamicOptions", "VComboDropdownWithDynamicOptions", and "VComboDropdownWithStaticOptions".

Another option for more easily setting up VFormControls is by using the "registerVFormControl" function returned by the useValidatedForm hook.  It automatically sets the following properties:
- labelText,
- inputName,
- type,
- inputValue,
- errorMessage,
- handleChange,
- handleChangeByValueAndName

Simply pass in 'propertyName', optional 'labelText', and 'type'.  'type' defaults to 'text', so if your VFormControl is a text input, the 'type' parameter is also optional.  Other properties can still be manually set after the register function.

Note: Since these properties also work with VUTCDateTimeInput and VSelect, "registerVFormControl" works with them as well.

Examples:
```
<VFormControl
  {...registerVFormControl({ propertyName: 'myTextProp', labelText: 'My Text Label' })}
  displayMode={true}
/>
<VFormControl
  {...registerVFormControl({ propertyName: 'myNumberProp', labelText: 'My Number Label', type: 'number' })}
  displayMode={false}
/>
<VFormControl
  {...registerVFormControl({ propertyName: 'myTextPropWithNoLabel' })}
  htmlAttributes={ readOnly: true }
/>
```        
Similarly, the "registerInputWithDisplayValue" can quickly set up V-components that have a linked display property, such as "VSelectListWithDynamicOptions", "VComboDropdownWithDynamicOptions", and "VComboDropdownWithStaticOptions".  "registerInputWithDisplayValue" returns the following:
- handleChange,
- handleChangeByValueAndName,
- keyPropertyName,
- inputName,
- displayPropertyName,
- inputId,
- selectedKeyValue,
- selectedDisplayValue,
- errorMessage,
- labelText

Example:
```
<VSelectListWithDynamicOptions
  {...registerInputWithDisplayValue({ keyPropertyName: 'keyProp', displayPropertyName: 'displayProp', labelText: 'I Have a Display Value' })}
/>
```

Complete example:
```
    const exampleEntity = {
        requiredProp: 'test',
        propWithMinValue: 5,
        propWithMaxValue: 6,
        complexProp: 'abcdefg',
        propWithCustomLogic: 'doggo',
        unvalidatedProp: 'anything goes',
        propWithCustomErrorMessage: 'my message'
    }

    const handleSubmit = () => { console.log(uiValues); } // called on form submit IF all validation passes

    const schema = {
        requiredProp: new Validator().required(),
        propWithMinValue: new Validator().min(0),
        propWithMaxValue: new Validator().max(10),
        complexProp: new Validator().minLength(6).maxLength(8).required(),
        propWithCustomLogic: new Validator().custom((val) => {
            if (val != 'doggo') {
                return 'Must be "doggo"';
            }
            return null;
        }),
        propWithCustomErrorMessage: new Validator().required('I really need you to fill this one in')
    }

    const { uiValues, errors, handleChange, handleChangeByValueAndName, validateAll} = useValidatedForm(schema, exampleEntity);

    return (
        <VForm validateAll={validateAll} onSubmit={handleSubmit}>
            <VFormControl
                labelText={'This is required'}
                inputName={'requiredProp'}
                inputValue={uiValues.requiredProp} // value comes from "uiValues", not from "exampleEntity"
                errorMessage={errors.requiredProp}
                handleChange={handleChange}
                type={'text'}
            />
            <VFormControl
                labelText={'Above zero'}
                inputName={'propWithMinValue'}
                inputValue={uiValues.propWithMinValue}
                errorMessage={errors.propWithMinValue}
                handleChange={handleChange}
                type={'number'}
            />
            <VFormControl
                labelText={'Below 10'}
                inputName={'propWithMaxValue'}
                inputValue={uiValues.propWithMaxValue}
                errorMessage={errors.propWithMaxValue}
                handleChange={handleChange}
                type={'number'}
            />
            <VFormControl
                labelText={'Between 6 and 8 characters long, and is required.'}
                inputName={'complexProp'}
                inputValue={uiValues.complexProp}
                errorMessage={errors.complexProp}
                handleChange={handleChange}
                type={'text'}
            />
            <VSelect
                labelText={'Pick the doggo'}
                inputName={'propWithCustomLogic'}
                inputValue={uiValues.propWithCustomLogic}
                errorMessage={errors.propWithCustomLogic}
                handleChange={handleChange}
            >
                <option value={''}>---</option>
                <option value={'kitteh'}>Kitteh</option>
                <option value={'doggo'}>Doggo</option>
                <option value={'rock'}>A rock</option>
            </VSelect>
            <VFormControl
                labelText={'Not validated'}
                inputName={'unvalidatedProp'}
                inputValue={uiValues.unvalidatedProp}
                errorMessage={errors.unvalidatedProp}
                handleChange={handleChange}
                type={'text'}
                displayMode={true}
            />
        </VForm>
    )
```

    Above form inputs could be simplified by using the "registerVFormControl" method from "useValidatedForm":

        <VForm validateAll={validateAll} onSubmit={handleSubmit}>
            <VFormControl
                {...registerVFormControl({ propertyName: 'requiredProp', labelText: 'This is required' })}
            />
            <VFormControl
                {...registerVFormControl({ propertyName: 'propWithMinValue', labelText: 'Above zero', type: 'number' })}
            />
            <VFormControl
                {...registerVFormControl({ propertyName: 'propWithMaxValue', labelText: 'Below 10', type: 'number' })}
            />
            <VFormControl
                {...registerVFormControl({
                    propertyName: 'complexProp',
                    labelText: 'Between 6 and 8 characters long, and is required'
                })}
            />
            <VSelect
                {...registerVFormControl({ propertyName: 'propWithCustomLogic', labelText: 'Pick the doggo' })}
            >
                <option value={''}>---</option>
                <option value={'kitteh'}>Kitteh</option>
                <option value={'doggo'}>Doggo</option>
                <option value={'rock'}>A rock</option>
            </VSelect>
            <VFormControl
                {...registerVFormControl({ propertyName: 'unvalidatedProp', labelText: 'Not validated' })}
                displayMode={true}
            />
        </VForm>

        
******************************************

# List Validation:

The useValidatedList hook can be used to support a dynamic list of items in your forms.  It functions very similarly to the "useValidatedForm" hook.  It receives a schema that will be run against each item.  Optionally, it can receive a single Validator to run on the list as a whole.

Returned items:
- uiValues: Values tracked by form
- listError: Null if list is valid, an error message if the list failed to satisfy the provided (optional) listValidator
- handleListChange: Accepts onChange event and the targeted item.  Updates uiValues and the matching errorObject.
- handleListChangeByValueAndName: Accepts value, propName, and the targeted item.  Updates uiValues and the matching errorObject.
- addItem: Adds new item to uiValues and creates a matching errorObject.
- removeItem: Removes passed-in item from uiValues and removes the matching errorObject.
- setPropertyError: Accepts propertyName, errorMessage, and the targeted item.  Manually sets an error in the matching errorObject.
- clearPropertyError: Accepts propertyName and the targeted item.  Manually clears the error in matching errorObject.
- validateAll: A function that triggers all validation, used by VForm component.
- resetList: Accepts optional array of new items, resets errors and uiValues.
- getErrorObjectForItem: Accepts item in uiValues, returns the matching errorObject.

Usage Summary:
- Create a scheme to run against each item.
- (Optional) Create a Validator to run against the whole list.
- Call useValidatedList hook, passing in the item schema, listValidator, and (optional) initialValues.
- Plug "validateAll" and an onSubmit handler into VForm component.
- Map each item to a series of inputs and/or VForm components using:
  - a "handleListChange" or "handleListChangeByValueAndName" that accepts the item as the last param,
  - its matching errorObject using getErrorObjectForItem,
  - a "removeItem" that accepts the item as a param
- Provide a means of calling the "addItem" function if desired
- Display listError if a listValidator was provided when calling the hook

List Validation Example:

```
const BasicListForm = ({ initialValues }) => {
  // schema is run against each item
  const itemSchema = {
    title: new Validator().required(),
    redName: new Validator().validateWithEntity((val, entity) => {
      if (entity.isRed && !val) { return 'This property is required when the item is red'; }
    })
  }

  // validator is run against the list of items itself
  const listValidator = new Validator().custom(list => {
    if (list.length < 3) { return 'You must create at least 3 items'; }
    return null;
  })

  const {
    uiValues, listError, handleListChange, addItem, removeItem, validateAll, getErrorObjectForItem
  } = useValidatedList(itemSchema, listValidator, initialValues);

  const handleSubmit = () => { console.log('submitting', uiValues); }

  return (
    <VForm validateAll={validateAll} onSubmit={handleSubmit}>
      {listError && <span style={{ color: 'red' }}>{listError}</span>}
      <table>
        <thead>
          <tr>
            <th>Item Title</th>
            <th>Item Quantity</th>
            <th>Item Is Red</th>
            <th>Item Name When Red</th>
            <th>Remove</th>
          </tr>
        </thead>
        <tbody>
          {uiValues
            .sort((a, b) => a.order - b.order)
            .map((item, index) => {
              const errorObject = getErrorObjectForItem(item);
              const handleChange = (e) => { handleListChange(e, item); }
              const handleRemoveItem = () => { removeItem(item); }
              return (
                <tr>
                  <td>
                    <VFormControl
                      handleChange={handleChange}
                      inputName={'title'}
                      inputValue={item.title}
                      errorMessage={errorObject.title}
                      isInTableRow
                    />
                  </td>
                  <td>
                    <VFormControl
                      handleChange={handleChange}
                      inputName={'quantity'}
                      inputValue={item.quantity}
                      errorMessage={errorObject.quantity}
                      type={'number'}
                      isInTableRow
                    />
                  </td>
                  <td>
                    <VFormControl
                      handleChange={handleChange}
                      inputName={'isRed'}
                      inputValue={item.isRed}
                      errorMessage={errorObject.isRed}
                      type={'checkbox'}
                      isInTableRow
                    />
                  </td>
                  <td>
                    <VFormControl
                      handleChange={handleChange}
                      inputName={'redName'}
                      inputValue={item.redName}
                      errorMessage={errorObject.redName}
                      isInTableRow
                    />
                  </td>
                  <td>
                    <button type='button' className='btn-close' onClick={handleRemoveProduct}/>
                  </td>
                </tr>
              )
            })
          }
        </tbody>
      </table>
      <button type="button" onClick={addNew}>Add New Item</button>
      <button type="submit">Submit</button>
    </VForm>
  )
}

