# E-Commerce API

A robust and scalable e-commerce REST API built with NestJS, Prisma, PostgreSQL, and JWT authentication. This project features a clean architecture with repository pattern, role-based access control, and comprehensive testing.

## Features

- **Authentication & Authorization**
  - JWT-based authentication
  - Local and JWT strategies (Passport)
  - Role-based access control (CUSTOMER, ADMIN, VENDOR)
  - Password hashing with bcrypt

- **User Management**
  - User registration and login
  - User profile management
  - Soft delete support
  - Role-based permissions

- **Product Catalog**
  - Product CRUD with slug-based lookup
  - Product variants and images
  - Filtering by category, price range, featured status
  - Pagination support

- **Categories**
  - Hierarchical categories (parent-child)
  - Category CRUD (Admin only)

- **Shopping Cart**
  - Add, update, remove items
  - Clear entire cart
  - Automatic price tracking

- **Order Management**
  - Create orders from cart
  - Order status tracking (PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED, REFUNDED)
  - Order lookup by ID or order number
  - Cancel orders

- **Payment Processing**
  - Stripe checkout integration
  - Webhook handling for payment events
  - Full and partial refunds
  - Payment validation and idempotency

- **Reviews & Ratings**
  - Product reviews with ratings
  - One review per user per product
  - Verified purchase tracking

- **Shipping Addresses**
  - Multiple addresses per user
  - Default address support

- **Inventory**
  - Stock quantity tracking
  - Reserved stock management

- **Architecture**
  - Clean architecture with repository pattern
  - Generic repository with CRUD operations
  - Soft-deletable repository
  - Custom decorators and guards
  - Global exception filters
  - Standardized response transformation interceptors

- **API Documentation**
  - Swagger/OpenAPI documentation
  - Interactive API explorer

- **Testing**
  - Unit tests for services, controllers, and utilities
  - E2E tests
  - Integration tests
  - Test coverage reporting

## Tech Stack

- **Framework**: NestJS 11
- **Database**: PostgreSQL with Prisma ORM 7
- **Authentication**: Passport.js with JWT
- **Payments**: Stripe
- **Validation**: class-validator & class-transformer
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest & Supertest
- **Language**: TypeScript 5

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ecommerce-api
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ecommerce?schema=public"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-this"
JWT_EXPIRATION="7d"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# App
PORT=3000
NODE_ENV="development"
```

4. Run Prisma migrations:
```bash
npm run prisma:migrate:deploy
```

5. Generate Prisma client:
```bash
npm run prisma:generate
```

## Running the Application

### Development mode
```bash
npm run start:dev
```

### Production mode
```bash
npm run build
npm run start:prod
```

### Debug mode
```bash
npm run start:debug
```

### Docker

Build and run with Docker directly:
```bash
# Build the image
docker build --build-arg DATABASE_URL="postgresql://placeholder" -t ecommerce-api .

# Run the container
docker run -p 3000:3000 --env-file .env ecommerce-api
```

Or use Docker Compose (starts both the API and PostgreSQL):
```bash
docker compose up --build
```

The API will be available at:
- Application: `http://localhost:3000`
- Swagger Documentation: `http://localhost:3000/api`

## API Endpoints

All endpoints are prefixed with `/api/v1`.
For detailed API documentation, visit the Swagger UI at `/api` when the application is running.

## Testing

### Run all tests
```bash
npm run test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run e2e tests
```bash
npm run test:e2e
```

### Generate test coverage
```bash
npm run test:cov
```

## Architecture Patterns

### Repository Pattern
The project uses a generic repository pattern for database operations:

- **ReadRepository**: Read-only operations (find, findAll, count)
- **WriteRepository**: Create, update, delete operations
- **SoftDeletableRepository**: Soft delete support

### Custom Decorators
- `@Public()` - Mark routes as public (bypass JWT guard)
- `@Roles(UserRole.ADMIN)` - Protect routes by role
- `@CurrentUser()` - Get current user from request

### Response Format
All responses are wrapped in a standardized format:
```json
{
  "success": true,
  "data": { },
  "meta": {
    "statusCode": 200,
    "timestamp": "2025-01-01T00:00:00.000Z",
    "path": "/api/v1/products",
    "requestId": "uuid",
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

## Development

### Code Formatting
```bash
npm run format
```

### Linting
```bash
npm run lint
```

### Database Commands
```bash
# Create migration
npm run prisma:migrate:dev

# Deploy migrations
npm run prisma:migrate:deploy

# Open Prisma Studio
npm run prisma:studio

# Validate schema
npm run prisma:validate

# Format schema
npm run prisma:format
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | - |
| `JWT_SECRET` | Secret key for JWT signing | - |
| `JWT_EXPIRATION` | JWT token expiration time | 7d |
| `STRIPE_SECRET_KEY` | Stripe API secret key | - |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | - |
| `PORT` | Application port | 3000 |
| `NODE_ENV` | Environment mode | development |

## Security Features

- Password hashing with bcrypt
- JWT token-based authentication
- Role-based access control (RBAC)
- Input validation with class-validator
- SQL injection protection via Prisma
- Global exception handling
- Request payload whitelisting
- Stripe webhook signature verification

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Author

[kaungkhantdev](https://github.com/kaungkhantdev)

## License

This project is [UNLICENSED](LICENSE).

## Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Passport.js Documentation](http://www.passportjs.org)
- [Stripe Documentation](https://docs.stripe.com)
- [JWT Documentation](https://jwt.io)

## Support

For questions and support, please open an issue in the GitHub repository.
