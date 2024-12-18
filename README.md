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
At its simplest level of implementation, you will define a schema of rules, call the useVForm hook, and create your components:

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
That's it!  That's a fully functioning, validated form.  There is plenty of opportunity for customization, but the base pattern is just that easy.

## Step one: Create a schema.

The schema object should be an object with properties that correspond to whichever properties require validation. Assign a "Validator" to each property and call the desired function(s) to set up validation.  For example:
```
const schema = {
  name: new Validator().required(),
  age: new Validator().min(21),
  propWithMultipleRules: new Validator().required().minLength(12).maxLength(45)
}
```
      
Each rule has a default error message, but can receive a custom one.  If the rule requires an argument, just pass in the custom error message after it.  For example:
```
const schema = {
  name: new Validator().required('You really need a name'),
  age: new Validator().min(21, 'You must be at least 21')
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

Call the "useVForm" hook, passing in the schema object and (optionally) the entity that the form is viewing/editing/creating.  The "useVForm" hook will return "uiValues", "errors", "handleChange", "handleChangeByPropertyPathAndValue", "validateAll" and more.

"useVForm" example:
```
const { validateAll, handleChangeByPropertyPathAndValue, formValues, registerVFormControl } = useVForm(schema, entity);
```

Returned by the "useVForm" hook:
- "formValues" is the object that holds the current values for the form, separate from the initial values which will remain unchanged.
- "validateAll" will be provided to the form to allow it to run validation against all inputs on submit.  It can also be called manually.
- "registerVFormControl" allows you to easily register a VFormControl by returning a set of commonly used properties.
- "handleChangeByPropertyPathAndValue" allows the form to continue tracking all values.  Call this manually or use in the form components later.
- "resetForm" can be called to manually reset the form, optionally passing in any new initial values.

The rest of the returned values will be less frequently used (if at all), especially if you use the "registerVFormControl" function:
- "getInputProperties" allows you to quickly register an HTML input or custom component instead of using VForm components.  it returns "onChange", "type", "value", and "propertypath" (required for useVForm).
- "errors" is an object that will track invalid inputs.  if an input is invalid, the "errors" object will have a property with the same name as the property assigned to the input.  The value will be the relevant error message.  For example, if the 'name' property must not be longer than 5 characters and it's value is 'abcdefgh', the errors object could look like this:
           `{ name: 'Name must not be longer than 5 characters' }`
if you need a nested error with a complex property path, you could instead call "getErrorByPath".
- "setErrorByPath" allows you to manually set an error message for a property.  Pass in the path and an error message (or null to clear the error).
- "getErrorByPath" allows you to retrieve the error message for a property.  Pass in the path to the property.
- "registerVFormControlWithDisplayValue" is similar to "registerVFormControl", with a couple other properties unique to inputs that also use a display value (like VSelect).  Examples for each are shown in step 3 below.
- "registerDateRangeControl" returns the minimum required properties for VFormDateRangeInput to register with the useVForm hook.
some returned values are used only when the entity is a complex, nested entity:
- "addArrayItem" adds new (empty) item to a nested list, updates "errors", and queues the parent list for revalidation if list was invalid.  accepts the path to the value, and an optional default value object, necessary if the entity has nested lists.
- "removeArrayItem" removes item from nested list, updates "errors", and queues the list for revalidation if list was invalid.
- "removeArrayItems" removes multiple items from nested list, updates "errors", and queues the list for revalidation if list was invalid.
- "replaceAllArrayItems" replaces all items in nested list, updates "errors", and queues the list for revalidation if list was invalid.
- "getNestedEntityHasErrors" returns true if selected entity is invalid.  provide the propertyPath of the entity to target.

# Step three: Add components.
Nest the desired components within a "VForm" component.  The "VForm" should receive "validateAll" and an "onSubmit" handler. This handler be called when the form has passed validation and is submitting.  It will ONLY be called when ALL validation passes.  It does not receive form values, but is merely called.  In your handler, you should use the "formValues" returned by the "useValidatedForm" hook to get the form's current values.
Example:
```
const mySubmitHandler = () => { console.log('form is valid, submitting current form values: ', formValues); }
<Vform validateAll={validateAll} onSubmit={mySubmitHandler}>
  <VFormControl
    {...registerVFormControl('propertyPath')}
    labelText={myLabel}
  />
</VForm>
```
Prebuilt components are "VFormControl", "VSelect", "VSelectWithFetch", and "VFormUTCDateTimeInput".

Call the "registerVFormControl" function returned by the useValidatedForm hook to register VFormControl, VFormUTCDateTimeInput, or VSelect.  It automatically returns the following properties:
- inputName,
- type,
- inputValue,
- errorMessage,
- handleChange,
- handleChangeByPropertyPathAndValue,
- propertyPath

Simply pass in the property path (or the property name for flat entities) and input type (defaults to 'text', so you only need this if it is otherwise).  Other properties can still be manually set after the register function.  The returned values should be applied using spread syntax.

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
Similarly, the "registerVFormControlWithDisplayValue" can quickly set up V-components that have a linked display property, such as "VSelectWithFetch".  "registerVFormControlWithDisplayValue" returns the following:
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
  {...registerVFormControlWithDisplayValue('id', 'displayName')}
  getSelectList={MyDataLayer.GetListForThisProp}
  labelText='I will display "displayName" value instead of "id" value'
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

# Nested List Validation:

The useVForm hook can be used to support nested lists of items in your forms.  Simply add the structure to your schema object.  Though the syntax
may initially seem complex, it follows a very logical pattern and can save you a LOT of repeated code.

Here is an example "driver" entity with two layers of nested lists ("trucks", then "tires"):
```
{
  name: "Truck Driver",
  trucks: [
    {
      truckName: 'Red Ford',
      tires: [
        { tread: 12, brand: 'Goodtire' },
        { tread: 12, brand: 'Goodtire' },
        { tread: 14, brand: 'offbrand' },
        { tread: 12, brand: 'Goodtire' }
      ]
    }
  ]
}
```

Instead of using a regular Validator for a nested list, use a NestedListValidator.  It accepts the path to the list property and a Validator to run on
each item in the list.  The NestedListValidator can have normal array validation methods called on it (like "required", "minArrayOptions").  Since it
calls a Validator on each item, each item could have a nested list as well.

```
const schema = {
    name: new Validator().required('name is required').maxLength(24),
    trucks: new NestedListValidator('trucks', {
        truckName: new Validator().required().maxLength(24),
        tires: new NestedListValidator('trucks.tires', {
            tread: new Validator().min(0),
            brand: new Validator().required()
        })
            .minArrayOptions(4, 'Each truck needs at least 4 tires')
    }).maxArrayOptions(3, 'Each driver may only have 3 trucks')
};
```

Use the "addArrayItem" and "removeArrayItem" functions to manage the items.

To add an item, provide a full path to the list.  If the item has any nested lists of its own, pass in a default value as well.  For example, to add a "truck"
to the "driver" entity, you would call ```addArrayItem('trucks', { tires: [] })```.  To add a "tire" to a "truck", you would call
```addArrayItem(`trucks.${selectedTruckIndex}.tires`)```.  The deeply nested path requires indexes since it is pointing to a list on a specific item.

To remove an item, provide a full path to the specific item.  To remove a specific "tire", you would call
```removeArrayItem(`trucks.${selectedTruckIndex}.tires.${selectedTireIndex}`)```

The registration functions will work the same as before, you just need to specify the full path when registering inputs, including indexes for nested items.

This is an example of how you could structure your form with validation for a "driver" entity:
```
    const DriverForm = ({ driver: initialValues, onSubmit }) => {
        const schema = {
            name: new Validator().required('name is required').maxLength(24),
            trucks: new NestedListValidator('trucks', {
                truckName: new Validator().required().maxLength(24),
                tires: new NestedListValidator('trucks.tires', {
                    tread: new Validator().min(0),
                    brand: new Validator().required()
                })
                    .minArrayOptions(4, 'Each truck needs at least 4 tires')
            }).maxArrayOptions(3, 'Each driver may only have 3 trucks')
        };

        const handleSubmit = () => {
            onSubmit(formValues);
        };

        const { formValues, validateAll, registerVFormControl, listErrors, removeArrayItem, addArrayItem, resetForm, getErrorByPath, setErrorByPath } = useVForm(schema, initialValues);

        useEffect(() => { resetForm(initialValues); }, [initialValues]);

        return (
            <VForm validateAll={validateAll} onSubmit={handleSubmit}>
                <VFormControl
                    {...registerVFormControl('name')}
                    labelText={'Name'}
                />

                {* Here we display any validation errors applied to the list as a whole. List validation is checked using the listErrors object.  Each list is accessed by its name. *}
                {listErrors.trucks && <span style={{ color: 'red' }}>{listErrors.trucks}</span>}

                {formValues.trucks.map((truck, truckIndex) => {
                    return (
                        <div key={truckIndex}>
                            <h6>Trucks</h6>
                            <VFormControl {...registerVFormControl(`trucks.${truckIndex}.truckName`)} labelText={'Truck Name'} />
                            {listErrors.tires && <span style={{ color: 'red' }}>{listErrors.tires}</span>}
                            {truck.tires.map((tire, tireIndex) => {
                                return (
                                    <div key={tireIndex}>
                                        <h6>Tire {tireIndex + 1}</h6>
                                        {* Each item path is constructed using property name, then child index, then child property name, etc. *}
                                        <VFormControl {...registerVFormControl(`trucks.${truckIndex}.tires.${tireIndex}.tread`, 'number')} labelText={'Tread'}/>
                                        <VFormControl {...registerVFormControl(`trucks.${truckIndex}.tires.${tireIndex}.brand`)} labelText={'Brand'}/>
                                        <button onClick={() => { removeArrayItem(`trucks.${truckIndex}.tires.${tireIndex}`); }}></button>
                                    </div>
                                );
                            })}
                            {* When adding an item, the path should point to the list, not a specific index.  Item will be appended to end of list. *}
                            <button type="button" onClick={() => { addArrayItem(`trucks.${truckIndex}.tires`); }}>Add Tire</button>
                            <button onClick={() => { removeArrayItem(`trucks.${truckIndex}`); }}>Delete Truck</button>
                        </div>
                    );
                })}
                {* When adding a new list item that itself has a nested list property, you must pass in a default object to addArrayItem
                    with an empty array for the nested list property *}
                <button type="button" onClick={() => { addArrayItem('trucks', { tires: [] }); }}>Add Truck</button>
            </VForm>
        );
    };

```

# Validation Rule Options
The Validator object has a list of common validation rules, plus a "custom" option to allow you to define your own rules.  All rules can be chained together for quick and easy application.  They all also accept an optional custom message parameter, but will provide a default message if excluded.  For example:
```
  const schema = {
    requiredWithDefaultMessage: new Validator().required(),
    requiredWithCustomMessage: new Validator().required('this is very required'),
    chainedRules: new Validator().minLength(3, 'Must be 3 characters or greater').required().regex(/[A-C]*/, 'Must be only uppercase letters A-C')
  }
```
Note: most rules will be considered valid if there is no value provided.  For example, since null and "undefined" are not less than 4, `new Validator().min(4)` will not be flagged as invalid until the user inputs a value.  To ensure that a value is provided by the user, combine with "required": `new Validator().min(4).required()`.

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
- custom:
  - Accepts a function to run when validating.  Will pass the input's value into this function.  The function should return a string error message if the value is invalid or null if it is valid.  E.G.: `new Validator().custom((value) => { if (value == 'goose') { return 'A goose is not allowed'; } return null; }))


