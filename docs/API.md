# API Reference

REST APIs exposed by the FastAPI backend server (running at port 8000).

## Authentication Module

### Sign Up User
Create a new user account.
* **URL:** `/auth/signup`
* **Method:** `POST`
* **Content-Type:** `application/json`
* **Request Body:**
  ```json
  {
    "email": "user@domain.com",
    "password": "secretpassword123",
    "name": "Full Name",
    "role": "owner"
  }
  ```
* **Success Response:**
  * **Code:** 201 Created
  * **Payload:**
    ```json
    {
      "id": "uuid-string-value",
      "email": "user@domain.com",
      "name": "Full Name",
      "role": "owner",
      "is_active": true
    }
    ```

### Log In User
Authenticate user and get JWT access token.
* **URL:** `/auth/login`
* **Method:** `POST`
* **Content-Type:** `application/x-www-form-urlencoded`
* **Request Body:**
  * `username`: Email address
  * `password`: Password
* **Success Response:**
  * **Code:** 200 OK
  * **Payload:**
    ```json
    {
      "access_token": "jwt-token-string",
      "token_type": "bearer"
    }
    ```

### Get Current User Profile
Fetch profile details for the currently logged-in session.
* **URL:** `/auth/me`
* **Method:** `GET`
* **Headers:** `Authorization: Bearer <access_token>`
* **Success Response:**
  * **Code:** 200 OK
  * **Payload:**
    ```json
    {
      "id": "uuid-string-value",
      "email": "user@domain.com",
      "name": "Full Name",
      "role": "owner",
      "is_active": true
    }
    ```
