# API Documentation

## Payment & Orders

### Initialize Transaction
Creates a payment link for Paystack.

- **Endpoint**: `POST /api/paystack/initialize`
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "amount": 5000, // Amount in NGN
    "orderId": "uuid-string"
  }
  ```
- **Response**:
  ```json
  {
    "status": true,
    "message": "Authorization URL created",
    "data": {
      "authorization_url": "https://checkout.paystack.com/...",
      "access_code": "...",
      "reference": "..."
    }
  }
  ```

### Create Order
Creates a new order in the system.

- **Endpoint**: `POST /api/orders/create`
- **Body**:
  ```json
  {
    "items": [
      {
        "id": "product-uuid",
        "quantity": 1,
        "price": 5000,
        "variantId": "optional-variant-uuid"
      }
    ],
    "shippingDetails": {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "phone": "08012345678",
      "address": "123 Street",
      "city": "Lagos",
      "state": "Lagos"
    },
    "total": 5000
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "orderId": "new-order-uuid",
    "message": "Order created successfully"
  }
  ```

### Paystack Webhook
Receives events from Paystack to update order status.

- **Endpoint**: `POST /api/paystack/webhook`
- **Headers**:
  - `x-paystack-signature`: HMAC SHA512 signature
- **Events Handled**:
  - `charge.success`: Updates order status to `processing` and payment status to `paid`.
