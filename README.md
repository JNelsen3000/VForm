# VForm
React Form Validation made easy!

  This library will handle form state management and validation, while giving you total control and letting you easily add your own custom logic to the process.  By default, the form will run all validation on form submission and prevent the submit from succeeding if any validation checks fail.

## Contents
- Simple Example
- Step-By-Step
- Complete Example
- List Validation
- Validation Rule Options

## Bare-bones example
At its simplest level of implementation, you will define a schema of rules, call the useValidatedForm hook, and create your components:

```
const SimpleForm = ({}) => {
  const schema = {
    name: new Validator().required(),
    age: new Validator().required().min(21)
  }

  const handleSubmit = () => { console.log(`submitting name: ${formValues.name}, age: ${formValues.age}`) }

  const { validateAll, formValues, registerVFormControl } = useVForm(schema);

  return (
    <VForm validateAll={validateAll} onSubmit={handleSubmit}>
      <VFormControl {...registerVFormControl('name')} labelText="Name" />
      <VFormControl {...registerVFormControl('age', 'number')} labelText="Age" />
      <button type="submit">Submit</button>
    </VForm>
  )
}
```
That's it!  There is plenty of opportunity for customization, but the base pattern is just that easy.

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

Call the "useVForm" hook, passing in the schema object and the entity that the form is viewing/editing/creating.  The "useVForm" hook will return "uiValues", "errors", "handleChange", "handleChangeByPropertyPathAndValue", "validateAll" and more.

Returned by the "useVForm" hook:
- "formValues" is the object that holds the current values for the form, separate from the initial values which will remain unchanged.
- "errors" is an object that will track invalid inputs.  if an input is invalid, the "errors" object will have a property with the same name as the property assigned to the input.  The value will be the relevant error message.  For example, if the 'name' property must not be longer than 5 characters and it's value is 'abcdefgh', the errors object could look like this:
           `{ name: 'Name must not be longer than 5 characters' }`
if you need a nested error with a complex property path, you could instead call "getErrorByPath"
- "handleChangeByPropertyPathAndValue" allows the form to continue tracking all values.  Use this in the components placed in the form later.
- "setErrorByPath" allows you to manually set an error message for a property.  Pass in the path and an error message (or null to clear the error).
- "getErrorByPath" allows you to retrieve the error message for a property.  Pass in the path to the property.
- "resetForm" can be called to manually reset the form, optionally passing in any new initial values.
- "getInputProperties" allows you to quickly register an HTML input or custom component instead of using VForm components.  it returns "onChange", "type", "value", and "propertypath" (required for useVForm).
- "registerVFormControl" allows you to easily register a VFormControl by returning a set of commonly used properties for you.
- "registerVFormControlWithDisplayValue" is similar to "registerVFormControl", with a couple other properties unique to inputs that also use a display value (like VSelect).  Examples for each are shown in step 3 below.
- "registerDateRangeControl" returns the minimum required properties for VFormDateRangeInput to register with the useVForm hook.
- "validateAll" will be provided to the form to allow it to run validation against all inputs on submit.  It can also be called manually.
some returned values are used only when the entity is a complex, nested entity:
- "addArrayItem" adds new (empty) item to a nested list, updates "errors", and queues the parent list for revalidation if list was invalid.  accepts the path to the value, and an optional default value object, necessary if the entity has nested lists.
- "removeArrayItem" removes item from nested list, updates "errors", and queues the list for revalidation if list was invalid.
- "removeArrayItems" removes multiple items from nested list, updates "errors", and queues the list for revalidation if list was invalid.
- "replaceAllArrayItems" replaces all items in nested list, updates "errors", and queues the list for revalidation if list was invalid.
- "getNestedEntityHasErrors" returns true if selected entity is invalid.  provide the propertyPath of the entity to target.

"useVForm" example:
```
const { validateAll, handleChange, handleChangeByValueAndName, uiValues, errors } = useValidatedForm(schema, entity);
```
# Step three: Add components.
Nest the desired components within a "VForm" component.  The "VForm" should receive "validateAll" and an "onSubmit" handler. This handler be called when the form has passed validation and is submitting.  It will ONLY be called when ALL validation passes.  It does not receive form values, but is merely called.  In your handler, you should use the "formValues" returned by the "useValidatedForm" hook to get the form's current values.
Example:
```
<Vform validateAll={validateAll} onSubmit={mySubmitHandler}>
  <VFormControl
    {...registerVFormControl('propertyPath')}
    labelText={myLabel}
  />
</VForm>
```
The options for components are "VFormControl", "VSelect", "VSelectWithFetch", and "VFormUTCDateTimeInput".

Another option for more easily setting up VFormControls is by using the "registerVFormControl" function returned by the useValidatedForm hook.  It automatically returns the following properties:
- inputName,
- type,
- inputValue,
- errorMessage,
- handleChange,
- handleChangeByPropertyPathAndValue,
- propertyPath

Simply pass in the property path (or the property name for flat entities) and type (type defaults to 'text', so you only need this if it is otherwise).  Other properties can still be manually set after the register function.  The returned values should be applied using spread syntax.

Note: Since these properties also work with VFormUTCDateTimeInput and VSelect, "registerVFormControl" works with them as well.

Examples:
```
<VFormControl
  {...registerVFormControl('myTextProp')}
  labelText="My Text Label"
  displayMode={true}
/>
<VFormControl
  {...registerVFormControl('myNumberProp', 'number')}
  labelText="My Number Label"
/>
<VFormControl
  {...registerVFormControl('myTextPropWithNoLabel')}
/>
```        
Similarly, the "registerInputWithDisplayValue" can quickly set up V-components that have a linked display property, such as "VSelectWithFetch".  "registerInputWithDisplayValue" returns the following:
- handleChange,
- handleChangeByPropertyPathAndValue,
- keyPropertyName,
- inputName,
- displayPropertyName,
- inputId,
- selectedKeyValue,
- selectedDisplayValue,
- errorMessage

Example:
```
<VSelectWithFetch
  {...registerInputWithDisplayValue('keyProp', 'displayProp')}
  getSelectList={MyDataLayer.GetListForThisProp}
  labelText='I will display "displayProp" instead of "keyProp"'
/>
```

# Complete example:
```
        <VForm validateAll={validateAll} onSubmit={handleSubmit}>
            <VFormControl
                {...registerVFormControl('requiredProp')}
                labelText="Required Prop"
            />
            <VFormControl
                {...registerVFormControl('propWithMinValue', 'number')}
                labelText="Above Zero"
            />
            <VFormControl
                {...registerVFormControl('propWithMaxValue', 'number')}
                labelText="Below 10"
            />
            <VFormControl
                {...registerVFormControl('complexProp')}
                labelText="Between 6 and 8 characters long, and is required"
            />
            <VSelect
                {...registerVFormControl('propWithCustomLogic')}
                labelText="Pick the Doggo"
            >
                <option value={''}>---</option>
                <option value={'kitteh'}>Kitteh</option>
                <option value={'doggo'}>Doggo</option>
                <option value={'rock'}>A rock</option>
            </VSelect>
            <VFormControl
                {...registerVFormControl('unvalidatedProp')}
                labelText="Not Validated"
            />
        </VForm>
```
        
******************************************

# List Validation:

The useVForm hook can be used to support dynamic lists of items in your forms.  It functions very similarly to the "useValidatedForm" hook.  It receives a schema that will be run against each item.  Optionally, it can receive a single Validator to run on the list as a whole.

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
  - (Optional) a "removeItem" that accepts the item as a param
- (Optional) Provide a means of calling the "addItem" function
- (Optional) Display listError if a listValidator was provided when calling the hook

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
```

# Validation Rule Options
The Validator object has a list of common validation rules, plus a "custom" option and a "validateWithEntity" option to allow you to define your own rules.  All rules can be chained together for quick and easy application.  They all also accept an optional custom message parameter, but will provide a default message if excluded.  For example:
```
  const schema = {
    requiredWithDefaultMessage: new Validator().required(),
    requiredWithCustomMessage: new Validator().required('this is very required'),
    chainedRules: new Validator().minLength(3, 'Must be 3 characters or greater').required().regex(/[A-C]*/, 'Must be only uppercase letters A-C')
  }
```
Note: most rules will be considered valid if there is no value provided.  For example, since null and "undefined" are not less than 4, `new Validator().min(4)` will not be flagged as invalid until the user inputs a value.  To ensure that a value is provided by the user, combine other rules with "required": `new Validator().min(4).required()`.

- required:
  - Accepts an optional "message" parameter that overrides the default message.  Fails input if no value is provided.  E.G.: `new Validator().required('This is really required')`
- requiredIf:
  - Accepts a bool that determines whether or not to require the property and an optional "message" parameter that overrides the default message.  E.G.: `new Validator().requiredIf(true, 'This is really required')`
- min:
  - Accepts a number representing the minimum that the input can be and an optional "message" parameter that overrides the default message.  E.G.: `new Validator().min(10, 'This must be 10 or greater')` 
- max:
  - Accepts a number representing the maximum that the input can be and an optional "message" parameter that overrides the default message.  E.G.: `new Validator().max(10, 'This must be 10 or less')` 
- minDate:
  - Accepts a string in 'YYYY-MM-DD' format representing the minimum date the input can be and an optional "message" parameter that overrides the default message.  E.G.: `new Validator().minDate('1776-07-05', 'This must be after July 4th 1776')` 
- maxDate:
  - Accepts a string in 'YYYY-MM-DD' format representing the maximum date the input can be and an optional "message" parameter that overrides the default message.  E.G.: `new Validator().maxDate('1776-07-03', 'This must be before July 4th 1776')` 
- minLength:
  - Accepts a number representing the minimum character length the input can be and an optional "message" parameter that overrides the default message.  E.G.: `new Validator().minLength(5, 'This must be 5 characters or more')` 
- maxLength:
  - Accepts a number representing the maximum character length the input can be and an optional "message" parameter that overrides the default message.  E.G.: `new Validator().maxLength(5, 'This must be 5 characters or less')` 
- regex:
  - Accepts a RegEx to run against the input and an optional "message" parameter that overrides the default message.  E.G.: `new Validator().regex(/[A-E]*/, 'This must be only uppercase letters A-E')` 
- noSpecialCharacters:
  - Accepts an optional "message" parameter that overrides the default message.  Fails input if it includes anything except letters, numbers, and spaces.  E.G.: `new Validator().noSpecialCharacters('Only letters, numbers, and spaces allowed')`
- phoneNumber:
  - Accepts an optional "message" parameter that overrides the default message.  Fails input if it does not pass a generic phone number regex.  If the pattern does not fit your needs, simply use "regex" rule instead.  E.G.: `new Validator().phoneNumber('This must be a valid phone number')` 
- numberInRange:
  - Accepts a number representing the minimum value, another representing the maximum value, and an optional "message" parameter that overrides the default message.  Fails input if number is out of provided range (INCLUSIVE).  E.G.: `new Validator().numberInRange(5, 10, 'Number must be between 5 and 10, inclusive')` 
- lengthInRange:
  - Accepts a number representing the minimum value, another representing the maximum value, and an optional "message" parameter that overrides the default message.  Fails input if text length is out of provided range (INCLUSIVE).  E.G.: `new Validator().lengthInRange(5, 10, 'Text must be between 5 and 10 characters, inclusive')` 
- isWholeNumber:
  - Accepts an optional "message" parameter that overrides the default message.  Fails input if it is not a whole number.  E.G.: `new Validator().isWholeNumber('Value must be a whole number')`
- validEmailAddress:
  - Accepts an optional "message" parameter that overrides the default message.  Fails input if it is not a valid email address according to a regex.  If the pattern does not fit your needs, simply use "regex" rule instead.  E.G.: `new Validator().validEmailAddress('Must be a valid email address')`
- minArrayOptions:
  - Accepts a number representing the minimum value and an optional "message" parameter that overrides the default message.  Fails input if the array is less than the provided minimum.  E.G.: `new Validator().minArrayOptions(2, 'You must select at least 2 items')`
- maxArrayOptions:
  - Accepts a number representing the maximum value and an optional "message" parameter that overrides the default message.  Fails input if the array is more than the provided maximum.  E.G.: `new Validator().maxArrayOptions(2, 'You may select at most 2 items')`
- longitude:
  - Accepts an optional "message" parameter that overrides the default message.  Fails input if it is not a valid longitude.  E.G.: `new Validator().longitude('Not a valid longitude')
- latitude:
  - Accepts an optional "message" parameter that overrides the default message.  Fails input if it is not a valid latitude.  E.G.: `new Validator().latitude('Not a valid latitude')
- validateWithEntity:
  - Accepts a function to run when validating.  Will pass the input's value and the entity being validated into this function.  The function should return a string error message if the value is invalid or null if it is valid.  E.G.: `new Validator().validateWithEntity((value, entity) => { if (value == 10 && entity.budget < 10) { return 'This is more than your budget' } return null; }))
- custom:
  - Accepts a function to run when validating.  Will pass the input's value into this function.  The function should return a string error message if the value is invalid or null if it is valid.  E.G.: `new Validator().custom((value) => { if (value == 'goose') { return 'A goose is not allowed'; } return null; }))


