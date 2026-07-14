# Database Schema & Models

Lumipuchi ERP uses a PostgreSQL relational database. Below are the schema definitions for the implemented modules.

## Modules

### Users & Authentication

#### `users` Table
Stores user account credentials, profile details, and role permissions.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `VARCHAR` | Primary Key, Index | Unique user ID (UUID) |
| `email` | `VARCHAR` | Unique, Index, Nullable=False | User email address used for login |
| `hashed_password` | `VARCHAR` | Nullable=False | Cryptographically hashed password (bcrypt) |
| `name` | `VARCHAR` | Nullable=False | Display name of the user |
| `role` | `ENUM` | Default: `'viewer'`, Nullable=False | Access level (Owner, Manager, Warehouse, Finance, Viewer) |
| `is_active` | `BOOLEAN` | Default: `True`, Nullable=False | User status flag |

##### Role Enumeration (`userrole`)
- `owner`: Full system settings, database management, and administrative control.
- `manager`: Access to Inventory, Suppliers, Purchase Orders, and Reports.
- `warehouse`: Access to warehouse physical stock movements, printing product labels.
- `finance`: Access to Purchase Orders, import costs, foreign exchange rates, and financial reports.
- `viewer`: Read-only access to basic dashboards.
