import Joi from "joi";

const RegisterUserValidateSchema = Joi.object({
    fullName: Joi.string().pattern(/^[a-zA-Z ]+$/).max(20).required(),
    mobileNum: Joi.string().length(10).required(),
    email: Joi.string().email().max(100).required(),
    password: Joi.string().max(100).required(),
    confirmPassword: Joi.string().max(100).required(),
});

// LogIn Schema for Admin Log-In...
const AdminLoginValidateSchema = Joi.object({
    email: Joi.string()
        .email()
        .required()
        .messages({
            'string.email': 'Please enter a valid email address.',
            'string.empty': 'Email is required.',
            'any.required': 'Email is required.',
        }),
    password: Joi.string()
        .min(6)
        .max(50)
        .required()
        .messages({
            'string.min': 'Password must be at least 6 characters long.',
            'string.max': 'Password must be at most 100 characters long.',
            'string.empty': 'Password is required.',
            'any.required': 'Password is required.',
        }),
    recaptchaToken: Joi.string().min(3).required()
});

// CHANGE_ADMIN_PASSWORD
const CHANGE_ADMIN_PASSWORD_SCHEMA_VALIDATION = Joi.object({
    password: Joi.string()
        .min(6)
        .max(50)
        .required()
        .messages({
            'string.min': 'Password must be at least 6 characters long.',
            'string.max': 'Password must be at most 50 characters long.',
            'string.empty': 'Password is required.',
            'any.required': 'Password is required.',
        }),
    newPassword: Joi.string()
        .min(6)
        .max(50)
        .required()
        .messages({
            'string.min': 'Password must be at least 6 characters long.',
            'string.max': 'Password must be at most 50 characters long.',
            'string.empty': 'Password is required.',
            'any.required': 'Password is required.',
        }),
})

const GET_ALL_USERS_SCHEMA_VALIDATION = Joi.object({
    page: Joi.string().trim().required(),
    limit: Joi.string().trim().max(20).required()
})


const VALIDATE_SEARCH_SCHEMA = Joi.object(
    {
        searchKey: Joi.string().min(5).max(20).required()
    });

const SEARCH_AGENTS_VALIDATIONS_SCHEMA = Joi.object({
    s: Joi.string().alphanum().min(3).max(20).required()
});

export {
    RegisterUserValidateSchema,
    AdminLoginValidateSchema,
    CHANGE_ADMIN_PASSWORD_SCHEMA_VALIDATION,
    GET_ALL_USERS_SCHEMA_VALIDATION,
    VALIDATE_SEARCH_SCHEMA,
    SEARCH_AGENTS_VALIDATIONS_SCHEMA
}
