# BOMForge Architecture Documentation

## Project Structure

This project follows **Clean Architecture** principles, organized into distinct layers with clear boundaries.

```
src/
├── domain/          # Core business logic (entities, value objects, domain services)
├── application/     # Use cases and application services
├── infrastructure/  # External concerns (IndexedDB, file system, APIs)
└── presentation/    # UI layer (components, views, stores, router)
    ├── components/  # Reusable UI components
    ├── views/       # Page-level components
    ├── stores/      # Pinia stores (thin orchestration)
    ├── router/      # Vue Router configuration
    └── locales/     # i18n translations
```

## Layer Responsibilities

### Domain Layer (`src/domain/`)
- **Pure business logic** - no dependencies on frameworks or infrastructure
- Contains:
  - Entities (Material, Product, BomVersion, etc.)
  - Value Objects (Quantity, Price, etc.)
  - Domain Services (UnitConverter, BomValidator, CostCalculator)
- **Rule**: No imports from `application/`, `infrastructure/`, or `presentation/`

### Application Layer (`src/application/`)
- **Use cases** - orchestrates domain logic
- Contains:
  - Use case classes/functions (CreateMaterial, UpdateMaterialPrice, etc.)
  - Application services
- **Rule**: Can import from `domain/` only. No UI or infrastructure dependencies.

### Infrastructure Layer (`src/infrastructure/`)
- **External concerns** - data persistence, file I/O, external APIs
- Contains:
  - IndexedDB repositories (Dexie.js)
  - Image compression utilities
  - Export/import handlers
- **Rule**: Can import from `domain/` and `application/`. No UI dependencies.

### Presentation Layer (`src/presentation/`)
- **UI components and state management**
- Contains:
  - Vue components and views
  - Pinia stores (thin - delegate to application layer)
  - Router configuration
  - i18n translations
- **Rule**: Can import from all layers, but business logic should be delegated to application layer.

## Naming Conventions

### Files and Folders
- **Components**: PascalCase (e.g., `MaterialCard.vue`, `BomEditor.vue`)
- **Views**: PascalCase with "View" suffix (e.g., `MaterialsView.vue`, `SettingsView.vue`)
- **Stores**: camelCase with "Store" suffix (e.g., `materialsStore.ts`, `productsStore.ts`)
- **Use Cases**: PascalCase (e.g., `CreateMaterial.ts`, `UpdateMaterialPrice.ts`)
- **Entities**: PascalCase (e.g., `Material.ts`, `Product.ts`)
- **Repositories**: PascalCase with "Repository" suffix (e.g., `MaterialRepository.ts`)

### Code
- **Variables/Functions**: camelCase
- **Classes/Interfaces**: PascalCase
- **Constants**: UPPER_SNAKE_CASE
- **Types**: PascalCase (often with "Type" suffix for discriminated unions)

## Module Boundaries

### Import Rules Summary
```
domain/          → (no imports from other layers)
application/     → domain/
infrastructure/  → domain/, application/
presentation/    → domain/, application/, infrastructure/
```

### Dependency Flow
```
presentation → application → domain
presentation → infrastructure → domain
```

**Never reverse this flow!**

## Data Flow

1. **User Action** → Presentation component
2. **Component** → Calls Pinia store action
3. **Store** → Delegates to application use case
4. **Use Case** → Uses domain services/entities
5. **Use Case** → Calls infrastructure repository
6. **Repository** → Persists to IndexedDB
7. **Response flows back** through the same layers

## State Management

- **Pinia stores** are thin orchestrators
- Business logic lives in application/domain layers
- Stores primarily:
  - Call use cases
  - Manage UI state (loading, errors)
  - Provide reactive data to components

## Testing Strategy (Future)

- **Domain layer**: Pure unit tests (no mocks needed)
- **Application layer**: Unit tests with mocked repositories
- **Infrastructure layer**: Integration tests with test database
- **Presentation layer**: Component tests with mocked stores

## PWA Considerations

- Service Worker handles offline caching
- IndexedDB for local data persistence
- All data operations must work offline
- Export/import for backup/restore

---

*This document should be updated as the architecture evolves.*


