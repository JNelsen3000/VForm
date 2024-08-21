import React from "react";
import { Form } from "react-bootstrap";
import '@/VForm/Validation.css';

export const VErrorMessage = ({ errorMessage }) => {
    return (
        !errorMessage ? null : <Form.Text type="invalid" className="invalid-message">{errorMessage}</Form.Text>
    );
};
