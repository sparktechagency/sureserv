# Admin Dashboard Testing Guide

This guide provides instructions on how to test the new admin dashboard features.

## Prerequisites

*   An admin user must be created in the database.
*   A valid JWT token for the admin user must be obtained.

## Testing

### 1. Dashboard Overview

*   **Endpoint:** `GET /api/v1/admin/dashboard`
*   **Description:** Get dashboard stats.
*   **Test:**
    1.  Send a `GET` request to the endpoint with the admin JWT token in the `Authorization` header.
    2.  Verify that the response contains the following fields:
        *   `userCount`
        *   `providerCount`
        *   `customerCount`
        *   `orderCount`
        *   `bookingCount`

### 2. User & Service Provider Management

*   **Endpoint:** `GET /api/v1/admin/users`
*   **Description:** Get all users.
*   **Test:**
    1.  Send a `GET` request to the endpoint with the admin JWT token in the `Authorization` header.
    2.  Verify that the response contains a list of all users.

*   **Endpoint:** `GET /api/v1/admin/providers`
*   **Description:** Get all service providers.
*   **Test:**
    1.  Send a `GET` request to the endpoint with the admin JWT token in the `Authorization` header.
    2.  Verify that the response contains a list of all service providers.

*   **Endpoint:** `PUT /api/v1/admin/providers/:id/approve`
*   **Description:** Approve a service provider.
*   **Test:**
    1.  Send a `PUT` request to the endpoint with the admin JWT token in the `Authorization` header and the provider ID in the URL.
    2.  Verify that the response contains the message `Provider approved successfully`.

*   **Endpoint:** `PUT /api/v1/admin/users/:id/suspend`
*   **Description:** Suspend a user.
*   **Test:**
    1.  Send a `PUT` request to the endpoint with the admin JWT token in the `Authorization` header and the user ID in the URL.
    2.  Verify that the response contains the message `User suspended successfully`.

*   **Endpoint:** `PUT /api/v1/admin/providers/:id/verify`
*   **Description:** Verify a provider's document.
*   **Test:**
    1.  Send a `PUT` request to the endpoint with the admin JWT token in the `Authorization` header and the provider ID in the URL.
    2.  Verify that the response contains the message `Document verified successfully`.

### 3. Service Request Management

*   **Endpoint:** `GET /api/v1/admin/requests`
*   **Description:** Get all service requests.
*   **Test:**
    1.  Send a `GET` request to the endpoint with the admin JWT token in the `Authorization` header.
    2.  Verify that the response contains a list of all service requests.

*   **Endpoint:** `PUT /api/v1/admin/requests/:id/assign`
*   **Description:** Assign a request to a provider.
*   **Test:**
    1.  Send a `PUT` request to the endpoint with the admin JWT token in the `Authorization` header, the request ID in the URL, and the provider ID in the request body.
    2.  Verify that the response contains the message `Request assigned successfully`.

*   **Endpoint:** `PUT /api/v1/admin/requests/:id/status`
*   **Description:** Update a request's status.
*   **Test:**
    1.  Send a `PUT` request to the endpoint with the admin JWT token in the `Authorization` header, the request ID in the URL, and the new status in the request body.
    2.  Verify that the response contains the message `Request status updated successfully`.

### 4. Payments & Payouts

*   **Endpoint:** `GET /api/v1/admin/transactions`
*   **Description:** Get all transactions.
*   **Test:**
    1.  Send a `GET` request to the endpoint with the admin JWT token in the `Authorization` header.
    2.  Verify that the response contains a list of all transactions.

*   **Endpoint:** `POST /api/v1/admin/payouts`
*   **Description:** Initiate a payout.
*   **Test:**
    1.  Send a `POST` request to the endpoint with the admin JWT token in the `Authorization` header.
    2.  Verify that the response contains the message `Payout initiated successfully`.

### 5. Content & App Configuration

*   **Endpoint:** `POST /api/v1/admin/categories`
*   **Description:** Add a service category.
*   **Test:**
    1.  Send a `POST` request to the endpoint with the admin JWT token in the `Authorization` header and the category name in the request body.
    2.  Verify that the response contains the new service category.

*   **Endpoint:** `PUT /api/v1/admin/categories/:id`
*   **Description:** Update a service category.
*   **Test:**
    1.  Send a `PUT` request to the endpoint with the admin JWT token in the `Authorization` header, the category ID in the URL, and the new category name in the request body.
    2.  Verify that the response contains the updated service category.

*   **Endpoint:** `DELETE /api/v1/admin/categories/:id`
*   **Description:** Delete a service category.
*   **Test:**
    1.  Send a `DELETE` request to the endpoint with the admin JWT token in the `Authorization` header and the category ID in the URL.
    2.  Verify that the response contains the message `Service category deleted successfully`.

*   **Endpoint:** `POST /api/v1/admin/promocodes`
*   **Description:** Create a promo code.
*   **Test:**
    1.  Send a `POST` request to the endpoint with the admin JWT token in the `Authorization` header and the promo code and discount in the request body.
    2.  Verify that the response contains the new promo code.

*   **Endpoint:** `PUT /api/v1/admin/servicefees`
*   **Description:** Update the service fee.
*   **Test:**
    1.  Send a `PUT` request to the endpoint with the admin JWT token in the `Authorization` header and the new service fee in the request body.
    2.  Verify that the response contains the updated service fee.
