# AGENTS.md

## Purpose

This file is the required reference for every AI coding tool, coding agent, and automated contributor working in this repository. It defines the architecture and development rules that must be followed for all future implementation, refactoring, testing, and documentation work.

When a request conflicts with this document or with the existing implementation, stop and explain the conflict rather than silently replacing working architecture.

## Project overview

This is a monorepository containing three main applications:

- `Server/`: Express.js API, MongoDB/Mongoose data layer, Socket.IO, Cloudinary, Stripe, email, and Swagger.
- `client/`: React customer-facing application built with Vite, Redux Toolkit, React Router, Tailwind CSS, Radix UI, and i18n.
- `admin/`: Angular administration application with SSR support, Angular Material, Tailwind CSS, RxJS, and Chart.js.

The repository intentionally uses both frontend frameworks because it contains two distinct applications:

- React.js is the technology for `client/`.
- Angular is the technology for `admin/`.
- React and Angular must not be mixed within the same application.
- Do not convert either application to a different framework as part of a feature request.

## Technology rules

### Preserve the existing stack

- Use Express.js in `Server/`.
- Use MongoDB and Mongoose for server persistence unless a repository owner explicitly approves a database change.
- Use React 19, Vite, Redux Toolkit, React Router, and the existing UI libraries in `client/`.
- Use Angular, RxJS, Angular Router, Angular SSR, Angular Material, and the existing chart setup in `admin/`.
- Keep CommonJS (`require`/`module.exports`) in `Server/` unless the server is deliberately migrated by a separate, explicitly approved change.
- Keep JSX and JavaScript conventions in `client/` unless a separate TypeScript migration is explicitly approved.
- Keep TypeScript conventions in `admin/`.

Package upgrades are not implicit feature work. Do not upgrade Express, React, Angular, Mongoose, or major libraries solely because newer versions are available. When an upgrade is required, review the current code and compatibility notes, change the smallest set of dependency manifests and lockfiles, run the relevant builds, and preserve all existing behavior.

Use stable compatible versions and the packages already represented in `package.json`. Do not add a package to replace a standard API or a dependency already used for the same purpose.

### Existing external integrations

Preserve and isolate integrations that are already part of the project:

- MongoDB/Mongoose
- JWT authentication
- Socket.IO
- Cloudinary
- Stripe
- Brevo/Nodemailer
- Google Gemini/OpenAI functionality in the React app
- Swagger UI and Swagger JSDoc
- Google Translate, i18n, Leaflet, Three.js, and existing UI packages

Do not remove, duplicate, or bypass integrations. API keys and secrets belong only in environment variables and must never be committed or embedded in source code.

## Repository structure

```text
Server/
  app.js
  config/
  controllers/
  middleware/
  models/
  routes/
  public/
  scripts/
  socket.js
  views/

client/
  src/
    Pages/
    components/
    layout/
    lib/
    store/
      Slices/
    utils/

admin/
  src/
    app/
      Components/
      Guard/
      Models/
      Services/
```

Inspect the target application before choosing a location. Follow the closest existing pattern rather than imposing a new folder convention.

## Backend architecture

`Server/` follows an MVC-style architecture:

- `models/`: Mongoose schemas, indexes, model-level validation, virtuals, and instance methods.
- `controllers/`: HTTP request handling, input orchestration, response formatting, and controller-level error handling.
- `routes/`: Express route definitions, middleware composition, Swagger route annotations, and controller bindings.
- `middleware/`: authentication, authorization, upload, and reusable request guards.
- `config/`: third-party and singleton-style shared configuration.

Keep route handlers thin. Route files must compose middleware and call controllers; they must not contain schema queries or substantial business logic. Move reusable domain logic out of controllers and into model methods or a dedicated service module when that logic is shared. Do not invent a service abstraction for a one-off operation.

### Required backend module direction

Organize each feature or module consistently and separately. For new work, prefer this shape when it is compatible with the existing feature:

```text
Server/
  models/<feature>/
  controllers/<feature>/
  routes/<feature>/
```

Use lowercase or kebab-case for new route filenames and lowerCamelCase for service or helper functions. The repository has some existing mixed naming (for example, `Amenities.model.js`), so do not rename unrelated files or perform a broad migration. Name new Mongoose models and module folders consistently with the feature they represent. Preserve existing public API paths unless changing one is an explicit requirement.

The current flat backend folders are established. Refactor a module incrementally only when a change makes organization meaningfully clearer; do not rewrite all modules merely to normalize names or folders.

### Express and HTTP behavior

- Keep `app.js` responsible for application setup and server bootstrap.
- Use the existing `/api` prefix and route mount conventions.
- Return consistent JSON objects and appropriate HTTP status codes.
- Preserve successful response shapes already consumed by `client/` or `admin/`.
- Validate external input before database or service operations.
- Do not expose passwords, password hashes, salts, reset codes, verification codes, stack traces, or internal database errors to API consumers.
- Centralize 404 and global error behavior in `app.js` unless a scoped and clearly justified change is needed.
- `req.user` is established as the authenticated user object. Controllers must not independently verify JWTs when the authentication middleware has already done so.
- Add Swagger annotations for new or changed public endpoints.
- Use async error handling consistently, with clear 4xx responses for client errors and 5xx responses for server failures.

## React application rules

All customer-facing UI changes belong in `client/` unless a request explicitly targets the admin application.

- Pages belong in `src/Pages/` and represent routable application views.
- Reusable UI belongs in `src/components/`.
- Feature components should remain organized with related host, listing, booking, search, user, or help components.
- Global layout belongs in `src/layout/`.
- Redux slices belong in `src/store/Slices/`; register each slice in `src/store/store.js`.
- Shared utilities belong in `src/utils/`.
- Tailwind and existing Radix-based `src/components/ui/` primitives are the default UI approach.
- Use the existing `@/` alias only when `jsconfig.json` is sufficient for the change and keep imports consistent within the touched area.
- Use React Router route and guard patterns already used in `src/App.jsx`.
- Use Redux Toolkit for state that is currently or reasonably intended to be global; do not move local component state to Redux unnecessarily.
- Preserve loading, empty, error, confirmation, and authorization states.
- Use `react-hook-form` and Zod where form validation follows the existing stack.
- Use existing i18n keys/locales for user-visible text rather than introducing untranslated strings.
- Reuse existing UI components and helpers before creating new primitives.
- Keep accessibility in mind: semantic elements, labels, keyboard interaction, focus behavior, and meaningful text.
- Do not add inline styles or duplicate UI patterns when existing components or Tailwind utilities cover the need.

## Angular application rules

All administration changes belong in `admin/` unless a request explicitly targets the customer application or shared server behavior.

- Routable views belong in `src/app/Components/`.
- Types and response models belong in `src/app/Models/`.
- API and domain services belong in `src/app/Services/`.
- Authentication guards belong in `src/app/Guard/`.
- Follow Angular dependency injection and `providedIn: 'root'` for appropriate application services.
- Follow the standalone/component and zoneless-change-detection patterns already used by the app.
- Register routes in `app.routes.ts` and providers in `app.config.ts`.
- Use Angular Material and Tailwind conventions already present in the application.
- Use RxJS observables and operators consistently for HTTP and asynchronous flows.
- Preserve SSR compatibility. Do not access `window`, `document`, or browser-only APIs without a platform guard.
- Update Angular models and HTTP services together when response contracts change.
- Keep `auth.interceptor.ts` and auth service behavior aligned with backend authentication.

## Authentication and authorization

JWT is the required authentication mechanism.

- Keep `JWT_SECRET` in environment configuration and verify that it exists at startup.
- Generate tokens only after successful credential or verification checks.
- Sign tokens with an explicit expiration and a minimal payload.
- Verify tokens through one authentication middleware in server request flows.
- Attach the verified Mongoose user to `req.user`.
- Protect private endpoints with authentication middleware before controllers are invoked.
- Apply role middleware after authentication for admin or host-only routes.
- Perform ownership checks in controllers or domain logic, especially for listings, experiences, services, bookings, messages, reports, and wishlists.
- Do not trust role or ownership values supplied by the request body.
- Use both authentication and authorization: valid login is not sufficient for protected or privileged operations.
- Do not log or expose raw tokens.
- Use HttpOnly, Secure where HTTPS is used, and appropriate SameSite cookie settings for browser authentication.
- Existing cookie-based clients must remain compatible unless an explicit migration is requested.
- Where bearer tokens are accepted, validate them through the same middleware and never accept arbitrary headers or duplicate authentication implementations.
- Passwords must be hashed with bcrypt. Never store or return raw passwords.
- Verification and password-reset codes must be treated as secrets and must expire or be cleared after use.
- Never weaken CORS, CSRF, cookie, or role protections to make a test or integration pass.

## Singleton pattern

Use the Singleton pattern only for shared process-level resources that should have one lifecycle:

- database connection setup
- configuration/bootstrap services
- shared Cloudinary configuration
- logger or metrics resources
- the Socket.IO server instance

Mongoose's connection module and the existing `initializeSocket(server)` pattern are examples of intended shared resources. Do not add singleton classes, global state, or exported mutable instances for ordinary models or controllers.

For frontend shared services, Angular's root-provided services and Redux's single configured store already satisfy shared-state needs. Do not create additional Singleton abstractions unless a concrete resource lifecycle requires it.

## Code quality

All changes must follow clean code and SOLID principles where applicable:

- Each function should have one clear responsibility.
- Prefer small, named functions and existing helpers.
- Avoid code duplication and copy-pasted controller, component, or service blocks.
- Extract shared logic when it is used by more than one module or flow.
- Keep public interfaces explicit and replace broad, untyped objects with clear parameters or models where practical.
- Remove dead code only when it is directly tied to the requested change and can be removed safely.
- Do not rename, move, or delete existing files without a clear requirement and migration plan.
- Match existing semicolon usage and quote style inside the file or module being modified.
- Avoid unrelated formatting changes.
- Add comments only for non-obvious business rules or integration constraints.
- Do not leave TODOs, debug logs, or temporary branches in completed work.
- Surface errors explicitly and never swallow exceptions or provide success-shaped fallbacks.
- Keep secrets, environment-specific URLs, and infrastructure details out of source files.

## Data and API changes

- Add Mongoose indexes for query fields that need them.
- Include schema validation for required fields and enums.
- Review existing references and population behavior before changing relationships.
- Preserve backward compatibility for API fields consumed by existing clients.
- Add migration or data-backfill logic only when a schema change cannot be backward-compatible.
- Validate request bodies and path parameters before database operations.
- Use Mongoose operations safely: avoid unbounded queries and protect against unintended updates or deletions.
- Ownership and role checks must be enforced server-side for every mutation.
- When extending a payload, keep unrelated fields intact and update the shared React/Angular models and slices/services.
- For Stripe and Cloudinary callbacks, preserve signature verification and upload cleanup/error behavior.

## Testing and validation

Before completing work:

1. Identify the smallest relevant test/build/lint command.
2. Run it and inspect the actual result.
3. Add focused tests for behavior introduced or changed.
4. Do not claim that work is complete if validation is unavailable or fails.

Commands:

```powershell
# Customer React application
cd client
npm run lint
npm run build

# Angular admin application
cd admin
npm run build
npm test -- --watch=false

# Express server
cd Server
npm start
```

The server currently has no configured automated test script. Do not invent a test runner only to satisfy a feature request; use a relevant existing framework or make an explicit, scoped test setup change if testing is required.

Tests should cover real behavior and edge cases:

- authentication and role/ownership authorization
- database and API error paths
- React route guards and Redux state transitions
- Angular guard, service, and HTTP behavior
- validation for new request fields
- no extra test for constants or framework-generated behavior

## Change workflow

During implementation:

- Do not delete or rewrite existing code without a clear reason.
- Do not make architectural changes before understanding the current implementation.
- Do not install dependencies unless they are needed for the requirement and no existing package satisfies it.
- Do not mix feature work with unrelated cleanup or dependency upgrades.
- Do not rename public routes or UI behavior merely for style.
- Keep secrets and `.env` files out of diffs.
- Never modify or expose `Server/.env` or the existing local environment configuration.
- Preserve the current `Server/.env` and all existing credentials and integrations.

## Completion checklist

A change is complete only when it satisfies all applicable items:

- Existing functionality remains intact.
- All touched modules follow MVC or the nearest existing application architecture.
- Private server endpoints require authentication and relevant authorization.
- New request and response shapes are validated and documented.
- React and Angular state/API contracts remain synchronized with the server.
- No unnecessary dependencies or framework changes were introduced.
- No secrets or generated credentials were added.
- Reusable components, services, helpers, and patterns were used.
- Relevant lint, build, and tests passed.
