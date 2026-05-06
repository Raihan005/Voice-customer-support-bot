import { body, param, query } from 'express-validator';
import { validationResult } from 'express-validator';

/**
 * Middleware to check validation results and return errors
 */
export function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
}

// ============================================
// AUTH VALIDATORS
// ============================================
export const validateRegister = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6, max: 128 }).withMessage('Password must be 6-128 characters'),
  handleValidationErrors,
];

export const validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required'),
  handleValidationErrors,
];

// ============================================
// CART VALIDATORS
// ============================================
export const validateAddToCart = [
  body('productId')
    .notEmpty().withMessage('Product ID is required')
    .isInt({ min: 1 }).withMessage('Invalid product ID'),
  body('quantity')
    .optional()
    .isInt({ min: 1, max: 99 }).withMessage('Quantity must be 1-99'),
  body('selectedColor')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Color must be under 100 characters'),
  handleValidationErrors,
];

export const validateUpdateCart = [
  param('id')
    .isInt({ min: 1 }).withMessage('Invalid cart item ID'),
  body('quantity')
    .notEmpty().withMessage('Quantity is required')
    .isInt({ min: 1, max: 99 }).withMessage('Quantity must be 1-99'),
  handleValidationErrors,
];

// ============================================
// ORDER VALIDATORS
// ============================================
export const validatePlaceOrder = [
  body('shipping.fullName')
    .trim()
    .notEmpty().withMessage('Full name is required'),
  body('shipping.address')
    .trim()
    .notEmpty().withMessage('Address is required'),
  body('shipping.city')
    .trim()
    .notEmpty().withMessage('City is required'),
  body('shipping.state')
    .trim()
    .notEmpty().withMessage('State is required'),
  body('shipping.zip')
    .trim()
    .notEmpty().withMessage('ZIP code is required'),
  body('shipping.phone')
    .trim()
    .notEmpty().withMessage('Phone number is required'),
  handleValidationErrors,
];

// ============================================
// SUPPORT TICKET VALIDATORS
// ============================================
export const validateCreateTicket = [
  body('subject')
    .trim()
    .notEmpty().withMessage('Subject is required')
    .isLength({ max: 255 }).withMessage('Subject must be under 255 characters'),
  body('category')
    .optional()
    .isIn(['general', 'order', 'return', 'product', 'technical'])
    .withMessage('Invalid category'),
  body('message')
    .trim()
    .notEmpty().withMessage('Message is required')
    .isLength({ max: 5000 }).withMessage('Message must be under 5000 characters'),
  body('orderId')
    .optional({ values: 'null' })
    .isUUID().withMessage('Invalid order ID'),
  handleValidationErrors,
];

// ============================================
// PRODUCT VALIDATORS (Admin)
// ============================================
export const validateCreateProduct = [
  body('name')
    .trim()
    .notEmpty().withMessage('Product name is required')
    .isLength({ max: 255 }).withMessage('Name must be under 255 characters'),
  body('price')
    .notEmpty().withMessage('Price is required')
    .isFloat({ min: 0 }).withMessage('Price must be non-negative'),
  body('category')
    .trim()
    .notEmpty().withMessage('Category is required'),
  body('emoji')
    .optional()
    .trim(),
  body('description')
    .optional()
    .trim(),
  body('colors')
    .optional()
    .isArray().withMessage('Colors must be an array'),
  body('features')
    .optional()
    .isArray().withMessage('Features must be an array'),
  body('inStock')
    .optional()
    .isBoolean().withMessage('inStock must be a boolean'),
  handleValidationErrors,
];

export const validateUpdateProduct = [
  param('id')
    .isInt({ min: 1 }).withMessage('Invalid product ID'),
  body('name')
    .optional()
    .trim()
    .isLength({ max: 255 }).withMessage('Name must be under 255 characters'),
  body('price')
    .optional()
    .isFloat({ min: 0 }).withMessage('Price must be non-negative'),
  body('category')
    .optional()
    .trim(),
  body('inStock')
    .optional()
    .isBoolean().withMessage('inStock must be a boolean'),
  handleValidationErrors,
];
