import { format, isAfter, isBefore, parse, parseISO } from "date-fns";
export default class Validator {
    constructor () {
        this.rules = [];
        this.validateWithEntityRules = [];
    }

    runValidation (value, entity) {
        let errorMessage = null;
        for (let i = 0; i < this.rules.length; i++) {
            const error = this.rules[i](value);
            if (error) {
                i = this.rules.length + 1;
                errorMessage = error;
            }
        }
        for (let i = 0; i < this.validateWithEntityRules.length; i++) {
            const error = this.validateWithEntityRules[i](value, entity);
            if (error) {
                i = this.validateWithEntityRules.length + 1;
                errorMessage = error;
            }
        }
        return errorMessage;
    }

    /**
     * @param {*} validationFunc should accept the input's value and return null if valid or an error message if invalid
     */
    custom (validationFunc) {
        this.rules.push(validationFunc);
        return this;
    }

    required (message = null) {
        this.rules.push(VALIDATION.REQUIRED(message));
        return this;
    }

    /** Applies "required" logic if "isRequired" is true */
    requiredIf (isRequired, message = null) {
        this.rules.push(VALIDATION.REQUIRED_IF(isRequired, message));
        return this;
    }

    min (minimum, message = null) {
        this.rules.push(VALIDATION.MIN(minimum, message));
        return this;
    }

    max (maximum, message = null) {
        this.rules.push(VALIDATION.MAX(maximum, message));
        return this;
    }

    minDate (minimum, message = null) {
        this.rules.push(VALIDATION.MIN_DATE(minimum, message));
        return this;
    }

    maxDate (maximum, message = null) {
        this.rules.push(VALIDATION.MAX_DATE(maximum, message));
        return this;
    }

    minTime (minimum, message = null) {
        this.rules.push(VALIDATION.MIN_TIME(minimum, message));
        return this;
    }

    maxTime (maximum, message = null) {
        this.rules.push(VALIDATION.MAX_TIME(maximum, message));
        return this;
    }

    minLength (minimum, message = null) {
        this.rules.push(VALIDATION.MIN_LENGTH(minimum, message));
        return this;
    }

    maxLength (maximum, message = null) {
        this.rules.push(VALIDATION.MAX_LENGTH(maximum, message));
        return this;
    }

    regex (regex, message = null) {
        this.rules.push(VALIDATION.REGEX(regex, message));
        return this;
    }

    noSpecialCharacters (message = null) {
        this.rules.push(VALIDATION.NO_SPECIAL_CHARACTERS(message));
        return this;
    }

    phoneNumber (message = null) {
        this.rules.push(VALIDATION.PHONE_NUMBER(message));
        return this;
    }

    numberInRange (min, max, message = null) {
        this.rules.push(VALIDATION.MIN(min, message));
        this.rules.push(VALIDATION.MAX(max, message));
        return this;
    }

    lengthInRange (min, max, message = null) {
        this.rules.push(VALIDATION.MIN_LENGTH(min, message));
        this.rules.push(VALIDATION.MAX_LENGTH(max, message));
        return this;
    }

    isWholeNumber (message = null) {
        this.rules.push(VALIDATION.IS_WHOLE_NUMBER(message));
        return this;
    }

    validEmailAddress (message = null) {
        this.rules.push(VALIDATION.VALID_EMAIL_ADDRESS(message));
        return this;
    }

    minArrayOptions (minimum, message = null) {
        this.rules.push(VALIDATION.MIN_ARRAY(minimum, message));
        return this;
    }

    maxArrayOptions (maximum, message = null) {
        this.rules.push(VALIDATION.MAX_ARRAY(maximum, message));
        return this;
    }

    /** Ensures value is within valid longitude range */
    longitude (message = null) {
        this.rules.push(VALIDATION.MAX(180, message ?? 'Longitude cannot be greater than 180'));
        this.rules.push(VALIDATION.MIN(-180, message ?? 'Longitude cannot be less than -180'));
        return this;
    }

    /** Ensures value is within valid latitude range */
    latitude (message = null) {
        this.rules.push(VALIDATION.MAX(90, message ?? 'Latitude cannot be greater than 90'));
        this.rules.push(VALIDATION.MIN(-90, message ?? 'Latitude cannot be less than -90'));
        return this;
    }

    /** Will pass the current entity in the the validationFunc when validating
     * @param {*} validationFunc should accept the input's value and the entity, then return null if valid or an error message if invalid
    */
    validateWithEntity (validationFunc) {
        this.validateWithEntityRules.push(validationFunc);
        return this;
    }
}

export const VALIDATION = {
    REQUIRED: (message = null) => {
        return (value) => {
            if (value === undefined ||
                value === '' ||
                value === null ||
                (typeof value === 'string' && value.trim() === '')) {
                return message ?? 'This field is required!';
            }
            return null;
        };
    },
    REQUIRED_IF: (isRequired, message = null) => {
        return (value) => {
            if (!isRequired) { return null; }
            if (value === undefined ||
                value === '' ||
                value === null ||
                (typeof value === 'string' && value.trim() === '')) {
                return message ?? 'This field is required!';
            }
            return null;
        };
    },
    MIN: (minimum, message = null) => {
        return (value) => {
            if (value === null || value === '' || value === undefined || (value instanceof Array && value < 1)) { return null; }
            if (isNaN(parseFloat(value))) { return 'Min value only supports numbers'; }
            const isValid = value >= minimum;
            if (isValid) { return null; }
            return message ?? `Value cannot be less than ${minimum}`;
        };
    },
    MAX: (maximum, message = null) => {
        return (value) => {
            if (value === null || value === '' || value === undefined) { return null; }
            if (isNaN(parseFloat(value))) { return 'Max value only supports numbers'; }
            const isValid = value <= maximum;
            if (isValid) { return null; }
            return message ?? `Value cannot be greater than ${maximum}`;
        };
    },
    MAX_DATE: (maximum, message = null) => {
        if (!parse(maximum, 'yyyy-MM-dd', new Date())) { console.error(`MAX_DATE could not parse the provided maximum date: ${maximum}.  Should be in "yyyy-MM-dd" format.`); }
        return (value) => {
            if (value == null) { return null; }
            if (typeof value !== 'string') { console.error('MAX_DATE only supports "string" values'); return 'Invalid date'; }
            const dateValue = parseISO(value);
            if (dateValue == null) { console.error(`MAX_DATE received a value in an invalid date format: ${value}`); return 'Invalid date'; }
            const isAfterMax = isAfter(dateValue, maximum);
            if (isAfterMax) { return message ?? `Date cannot be before ${format(maximum, 'yyyy-MM-dd')}`; }
            return null;
        };
    },
    MIN_DATE: (minimum, message = null) => {
        if (!parse(minimum, 'yyyy-MM-dd', new Date())) { console.error(`MIN_DATE could not parse the provided minimum date: ${minimum}.  Should be in "yyyy-MM-dd" format.`); }
        return (value) => {
            if (value == null) { return null; }
            if (typeof value !== 'string') { console.error('MIN_DATE only supports "string" values'); return 'Invalid date'; }
            const dateValue = parseISO(value);
            if (dateValue == null) { console.error(`MIN_DATE received a value in an invalid date format: ${value}`); return 'Invalid date'; }
            const isBeforeMin = isBefore(dateValue, minimum);
            if (isBeforeMin) { return message ?? `Date cannot be before ${format(minimum, 'yyyy-MM-dd')}`; }
            return null;
        };
    },
    MIN_TIME: (minimum, message = null) => {
        if (!parse(minimum, 'HH:mm', new Date())) { console.error(`MIN_TIME could not parse the provided minimum time: ${minimum}.  Should be in "HH:mm" format.`); }
        return (value) => {
            if (value == null) { return null; }
            if (typeof value !== 'string') { console.error('MIN_TIME only supports "string" values'); return 'Invalid time'; }
            const timeValue = parse(value, 'HH:mm', new Date());
            if (timeValue == null) { console.error(`MIN_TIME received a value in an invalid format: ${value}`); return 'Invalid text'; }
            const minTime = parse(minimum, 'HH:mm', new Date());
            const timeIsBelowMin = isBefore(timeValue, minTime);
            if (timeIsBelowMin) { return message ?? `Time cannot be before ${format(minTime, 'hh:mm aa')}`; }
            return null;
        };
    },
    MAX_TIME: (maximum, message = null) => {
        if (!parse(maximum, 'HH:mm', new Date())) { console.error(`MAX_TIME could not parse the provided maximum time: ${maximum}.  Should be in "HH:mm" format.`); }
        return (value) => {
            if (value == null) { return null; }
            if (typeof value !== 'string') { console.error('MAX_TIME only supports "string" values'); return 'Invalid time'; }
            const timeValue = parse(value, 'HH:mm', new Date());
            if (timeValue == null) { console.error(`MAX_TIME received a value in an invalid format: ${value}`); return 'Invalid text'; }
            const maxTime = parse(maximum, 'HH:mm', new Date());
            const timeIsAboveMax = isAfter(timeValue, maxTime);
            if (timeIsAboveMax) { return message ?? `Time cannot be after ${format(maxTime, 'hh:mm aa')}`; }
            return null;
        };
    },
    MIN_LENGTH: (minimum, message = null) => {
        return (value) => {
            if (value === null || value === '' || value === undefined) { return null; }
            if (typeof value !== 'string') { console.error('MIN_LENGTH only supports "string" values'); return 'Invalid text'; }
            if (value.length >= minimum) { return null; }
            return message ?? `Value cannot be shorter than ${minimum} characters`;
        };
    },
    MAX_LENGTH: (maximum, message = null) => {
        return (value) => {
            if (value === null || value === '' || value === undefined) { return null; }
            if (typeof value !== 'string') { console.error('MAX_LENGTH only supports "string" values'); return 'Invalid text'; }
            if (value.length <= maximum) { return null; }
            return message ?? `Value cannot be longer than ${maximum} characters`;
        };
    },
    MIN_ARRAY: (minimum, message = null) => {
        return (value) => {
            if (!Array.isArray(value)) {
                console.error("MIN_ARRAY only accepts array parameters");
                return "Invalid parameter";
            }

            if (value.length >= minimum) {
                return null;
            }

            return message ?? `Please select at least ${minimum} option${minimum > 1 ? "s" : ""}!`;
        };
    },
    MAX_ARRAY: (maximum, message = null) => {
        return (value) => {
            if (!Array.isArray(value)) {
                console.error("MAX_ARRAY only accepts array parameters");
                return "Invalid parameter";
            }

            if (value.length <= maximum) {
                return null;
            }

            return message ?? `Please select less than ${maximum} option${maximum > 1 ? "s" : ""}!`;
        };
    },
    REGEX: (regex, message = null) => {
        return (value) => {
            if (regex.test(value)) { return null; }
            return message ?? 'Input is invalid';
        };
    },
    NO_SPECIAL_CHARACTERS: (message = null) => {
        return (value) => {
            if (/^[0-9A-Za-z\s]*$/.test(value)) { return null; }
            return message ?? 'No special characters allowed';
        };
    },
    PHONE_NUMBER: (message = null) => {
        return (value) => {
            if (value == null || value == '') { return null; }
            // if (new RegExp('^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$').test(value)) { return null; }
            if (/^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/.test(value)) { return null; }
            return message ?? 'Not a valid phone number';
        };
    },
    IS_WHOLE_NUMBER: (message = null) => {
        return (value) => {
            if (value == null || typeof value == 'undefined' || typeof value == 'string') { return null; }
            if (isNaN(value)) { return null; }
            if (value % 1 === 0) { return null; }
            return message ?? 'Input must be a whole number';
        };
    },
    VALID_EMAIL_ADDRESS: (message = null) => {
        return (value) => {
            if (value == null) {
                return null;
            }

            const pattern = /^(([^<>()[\].,;:\s@"]+(\.[^<>()[\].,;:\s@"]+)*)|(".+"))@(([^<>()[\].,;:\s@"]+\.)+[^<>()[\].,;:\s@"]{2,})$/i;
            if (pattern.test(value)) {
                return null;
            }

            return message ?? 'Please enter a valid email address!';
        };
    }
};
