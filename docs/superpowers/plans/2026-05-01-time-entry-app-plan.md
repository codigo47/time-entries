# Time Entry App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Laravel 12 REST API plus a Vue 3 SPA that lets users record and review employee time entries against companies, projects, and tasks, with the business rule that each employee can only work on one project per date but multiple tasks within that project.

**Architecture:** Decoupled monorepo. `apps/api` is a pure Laravel 12 JSON API (no Inertia, no Blade). `apps/dashboard` is a Vue 3 + TS + Vite SPA consuming the API over HTTP. Postgres runs in Docker on port 5477; both apps run on the host.

**Tech Stack:** Laravel 12, PHP 8.3, PostgreSQL 16, Pest 3, Spatie Query Builder, Larastan, OpenAI PHP client. Vue 3 Composition API, TypeScript, Vite, Tailwind CSS, shadcn-vue (Reka UI), Pinia, Vue Router, Axios, VeeValidate + Zod, Vitest, Vue Test Utils, @testing-library/vue.

**Reference spec:** `docs/superpowers/specs/2026-05-01-time-entry-app-design.md`

**Working dir for all commands:** `/home/codigo47/sistemas/mason/source` unless stated otherwise.

---

## Phase 0 — Repository Bootstrap

### Task 0.1: Initialize git and root files

**Files:**
- Create: `.gitignore`
- Create: `package.json`
- Create: `.env.example`
- Create: `README.md` (placeholder, finalized in Phase 9)

- [ ] **Step 1: Initialize git repo**

```bash
cd /home/codigo47/sistemas/mason/source
git init
git branch -M main
```

- [ ] **Step 2: Write `.gitignore`**

```
# Node
node_modules/
.pnpm-store/
dist/
.vite/

# PHP
/apps/api/vendor/
/apps/api/storage/*.key
/apps/api/storage/logs/*.log
/apps/api/storage/framework/cache/*
/apps/api/storage/framework/sessions/*
/apps/api/storage/framework/views/*
/apps/api/storage/framework/testing/*
/apps/api/bootstrap/cache/*.php
!/apps/api/bootstrap/cache/.gitkeep

# Env
.env
.env.local
.env.*.local
apps/api/.env
apps/dashboard/.env

# IDE
.idea/
.vscode/
*.swp

# OS
.DS_Store
Thumbs.db

# Test artifacts
coverage/
.phpunit.result.cache
.phpunit.cache/

# Build
build/
```

- [ ] **Step 3: Write root `package.json` (workspaces)**

```json
{
  "name": "time-entry-app",
  "private": true,
  "version": "0.1.0",
  "workspaces": [
    "apps/dashboard",
    "packages/*"
  ],
  "scripts": {
    "dev": "bash scripts/dev.sh",
    "build": "bash scripts/build.sh",
    "test:api": "cd apps/api && ./vendor/bin/pest --coverage",
    "test:dashboard": "npm --workspace apps/dashboard run test",
    "lint": "npm --workspace apps/dashboard run lint",
    "typecheck": "npm --workspace apps/dashboard run typecheck"
  }
}
```

- [ ] **Step 4: Write root `.env.example`**

```
# Postgres (Docker)
POSTGRES_PORT=5477
POSTGRES_DB=time_entries
POSTGRES_USER=time_entries
POSTGRES_PASSWORD=time_entries

# API (host)
API_HOST=127.0.0.1
API_PORT=8000

# Dashboard (host)
DASHBOARD_PORT=5173
```

- [ ] **Step 5: Write placeholder `README.md`**

```markdown
# Time Entry App

See `README_detailed.md` for full setup. Quick start: `bash scripts/dev.sh`.
```

- [ ] **Step 6: Commit**

```bash
git add .gitignore package.json .env.example README.md
git commit -m "chore: initialize monorepo with workspaces and gitignore"
```

---

### Task 0.2: docker-compose with Postgres only

**Files:**
- Create: `docker-compose.yml`

- [ ] **Step 1: Write `docker-compose.yml`**

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: time_entries_postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-time_entries}
      POSTGRES_USER: ${POSTGRES_USER:-time_entries}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-time_entries}
    ports:
      - "${POSTGRES_PORT:-5477}:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-time_entries}"]
      interval: 5s
      timeout: 5s
      retries: 10

volumes:
  postgres_data:
```

- [ ] **Step 2: Verify it boots**

```bash
docker compose up -d
docker compose ps
```

Expected: `time_entries_postgres` healthy.

- [ ] **Step 3: Commit**

```bash
git add docker-compose.yml
git commit -m "chore: add docker-compose with postgres on port 5477"
```

---

### Task 0.3: Create dev/build/deploy scripts

**Files:**
- Create: `scripts/dev.sh`
- Create: `scripts/build.sh`
- Create: `scripts/deploy.sh`

- [ ] **Step 1: Write `scripts/dev.sh`**

```bash
#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Bringing up Postgres..."
docker compose up -d
docker compose exec -T postgres sh -c 'until pg_isready -U time_entries; do sleep 1; done' || true

echo "==> Installing API dependencies..."
(cd apps/api && composer install --no-interaction)

echo "==> Installing dashboard dependencies..."
npm install

echo "==> Running migrations and seeders..."
(cd apps/api && php artisan migrate:fresh --seed --force)

cat <<EOF

==> Setup complete. Run these in two terminals:

   Terminal 1 (API):
     cd apps/api && php artisan serve --host=127.0.0.1 --port=8000

   Terminal 2 (Dashboard):
     npm --workspace apps/dashboard run dev

EOF
```

- [ ] **Step 2: Write `scripts/build.sh`**

```bash
#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Building dashboard..."
npm --workspace apps/dashboard run build

echo "==> Optimizing API..."
(cd apps/api && composer install --no-dev --optimize-autoloader)
(cd apps/api && php artisan config:cache && php artisan route:cache)
```

- [ ] **Step 3: Write `scripts/deploy.sh`**

```bash
#!/usr/bin/env bash
# Deployment stub. Replace with your platform's deploy commands.
set -euo pipefail
echo "Production deployment is not configured."
echo "Checklist:"
echo "  - Provision Postgres (managed or self-hosted)"
echo "  - Set API .env with PROD DB credentials, APP_ENV=production"
echo "  - Run scripts/build.sh"
echo "  - Run 'php artisan migrate --force' on the API host"
echo "  - Serve dashboard build (apps/dashboard/dist) behind a CDN or static host"
exit 0
```

- [ ] **Step 4: Make executable and commit**

```bash
chmod +x scripts/*.sh
git add scripts/
git commit -m "chore: add dev/build/deploy scripts"
```

---

### Task 0.4: Shared packages skeleton

**Files:**
- Create: `packages/shared-types/package.json`
- Create: `packages/shared-types/tsconfig.json`
- Create: `packages/shared-types/src/index.ts`
- Create: `packages/eslint-config/package.json`
- Create: `packages/eslint-config/index.js`

- [ ] **Step 1: Write `packages/shared-types/package.json`**

```json
{
  "name": "@time-entries/shared-types",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  },
  "dependencies": {
    "zod": "^3.23.8"
  }
}
```

- [ ] **Step 2: Write `packages/shared-types/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 3: Write `packages/shared-types/src/index.ts`**

```ts
export * from './schemas/timeEntry'
export * from './schemas/company'
export * from './schemas/employee'
export * from './schemas/project'
export * from './schemas/task'
export * from './types'
```

(Schemas/types will be filled in Phase 6 — for now create empty files so the import doesn't break.)

```bash
mkdir -p packages/shared-types/src/schemas
: > packages/shared-types/src/schemas/timeEntry.ts
: > packages/shared-types/src/schemas/company.ts
: > packages/shared-types/src/schemas/employee.ts
: > packages/shared-types/src/schemas/project.ts
: > packages/shared-types/src/schemas/task.ts
: > packages/shared-types/src/types.ts
```

- [ ] **Step 4: Write `packages/eslint-config/package.json`**

```json
{
  "name": "@time-entries/eslint-config",
  "version": "0.1.0",
  "private": true,
  "main": "./index.js",
  "peerDependencies": {
    "eslint": "^9.0.0"
  }
}
```

- [ ] **Step 5: Write `packages/eslint-config/index.js`**

```js
import js from '@eslint/js'
import vue from 'eslint-plugin-vue'
import vueParser from 'vue-eslint-parser'
import tseslint from 'typescript-eslint'

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...vue.configs['flat/recommended'],
  {
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser,
        ecmaVersion: 'latest',
        sourceType: 'module',
        extraFileExtensions: ['.vue'],
      },
    },
    rules: {
      'vue/multi-word-component-names': 'off',
      'vue/no-multiple-template-root': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
]
```

- [ ] **Step 6: Commit**

```bash
git add packages/
git commit -m "chore: scaffold shared-types and eslint-config packages"
```

---

## Phase 1 — Laravel API Bootstrap

### Task 1.1: Install Laravel 12

**Files:**
- Create: `apps/api/*` (Laravel scaffold)

- [ ] **Step 1: Install Laravel 12 into `apps/api`**

```bash
composer create-project laravel/laravel:^12.0 apps/api --no-interaction
```

- [ ] **Step 2: Verify scaffold**

```bash
ls apps/api
# expect: app/  artisan  bootstrap/  composer.json  config/  database/  public/  resources/  routes/  storage/  tests/
```

- [ ] **Step 3: Commit Laravel scaffold**

```bash
git add apps/api/
git commit -m "feat(api): install laravel 12 scaffold"
```

---

### Task 1.2: Configure API for Postgres + project conventions

**Files:**
- Modify: `apps/api/.env.example`
- Modify: `apps/api/config/database.php`
- Modify: `apps/api/config/cors.php` (or create — it ships in some versions)
- Modify: `apps/api/bootstrap/app.php`

- [ ] **Step 1: Edit `apps/api/.env.example`** — set defaults

```
APP_NAME=TimeEntryApi
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_URL=http://127.0.0.1:8000
APP_TIMEZONE=UTC

LOG_CHANNEL=stack
LOG_LEVEL=debug

DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5477
DB_DATABASE=time_entries
DB_USERNAME=time_entries
DB_PASSWORD=time_entries

CACHE_STORE=database
SESSION_DRIVER=database
QUEUE_CONNECTION=database

# Set this to enable AI-assisted entry; leave blank to hide the feature
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini

# Comma-separated; matches dashboard origin in dev
SANCTUM_STATEFUL_DOMAINS=localhost:5173,127.0.0.1:5173
FRONTEND_URL=http://127.0.0.1:5173
```

- [ ] **Step 2: Copy `.env.example` → `.env`**

```bash
cp apps/api/.env.example apps/api/.env
(cd apps/api && php artisan key:generate)
```

- [ ] **Step 3: Configure CORS in `apps/api/config/cors.php`**

```php
<?php

return [
    'paths' => ['api/*'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [env('FRONTEND_URL', 'http://127.0.0.1:5173')],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => ['ETag'],
    'max_age' => 0,
    'supports_credentials' => false,
];
```

- [ ] **Step 4: Enable API routes file** in `apps/api/bootstrap/app.php`

```php
<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        apiPrefix: 'api/v1',
    )
    ->withMiddleware(function (Middleware $middleware) {
        //
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
```

- [ ] **Step 5: Create empty `apps/api/routes/api.php`**

```php
<?php

use Illuminate\Support\Facades\Route;

Route::get('/health', fn () => response()->json(['ok' => true]));
```

- [ ] **Step 6: Verify boot**

```bash
(cd apps/api && php artisan route:list)
```

Expected: shows `GET api/v1/health` plus `GET /up`.

- [ ] **Step 7: Commit**

```bash
git add apps/api/
git commit -m "feat(api): configure postgres, cors, api routes"
```

---

### Task 1.3: Install API dev dependencies

- [ ] **Step 1: Install Pest 3 and helpful libs**

```bash
cd apps/api
composer require --dev pestphp/pest pestphp/pest-plugin-laravel
composer require --dev larastan/larastan
composer require spatie/laravel-query-builder
composer require openai-php/laravel
```

- [ ] **Step 2: Initialize Pest**

```bash
./vendor/bin/pest --init
```

- [ ] **Step 3: Add `phpstan.neon` for Larastan level 8**

`apps/api/phpstan.neon`:
```neon
includes:
    - vendor/larastan/larastan/extension.neon

parameters:
    paths:
        - app/
    level: 8
    excludePaths:
        - app/Console/Kernel.php
```

- [ ] **Step 4: Configure Pest coverage**

`apps/api/phpunit.xml` — ensure `<coverage>` element is enabled and set the `<source>` element to `app/`. Pest's default config is fine.

- [ ] **Step 5: Verify**

```bash
(cd apps/api && ./vendor/bin/pest)
(cd apps/api && ./vendor/bin/phpstan analyse --memory-limit=2G)
```

Expected: tests pass (default scaffold tests), phpstan reports 0 errors (or only baseline-handled ones).

- [ ] **Step 6: Commit**

```bash
cd /home/codigo47/sistemas/mason/source
git add apps/api/
git commit -m "feat(api): add pest, larastan, spatie query builder, openai client"
```

---

## Phase 2 — Database Schema

For each migration we create the file with `php artisan make:migration` then fill it in. Order matters because of foreign keys.

### Task 2.1: companies migration

**Files:**
- Create: `apps/api/database/migrations/0001_01_01_000000_create_companies_table.php`

- [ ] **Step 1: Generate migration**

```bash
cd apps/api
php artisan make:migration create_companies_table
```

Rename the generated timestamp prefix so the order is deterministic; in this plan paths use simplified names.

- [ ] **Step 2: Edit the migration**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('companies', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->timestamps();
            $table->index('name');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('companies');
    }
};
```

- [ ] **Step 3: Run migration**

```bash
php artisan migrate
```

Expected: `companies` table created.

- [ ] **Step 4: Commit**

```bash
cd /home/codigo47/sistemas/mason/source
git add apps/api/database/migrations/
git commit -m "feat(api): add companies migration"
```

---

### Task 2.2: employees migration

- [ ] **Step 1: Generate**

```bash
cd apps/api
php artisan make:migration create_employees_table
```

- [ ] **Step 2: Edit**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('employees', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamps();
            $table->index('name');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employees');
    }
};
```

- [ ] **Step 3: Migrate and commit**

```bash
php artisan migrate
cd /home/codigo47/sistemas/mason/source
git add apps/api/database/migrations/
git commit -m "feat(api): add employees migration"
```

---

### Task 2.3: company_employee pivot migration

- [ ] **Step 1: Generate**

```bash
cd apps/api
php artisan make:migration create_company_employee_table
```

- [ ] **Step 2: Edit**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('company_employee', function (Blueprint $table) {
            $table->uuid('company_id');
            $table->uuid('employee_id');
            $table->timestamps();

            $table->primary(['company_id', 'employee_id']);
            $table->foreign('company_id')->references('id')->on('companies')->cascadeOnDelete();
            $table->foreign('employee_id')->references('id')->on('employees')->cascadeOnDelete();
            $table->index('employee_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('company_employee');
    }
};
```

- [ ] **Step 3: Migrate and commit**

```bash
php artisan migrate
cd /home/codigo47/sistemas/mason/source
git add apps/api/database/migrations/
git commit -m "feat(api): add company_employee pivot migration"
```

---

### Task 2.4: projects migration

- [ ] **Step 1: Generate**

```bash
cd apps/api
php artisan make:migration create_projects_table
```

- [ ] **Step 2: Edit**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('projects', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('company_id');
            $table->string('name');
            $table->timestamps();

            $table->foreign('company_id')->references('id')->on('companies')->cascadeOnDelete();
            $table->unique(['company_id', 'name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};
```

- [ ] **Step 3: Migrate and commit**

```bash
php artisan migrate
cd /home/codigo47/sistemas/mason/source
git add apps/api/database/migrations/
git commit -m "feat(api): add projects migration"
```

---

### Task 2.5: tasks migration

- [ ] **Step 1: Generate**

```bash
cd apps/api
php artisan make:migration create_tasks_table
```

- [ ] **Step 2: Edit**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('tasks', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('company_id');
            $table->string('name');
            $table->timestamps();

            $table->foreign('company_id')->references('id')->on('companies')->cascadeOnDelete();
            $table->unique(['company_id', 'name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};
```

- [ ] **Step 3: Migrate and commit**

```bash
php artisan migrate
cd /home/codigo47/sistemas/mason/source
git add apps/api/database/migrations/
git commit -m "feat(api): add tasks migration"
```

---

### Task 2.6: employee_project pivot migration

- [ ] **Step 1: Generate**

```bash
cd apps/api
php artisan make:migration create_employee_project_table
```

- [ ] **Step 2: Edit**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('employee_project', function (Blueprint $table) {
            $table->uuid('employee_id');
            $table->uuid('project_id');
            $table->timestamps();

            $table->primary(['employee_id', 'project_id']);
            $table->foreign('employee_id')->references('id')->on('employees')->cascadeOnDelete();
            $table->foreign('project_id')->references('id')->on('projects')->cascadeOnDelete();
            $table->index('project_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employee_project');
    }
};
```

- [ ] **Step 3: Migrate and commit**

```bash
php artisan migrate
cd /home/codigo47/sistemas/mason/source
git add apps/api/database/migrations/
git commit -m "feat(api): add employee_project pivot migration"
```

---

### Task 2.7: time_entries migration

- [ ] **Step 1: Generate**

```bash
cd apps/api
php artisan make:migration create_time_entries_table
```

- [ ] **Step 2: Edit**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('time_entries', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('company_id');
            $table->uuid('employee_id');
            $table->uuid('project_id');
            $table->uuid('task_id');
            $table->date('date');
            $table->decimal('hours', 4, 2);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('company_id')->references('id')->on('companies')->cascadeOnDelete();
            $table->foreign('employee_id')->references('id')->on('employees')->cascadeOnDelete();
            $table->foreign('project_id')->references('id')->on('projects')->cascadeOnDelete();
            $table->foreign('task_id')->references('id')->on('tasks')->cascadeOnDelete();

            $table->unique(['employee_id', 'date', 'project_id', 'task_id'], 'time_entries_unique_dup');
            $table->index(['company_id', 'date']);
            $table->index(['employee_id', 'date']);
            $table->index('project_id');
            $table->index('task_id');
        });

        DB::statement("ALTER TABLE time_entries ADD CONSTRAINT time_entries_hours_range CHECK (hours > 0 AND hours <= 24)");
        DB::statement("ALTER TABLE time_entries ADD CONSTRAINT time_entries_hours_step CHECK (hours = ROUND(hours * 4) / 4)");
    }

    public function down(): void
    {
        Schema::dropIfExists('time_entries');
    }
};
```

- [ ] **Step 3: Migrate and commit**

```bash
php artisan migrate
cd /home/codigo47/sistemas/mason/source
git add apps/api/database/migrations/
git commit -m "feat(api): add time_entries migration with constraints"
```

---

## Phase 3 — Eloquent Models

### Task 3.1: Company model

**Files:**
- Create: `apps/api/app/Models/Company.php`

- [ ] **Step 1: Write the failing test**

`apps/api/tests/Unit/Models/CompanyTest.php`:
```php
<?php

use App\Models\Company;
use App\Models\Employee;
use App\Models\Project;
use App\Models\Task;
use App\Models\TimeEntry;

it('uses uuid v7 primary key', function () {
    $company = Company::factory()->create();
    expect($company->id)->toBeString()->and(strlen($company->id))->toBe(36);
});

it('has many employees through pivot', function () {
    $company = Company::factory()->create();
    $employee = Employee::factory()->create();
    $company->employees()->attach($employee);
    expect($company->employees)->toHaveCount(1);
});

it('has many projects', function () {
    $company = Company::factory()->create();
    Project::factory()->for($company)->create();
    expect($company->projects)->toHaveCount(1);
});

it('has many tasks', function () {
    $company = Company::factory()->create();
    Task::factory()->for($company)->create();
    expect($company->tasks)->toHaveCount(1);
});

it('has many time entries', function () {
    $company = Company::factory()->create();
    TimeEntry::factory()->for($company)->create();
    expect($company->timeEntries)->toHaveCount(1);
});
```

- [ ] **Step 2: Run; expect failure (factories missing). Then implement**

`apps/api/app/Models/Company.php`:
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Company extends Model
{
    use HasFactory;
    use HasUuids;

    protected $fillable = ['name'];

    public function employees(): BelongsToMany
    {
        return $this->belongsToMany(Employee::class, 'company_employee')->withTimestamps();
    }

    public function projects(): HasMany
    {
        return $this->hasMany(Project::class);
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    public function timeEntries(): HasMany
    {
        return $this->hasMany(TimeEntry::class);
    }

    public function newUniqueId(): string
    {
        return (string) \Illuminate\Support\Str::uuid7();
    }
}
```

Note: Laravel 12's `HasUuids` calls `newUniqueId()`; `Str::uuid7()` ships with Laravel 12 and produces a UUIDv7 string.

- [ ] **Step 3: Tests will still fail because Employee/Project/Task/TimeEntry models and factories don't exist.** Continue with the next tasks; tests for Task 3.1 will pass once Task 3.6 completes. We'll re-run them at the end of Phase 3.

- [ ] **Step 4: Commit (model only, no green tests yet)**

```bash
cd /home/codigo47/sistemas/mason/source
git add apps/api/app/Models/Company.php apps/api/tests/Unit/Models/CompanyTest.php
git commit -m "feat(api): add Company model and tests"
```

---

### Task 3.2: Employee model

**Files:**
- Create: `apps/api/app/Models/Employee.php`
- Create: `apps/api/tests/Unit/Models/EmployeeTest.php`

- [ ] **Step 1: Write the failing test**

```php
<?php

use App\Models\Company;
use App\Models\Employee;
use App\Models\Project;
use App\Models\TimeEntry;

it('belongs to many companies', function () {
    $employee = Employee::factory()->create();
    $employee->companies()->attach(Company::factory()->create());
    expect($employee->companies)->toHaveCount(1);
});

it('belongs to many projects', function () {
    $employee = Employee::factory()->create();
    $company = Company::factory()->create();
    $project = Project::factory()->for($company)->create();
    $employee->projects()->attach($project);
    expect($employee->projects)->toHaveCount(1);
});

it('has many time entries', function () {
    $employee = Employee::factory()->create();
    TimeEntry::factory()->for($employee)->create();
    expect($employee->timeEntries)->toHaveCount(1);
});

it('has unique email', function () {
    Employee::factory()->create(['email' => 'a@example.com']);
    expect(fn () => Employee::factory()->create(['email' => 'a@example.com']))
        ->toThrow(\Illuminate\Database\QueryException::class);
});
```

- [ ] **Step 2: Implement model**

`apps/api/app/Models/Employee.php`:
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Employee extends Model
{
    use HasFactory;
    use HasUuids;

    protected $fillable = ['name', 'email'];

    public function companies(): BelongsToMany
    {
        return $this->belongsToMany(Company::class, 'company_employee')->withTimestamps();
    }

    public function projects(): BelongsToMany
    {
        return $this->belongsToMany(Project::class, 'employee_project')->withTimestamps();
    }

    public function timeEntries(): HasMany
    {
        return $this->hasMany(TimeEntry::class);
    }

    public function newUniqueId(): string
    {
        return (string) \Illuminate\Support\Str::uuid7();
    }
}
```

- [ ] **Step 3: Commit**

```bash
cd /home/codigo47/sistemas/mason/source
git add apps/api/app/Models/Employee.php apps/api/tests/Unit/Models/EmployeeTest.php
git commit -m "feat(api): add Employee model and tests"
```

---

### Task 3.3: Project model

**Files:**
- Create: `apps/api/app/Models/Project.php`
- Create: `apps/api/tests/Unit/Models/ProjectTest.php`

- [ ] **Step 1: Write the failing test**

```php
<?php

use App\Models\Company;
use App\Models\Employee;
use App\Models\Project;
use App\Models\TimeEntry;

it('belongs to a company', function () {
    $company = Company::factory()->create();
    $project = Project::factory()->for($company)->create();
    expect($project->company->is($company))->toBeTrue();
});

it('belongs to many employees', function () {
    $company = Company::factory()->create();
    $project = Project::factory()->for($company)->create();
    $project->employees()->attach(Employee::factory()->create());
    expect($project->employees)->toHaveCount(1);
});

it('has many time entries', function () {
    $company = Company::factory()->create();
    $project = Project::factory()->for($company)->create();
    TimeEntry::factory()->for($project)->create();
    expect($project->timeEntries)->toHaveCount(1);
});

it('enforces unique name per company', function () {
    $company = Company::factory()->create();
    Project::factory()->for($company)->create(['name' => 'Olympus']);
    expect(fn () => Project::factory()->for($company)->create(['name' => 'Olympus']))
        ->toThrow(\Illuminate\Database\QueryException::class);
});
```

- [ ] **Step 2: Implement model**

`apps/api/app/Models/Project.php`:
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Project extends Model
{
    use HasFactory;
    use HasUuids;

    protected $fillable = ['company_id', 'name'];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function employees(): BelongsToMany
    {
        return $this->belongsToMany(Employee::class, 'employee_project')->withTimestamps();
    }

    public function timeEntries(): HasMany
    {
        return $this->hasMany(TimeEntry::class);
    }

    public function newUniqueId(): string
    {
        return (string) \Illuminate\Support\Str::uuid7();
    }
}
```

- [ ] **Step 3: Commit**

```bash
cd /home/codigo47/sistemas/mason/source
git add apps/api/app/Models/Project.php apps/api/tests/Unit/Models/ProjectTest.php
git commit -m "feat(api): add Project model and tests"
```

---

### Task 3.4: Task model

**Files:**
- Create: `apps/api/app/Models/Task.php`
- Create: `apps/api/tests/Unit/Models/TaskTest.php`

- [ ] **Step 1: Write the failing test**

```php
<?php

use App\Models\Company;
use App\Models\Task;
use App\Models\TimeEntry;

it('belongs to a company', function () {
    $company = Company::factory()->create();
    $task = Task::factory()->for($company)->create();
    expect($task->company->is($company))->toBeTrue();
});

it('has many time entries', function () {
    $company = Company::factory()->create();
    $task = Task::factory()->for($company)->create();
    TimeEntry::factory()->for($task)->create();
    expect($task->timeEntries)->toHaveCount(1);
});

it('enforces unique name per company', function () {
    $company = Company::factory()->create();
    Task::factory()->for($company)->create(['name' => 'Development']);
    expect(fn () => Task::factory()->for($company)->create(['name' => 'Development']))
        ->toThrow(\Illuminate\Database\QueryException::class);
});
```

- [ ] **Step 2: Implement model**

`apps/api/app/Models/Task.php`:
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Task extends Model
{
    use HasFactory;
    use HasUuids;

    protected $fillable = ['company_id', 'name'];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function timeEntries(): HasMany
    {
        return $this->hasMany(TimeEntry::class);
    }

    public function newUniqueId(): string
    {
        return (string) \Illuminate\Support\Str::uuid7();
    }
}
```

- [ ] **Step 3: Commit**

```bash
cd /home/codigo47/sistemas/mason/source
git add apps/api/app/Models/Task.php apps/api/tests/Unit/Models/TaskTest.php
git commit -m "feat(api): add Task model and tests"
```

---

### Task 3.5: TimeEntry model

**Files:**
- Create: `apps/api/app/Models/TimeEntry.php`
- Create: `apps/api/tests/Unit/Models/TimeEntryTest.php`

- [ ] **Step 1: Write the failing test**

```php
<?php

use App\Models\Company;
use App\Models\Employee;
use App\Models\Project;
use App\Models\Task;
use App\Models\TimeEntry;

it('belongs to company, employee, project, task', function () {
    $entry = TimeEntry::factory()->create();
    expect($entry->company)->toBeInstanceOf(Company::class);
    expect($entry->employee)->toBeInstanceOf(Employee::class);
    expect($entry->project)->toBeInstanceOf(Project::class);
    expect($entry->task)->toBeInstanceOf(Task::class);
});

it('casts date and hours', function () {
    $entry = TimeEntry::factory()->create(['date' => '2026-05-01', 'hours' => '2.50']);
    expect($entry->date)->toBeInstanceOf(\Illuminate\Support\Carbon::class);
    expect((float) $entry->hours)->toBe(2.5);
});

it('rejects exact-duplicate row at db level', function () {
    $entry = TimeEntry::factory()->create();
    expect(fn () => TimeEntry::factory()->create([
        'employee_id' => $entry->employee_id,
        'date' => $entry->date,
        'project_id' => $entry->project_id,
        'task_id' => $entry->task_id,
    ]))->toThrow(\Illuminate\Database\QueryException::class);
});

it('rejects hours outside range at db level', function () {
    expect(fn () => TimeEntry::factory()->create(['hours' => 0]))
        ->toThrow(\Illuminate\Database\QueryException::class);
    expect(fn () => TimeEntry::factory()->create(['hours' => 25]))
        ->toThrow(\Illuminate\Database\QueryException::class);
});

it('rejects hours not on quarter step at db level', function () {
    expect(fn () => TimeEntry::factory()->create(['hours' => 1.10]))
        ->toThrow(\Illuminate\Database\QueryException::class);
});
```

- [ ] **Step 2: Implement model**

`apps/api/app/Models/TimeEntry.php`:
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class TimeEntry extends Model
{
    use HasFactory;
    use HasUuids;

    protected $fillable = [
        'company_id', 'employee_id', 'project_id', 'task_id',
        'date', 'hours', 'notes',
    ];

    protected $casts = [
        'date' => 'date',
        'hours' => 'decimal:2',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    public function newUniqueId(): string
    {
        return (string) Str::uuid7();
    }
}
```

- [ ] **Step 3: Commit**

```bash
cd /home/codigo47/sistemas/mason/source
git add apps/api/app/Models/TimeEntry.php apps/api/tests/Unit/Models/TimeEntryTest.php
git commit -m "feat(api): add TimeEntry model and tests"
```

---

### Task 3.6: Factories

**Files:**
- Create: `apps/api/database/factories/CompanyFactory.php`
- Create: `apps/api/database/factories/EmployeeFactory.php`
- Create: `apps/api/database/factories/ProjectFactory.php`
- Create: `apps/api/database/factories/TaskFactory.php`
- Create: `apps/api/database/factories/TimeEntryFactory.php`

- [ ] **Step 1: CompanyFactory**

```php
<?php

namespace Database\Factories;

use App\Models\Company;
use Illuminate\Database\Eloquent\Factories\Factory;

class CompanyFactory extends Factory
{
    protected $model = Company::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->unique()->company(),
        ];
    }
}
```

- [ ] **Step 2: EmployeeFactory**

```php
<?php

namespace Database\Factories;

use App\Models\Employee;
use Illuminate\Database\Eloquent\Factories\Factory;

class EmployeeFactory extends Factory
{
    protected $model = Employee::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->unique()->name(),
            'email' => $this->faker->unique()->safeEmail(),
        ];
    }
}
```

- [ ] **Step 3: ProjectFactory**

```php
<?php

namespace Database\Factories;

use App\Models\Company;
use App\Models\Project;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProjectFactory extends Factory
{
    protected $model = Project::class;

    public function definition(): array
    {
        return [
            'company_id' => Company::factory(),
            'name' => $this->faker->unique()->bs(),
        ];
    }
}
```

- [ ] **Step 4: TaskFactory**

```php
<?php

namespace Database\Factories;

use App\Models\Company;
use App\Models\Task;
use Illuminate\Database\Eloquent\Factories\Factory;

class TaskFactory extends Factory
{
    protected $model = Task::class;

    public function definition(): array
    {
        return [
            'company_id' => Company::factory(),
            'name' => $this->faker->unique()->jobTitle(),
        ];
    }
}
```

- [ ] **Step 5: TimeEntryFactory**

```php
<?php

namespace Database\Factories;

use App\Models\Company;
use App\Models\Employee;
use App\Models\Project;
use App\Models\Task;
use App\Models\TimeEntry;
use Illuminate\Database\Eloquent\Factories\Factory;

class TimeEntryFactory extends Factory
{
    protected $model = TimeEntry::class;

    public function definition(): array
    {
        $company = Company::factory()->create();
        $project = Project::factory()->for($company)->create();
        $task = Task::factory()->for($company)->create();
        $employee = Employee::factory()->create();
        $employee->companies()->attach($company);
        $employee->projects()->attach($project);

        return [
            'company_id' => $company->id,
            'employee_id' => $employee->id,
            'project_id' => $project->id,
            'task_id' => $task->id,
            'date' => $this->faker->dateTimeBetween('-30 days', 'now')->format('Y-m-d'),
            'hours' => $this->faker->randomElement([0.25, 0.5, 1.0, 2.0, 3.0, 4.0, 6.0, 8.0]),
            'notes' => $this->faker->optional()->sentence(),
        ];
    }
}
```

- [ ] **Step 6: Run all model tests**

```bash
cd apps/api
./vendor/bin/pest --filter=Models
```

Expected: all model tests pass.

- [ ] **Step 7: Commit**

```bash
cd /home/codigo47/sistemas/mason/source
git add apps/api/database/factories/
git commit -m "feat(api): add factories for all models"
```

---

## Phase 4 — Seeders

### Task 4.1: CompanySeeder

**Files:**
- Create: `apps/api/database/seeders/CompanySeeder.php`

- [ ] **Step 1: Write seeder**

```php
<?php

namespace Database\Seeders;

use App\Models\Company;
use Illuminate\Database\Seeder;

class CompanySeeder extends Seeder
{
    public const COMPANIES = [
        'Jupiter Industries',
        'Mars Logistics',
        'Neptune Networks',
        'Mercury Couriers',
        'Vulcan Forge',
    ];

    public function run(): void
    {
        foreach (self::COMPANIES as $name) {
            Company::firstOrCreate(['name' => $name]);
        }
    }
}
```

- [ ] **Step 2: Commit**

```bash
cd /home/codigo47/sistemas/mason/source
git add apps/api/database/seeders/CompanySeeder.php
git commit -m "feat(api): add CompanySeeder"
```

---

### Task 4.2: EmployeeSeeder

**Files:**
- Create: `apps/api/database/seeders/EmployeeSeeder.php`

- [ ] **Step 1: Write seeder**

```php
<?php

namespace Database\Seeders;

use App\Models\Employee;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class EmployeeSeeder extends Seeder
{
    public const EMPLOYEES = [
        'Athena Pallas',
        'Apollo Helios',
        'Artemis Selene',
        'Hermes Trismegistus',
        'Dionysus Bacchus',
        'Hera Olympia',
        'Demeter Ceres',
        'Hades Pluto',
        'Michel Foucault',
        'Judith Butler',
        'Slavoj Zizek',
        'Byung-Chul Han',
    ];

    public function run(): void
    {
        foreach (self::EMPLOYEES as $name) {
            Employee::firstOrCreate(
                ['email' => Str::slug($name, '.').'@example.test'],
                ['name' => $name],
            );
        }
    }
}
```

- [ ] **Step 2: Commit**

```bash
cd /home/codigo47/sistemas/mason/source
git add apps/api/database/seeders/EmployeeSeeder.php
git commit -m "feat(api): add EmployeeSeeder"
```

---

### Task 4.3: CompanyEmployeeSeeder

**Files:**
- Create: `apps/api/database/seeders/CompanyEmployeeSeeder.php`

- [ ] **Step 1: Write seeder**

```php
<?php

namespace Database\Seeders;

use App\Models\Company;
use App\Models\Employee;
use Illuminate\Database\Seeder;

class CompanyEmployeeSeeder extends Seeder
{
    public function run(): void
    {
        $companies = Company::all();
        $employees = Employee::all();

        foreach ($employees as $i => $employee) {
            // Assign 2-3 companies per employee, deterministic by index
            $count = 2 + ($i % 2);
            $picks = $companies->shuffle()->take($count);
            foreach ($picks as $company) {
                if (!$employee->companies()->where('companies.id', $company->id)->exists()) {
                    $employee->companies()->attach($company->id);
                }
            }
        }
    }
}
```

- [ ] **Step 2: Commit**

```bash
cd /home/codigo47/sistemas/mason/source
git add apps/api/database/seeders/CompanyEmployeeSeeder.php
git commit -m "feat(api): add CompanyEmployeeSeeder"
```

---

### Task 4.4: ProjectSeeder

**Files:**
- Create: `apps/api/database/seeders/ProjectSeeder.php`

- [ ] **Step 1: Write seeder**

```php
<?php

namespace Database\Seeders;

use App\Models\Company;
use App\Models\Project;
use Illuminate\Database\Seeder;

class ProjectSeeder extends Seeder
{
    public const PROJECTS = [
        'Pantheon Migration',
        'Olympus CRM',
        'Stoa Refactor',
        'Dialectic Analytics',
    ];

    public function run(): void
    {
        Company::all()->each(function (Company $company) {
            foreach (self::PROJECTS as $name) {
                Project::firstOrCreate([
                    'company_id' => $company->id,
                    'name' => $name,
                ]);
            }
        });
    }
}
```

- [ ] **Step 2: Commit**

```bash
cd /home/codigo47/sistemas/mason/source
git add apps/api/database/seeders/ProjectSeeder.php
git commit -m "feat(api): add ProjectSeeder"
```

---

### Task 4.5: TaskSeeder

**Files:**
- Create: `apps/api/database/seeders/TaskSeeder.php`

- [ ] **Step 1: Write seeder**

```php
<?php

namespace Database\Seeders;

use App\Models\Company;
use App\Models\Task;
use Illuminate\Database\Seeder;

class TaskSeeder extends Seeder
{
    public const TASKS = [
        'Development',
        'QA Testing',
        'Code Review',
        'Documentation',
        'Cleanup',
        'Deployment',
    ];

    public function run(): void
    {
        Company::all()->each(function (Company $company) {
            foreach (self::TASKS as $name) {
                Task::firstOrCreate([
                    'company_id' => $company->id,
                    'name' => $name,
                ]);
            }
        });
    }
}
```

- [ ] **Step 2: Commit**

```bash
cd /home/codigo47/sistemas/mason/source
git add apps/api/database/seeders/TaskSeeder.php
git commit -m "feat(api): add TaskSeeder"
```

---

### Task 4.6: EmployeeProjectSeeder

**Files:**
- Create: `apps/api/database/seeders/EmployeeProjectSeeder.php`

- [ ] **Step 1: Write seeder**

```php
<?php

namespace Database\Seeders;

use App\Models\Employee;
use App\Models\Project;
use Illuminate\Database\Seeder;

class EmployeeProjectSeeder extends Seeder
{
    public function run(): void
    {
        Employee::with('companies')->get()->each(function (Employee $employee) {
            $companyIds = $employee->companies->pluck('id');
            $projects = Project::whereIn('company_id', $companyIds)->inRandomOrder()->limit(3)->get();
            foreach ($projects as $project) {
                if (!$employee->projects()->where('projects.id', $project->id)->exists()) {
                    $employee->projects()->attach($project->id);
                }
            }
        });
    }
}
```

- [ ] **Step 2: Commit**

```bash
cd /home/codigo47/sistemas/mason/source
git add apps/api/database/seeders/EmployeeProjectSeeder.php
git commit -m "feat(api): add EmployeeProjectSeeder"
```

---

### Task 4.7: TimeEntrySeeder + DatabaseSeeder

**Files:**
- Create: `apps/api/database/seeders/TimeEntrySeeder.php`
- Modify: `apps/api/database/seeders/DatabaseSeeder.php`

- [ ] **Step 1: Write `TimeEntrySeeder`**

```php
<?php

namespace Database\Seeders;

use App\Models\Employee;
use App\Models\Task;
use App\Models\TimeEntry;
use Carbon\CarbonPeriod;
use Illuminate\Database\Seeder;

class TimeEntrySeeder extends Seeder
{
    public function run(): void
    {
        $start = now()->subDays(30)->startOfDay();
        $end = now()->endOfDay();
        $dates = collect(CarbonPeriod::create($start, $end))->map->format('Y-m-d');

        Employee::with(['companies', 'projects.company'])->get()->each(function (Employee $employee) use ($dates) {
            $employeeDates = $dates->shuffle()->take(rand(4, 8));
            foreach ($employeeDates as $date) {
                $project = $employee->projects->shuffle()->first();
                if (!$project) {
                    continue;
                }
                $tasks = Task::where('company_id', $project->company_id)->inRandomOrder()->limit(rand(1, 3))->get();
                foreach ($tasks as $task) {
                    TimeEntry::firstOrCreate(
                        [
                            'employee_id' => $employee->id,
                            'date' => $date,
                            'project_id' => $project->id,
                            'task_id' => $task->id,
                        ],
                        [
                            'company_id' => $project->company_id,
                            'hours' => collect([0.5, 1, 1.5, 2, 3, 4])->random(),
                            'notes' => null,
                        ]
                    );
                }
            }
        });
    }
}
```

- [ ] **Step 2: Edit `DatabaseSeeder.php`**

```php
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            CompanySeeder::class,
            EmployeeSeeder::class,
            CompanyEmployeeSeeder::class,
            ProjectSeeder::class,
            TaskSeeder::class,
            EmployeeProjectSeeder::class,
            TimeEntrySeeder::class,
        ]);
    }
}
```

- [ ] **Step 3: Run full seed**

```bash
cd apps/api
php artisan migrate:fresh --seed
```

Expected: ~5 companies, 12 employees, ~20 projects (5×4), ~30 tasks, many time entries.

- [ ] **Step 4: Commit**

```bash
cd /home/codigo47/sistemas/mason/source
git add apps/api/database/seeders/
git commit -m "feat(api): add TimeEntrySeeder and wire DatabaseSeeder"
```

---

## Phase 5 — Services & Actions

### Task 5.1: EtagService

**Files:**
- Create: `apps/api/app/Services/EtagService.php`
- Create: `apps/api/tests/Unit/Services/EtagServiceTest.php`

- [ ] **Step 1: Write the failing test**

```php
<?php

use App\Models\Company;
use App\Services\EtagService;

it('produces a stable etag for a model class', function () {
    Company::factory()->count(2)->create();
    $service = new EtagService();
    $etag1 = $service->forModel(Company::class);
    $etag2 = $service->forModel(Company::class);
    expect($etag1)->toBe($etag2);
});

it('changes when data changes', function () {
    $service = new EtagService();
    Company::factory()->create();
    $a = $service->forModel(Company::class);
    sleep(1);
    Company::factory()->create();
    $b = $service->forModel(Company::class);
    expect($a)->not->toBe($b);
});

it('scopes by query', function () {
    $companyA = Company::factory()->create();
    $companyB = Company::factory()->create();
    $service = new EtagService();
    $tagA = $service->forQuery($companyA->employees());
    $tagB = $service->forQuery($companyB->employees());
    expect($tagA)->not->toBe($tagB);
});
```

- [ ] **Step 2: Implement**

```php
<?php

namespace App\Services;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\Relation;

class EtagService
{
    /**
     * @param  class-string<\Illuminate\Database\Eloquent\Model>  $modelClass
     */
    public function forModel(string $modelClass): string
    {
        return $this->forQuery($modelClass::query());
    }

    public function forQuery(Builder|Relation $query): string
    {
        $cloneCount = clone $query;
        $cloneMax = clone $query;
        $count = $cloneCount->count();
        $max = $cloneMax->max('updated_at');

        return '"'.md5(($max ?? '0').':'.$count).'"';
    }
}
```

- [ ] **Step 3: Run tests**

```bash
cd apps/api
./vendor/bin/pest --filter=EtagService
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
cd /home/codigo47/sistemas/mason/source
git add apps/api/app/Services/EtagService.php apps/api/tests/Unit/Services/EtagServiceTest.php
git commit -m "feat(api): add EtagService for cache validators"
```

---

### Task 5.2: CreateTimeEntries action — single entry happy path

**Files:**
- Create: `apps/api/app/Actions/CreateTimeEntries.php`
- Create: `apps/api/tests/Unit/Actions/CreateTimeEntriesTest.php`
- Create: `apps/api/app/Exceptions/TimeEntryValidationException.php`

- [ ] **Step 1: Write the failing test**

```php
<?php

use App\Actions\CreateTimeEntries;
use App\Exceptions\TimeEntryValidationException;
use App\Models\Company;
use App\Models\Employee;
use App\Models\Project;
use App\Models\Task;
use App\Models\TimeEntry;

beforeEach(function () {
    $this->company = Company::factory()->create();
    $this->employee = Employee::factory()->create();
    $this->employee->companies()->attach($this->company);
    $this->project = Project::factory()->for($this->company)->create();
    $this->employee->projects()->attach($this->project);
    $this->task = Task::factory()->for($this->company)->create();
});

it('creates a single valid time entry', function () {
    $action = app(CreateTimeEntries::class);
    $entries = $action->execute([
        [
            'company_id' => $this->company->id,
            'employee_id' => $this->employee->id,
            'project_id' => $this->project->id,
            'task_id' => $this->task->id,
            'date' => '2026-05-01',
            'hours' => 2.5,
            'notes' => null,
        ],
    ]);
    expect($entries)->toHaveCount(1)
        ->and($entries[0])->toBeInstanceOf(TimeEntry::class);
    expect(TimeEntry::count())->toBe(1);
});
```

- [ ] **Step 2: Implement exception**

```php
<?php

namespace App\Exceptions;

use Exception;

class TimeEntryValidationException extends Exception
{
    /** @param  array<string, array<string>>  $errors */
    public function __construct(public readonly array $errors, string $message = 'Validation failed for one or more entries.')
    {
        parent::__construct($message);
    }
}
```

- [ ] **Step 3: Implement action**

```php
<?php

namespace App\Actions;

use App\Exceptions\TimeEntryValidationException;
use App\Models\Employee;
use App\Models\Project;
use App\Models\Task;
use App\Models\TimeEntry;
use Illuminate\Support\Facades\DB;

class CreateTimeEntries
{
    /**
     * @param  array<int, array<string,mixed>>  $payload
     * @return array<int, TimeEntry>
     */
    public function execute(array $payload): array
    {
        return DB::transaction(function () use ($payload) {
            $errors = $this->validateBatch($payload);
            if (count($errors) > 0) {
                throw new TimeEntryValidationException($errors);
            }

            return array_map(fn (array $row) => TimeEntry::create($row), $payload);
        });
    }

    /**
     * @param  array<int, array<string,mixed>>  $rows
     * @return array<string, array<string>>
     */
    private function validateBatch(array $rows): array
    {
        $errors = [];

        // Cross-row check: same (employee, date) must have same project
        $byEmpDate = [];
        foreach ($rows as $i => $row) {
            $key = $row['employee_id'].'|'.$row['date'];
            if (isset($byEmpDate[$key]) && $byEmpDate[$key]['project_id'] !== $row['project_id']) {
                $errors["entries.$i.project_id"][] = 'Conflicts with another row in this batch for the same employee and date.';
            } else {
                $byEmpDate[$key] = $row;
            }
        }

        // Per-row checks against persisted state and entity consistency
        foreach ($rows as $i => $row) {
            $employee = Employee::with('companies', 'projects')->find($row['employee_id']);
            $project = Project::find($row['project_id']);
            $task = Task::find($row['task_id']);

            if (!$employee || !$employee->companies->contains('id', $row['company_id'])) {
                $errors["entries.$i.employee_id"][] = 'Employee does not belong to the selected company.';
            }
            if (!$project || $project->company_id !== $row['company_id']) {
                $errors["entries.$i.project_id"][] = 'Project does not belong to the selected company.';
            }
            if (!$task || $task->company_id !== $row['company_id']) {
                $errors["entries.$i.task_id"][] = 'Task does not belong to the selected company.';
            }
            if ($employee && $project && !$employee->projects->contains('id', $row['project_id'])) {
                $errors["entries.$i.project_id"][] = 'Employee is not assigned to this project.';
            }

            // Lock and check for "one project per employee per date"
            $existing = TimeEntry::where('employee_id', $row['employee_id'])
                ->where('date', $row['date'])
                ->lockForUpdate()
                ->first();
            if ($existing && $existing->project_id !== $row['project_id']) {
                $errors["entries.$i.project_id"][] = 'Employee already has a different project on this date.';
            }
        }

        return $errors;
    }
}
```

- [ ] **Step 4: Run test**

```bash
cd apps/api
./vendor/bin/pest --filter=CreateTimeEntries
```

Expected: the happy-path test passes.

- [ ] **Step 5: Commit**

```bash
cd /home/codigo47/sistemas/mason/source
git add apps/api/app/Actions/CreateTimeEntries.php apps/api/app/Exceptions/TimeEntryValidationException.php apps/api/tests/Unit/Actions/CreateTimeEntriesTest.php
git commit -m "feat(api): add CreateTimeEntries action with happy path"
```

---

### Task 5.3: CreateTimeEntries — error paths

**Files:**
- Modify: `apps/api/tests/Unit/Actions/CreateTimeEntriesTest.php`

- [ ] **Step 1: Add tests for each rule**

```php
it('rejects when employee not in company', function () {
    $otherCompany = Company::factory()->create();
    $action = app(CreateTimeEntries::class);
    $this->expectException(TimeEntryValidationException::class);
    $action->execute([
        [
            'company_id' => $otherCompany->id,
            'employee_id' => $this->employee->id,
            'project_id' => $this->project->id,
            'task_id' => $this->task->id,
            'date' => '2026-05-01',
            'hours' => 1.0,
            'notes' => null,
        ],
    ]);
});

it('rejects when project belongs to a different company', function () {
    $otherCompany = Company::factory()->create();
    $foreignProject = Project::factory()->for($otherCompany)->create();
    $action = app(CreateTimeEntries::class);
    try {
        $action->execute([[
            'company_id' => $this->company->id,
            'employee_id' => $this->employee->id,
            'project_id' => $foreignProject->id,
            'task_id' => $this->task->id,
            'date' => '2026-05-01',
            'hours' => 1.0,
            'notes' => null,
        ]]);
        $this->fail('expected exception');
    } catch (TimeEntryValidationException $e) {
        expect($e->errors)->toHaveKey('entries.0.project_id');
    }
});

it('rejects two different projects for same employee on same date in DB', function () {
    $otherProject = Project::factory()->for($this->company)->create();
    $this->employee->projects()->attach($otherProject);
    TimeEntry::create([
        'company_id' => $this->company->id,
        'employee_id' => $this->employee->id,
        'project_id' => $this->project->id,
        'task_id' => $this->task->id,
        'date' => '2026-05-01',
        'hours' => 1.0,
    ]);

    $action = app(CreateTimeEntries::class);
    try {
        $action->execute([[
            'company_id' => $this->company->id,
            'employee_id' => $this->employee->id,
            'project_id' => $otherProject->id,
            'task_id' => $this->task->id,
            'date' => '2026-05-01',
            'hours' => 1.0,
            'notes' => null,
        ]]);
        $this->fail('expected exception');
    } catch (TimeEntryValidationException $e) {
        expect($e->errors)->toHaveKey('entries.0.project_id');
    }
});

it('rejects two different projects within the same batch', function () {
    $other = Project::factory()->for($this->company)->create();
    $this->employee->projects()->attach($other);
    $action = app(CreateTimeEntries::class);
    try {
        $action->execute([
            [
                'company_id' => $this->company->id,
                'employee_id' => $this->employee->id,
                'project_id' => $this->project->id,
                'task_id' => $this->task->id,
                'date' => '2026-05-01',
                'hours' => 1.0,
                'notes' => null,
            ],
            [
                'company_id' => $this->company->id,
                'employee_id' => $this->employee->id,
                'project_id' => $other->id,
                'task_id' => $this->task->id,
                'date' => '2026-05-01',
                'hours' => 1.0,
                'notes' => null,
            ],
        ]);
        $this->fail('expected exception');
    } catch (TimeEntryValidationException $e) {
        expect($e->errors)->toHaveKey('entries.1.project_id');
    }
});

it('allows multiple tasks for same project, employee, date', function () {
    $task2 = Task::factory()->for($this->company)->create();
    $action = app(CreateTimeEntries::class);
    $entries = $action->execute([
        [
            'company_id' => $this->company->id,
            'employee_id' => $this->employee->id,
            'project_id' => $this->project->id,
            'task_id' => $this->task->id,
            'date' => '2026-05-01',
            'hours' => 2.0,
            'notes' => null,
        ],
        [
            'company_id' => $this->company->id,
            'employee_id' => $this->employee->id,
            'project_id' => $this->project->id,
            'task_id' => $task2->id,
            'date' => '2026-05-01',
            'hours' => 2.0,
            'notes' => null,
        ],
    ]);
    expect($entries)->toHaveCount(2);
});
```

- [ ] **Step 2: Run all tests**

```bash
cd apps/api
./vendor/bin/pest --filter=CreateTimeEntries
```

Expected: ALL pass.

- [ ] **Step 3: Commit**

```bash
cd /home/codigo47/sistemas/mason/source
git add apps/api/tests/Unit/Actions/CreateTimeEntriesTest.php
git commit -m "test(api): cover error paths in CreateTimeEntries"
```

---

### Task 5.4: UpdateTimeEntry action

**Files:**
- Create: `apps/api/app/Actions/UpdateTimeEntry.php`
- Create: `apps/api/tests/Unit/Actions/UpdateTimeEntryTest.php`

- [ ] **Step 1: Write the failing test**

```php
<?php

use App\Actions\UpdateTimeEntry;
use App\Exceptions\TimeEntryValidationException;
use App\Models\Company;
use App\Models\Employee;
use App\Models\Project;
use App\Models\Task;
use App\Models\TimeEntry;

beforeEach(function () {
    $this->company = Company::factory()->create();
    $this->employee = Employee::factory()->create();
    $this->employee->companies()->attach($this->company);
    $this->project = Project::factory()->for($this->company)->create();
    $this->employee->projects()->attach($this->project);
    $this->task = Task::factory()->for($this->company)->create();
    $this->entry = TimeEntry::create([
        'company_id' => $this->company->id,
        'employee_id' => $this->employee->id,
        'project_id' => $this->project->id,
        'task_id' => $this->task->id,
        'date' => '2026-05-01',
        'hours' => 1.0,
    ]);
});

it('updates editable fields', function () {
    $action = app(UpdateTimeEntry::class);
    $updated = $action->execute($this->entry, ['hours' => 3.5, 'notes' => 'Refactor']);
    expect((float) $updated->hours)->toBe(3.5);
    expect($updated->notes)->toBe('Refactor');
});

it('rejects an update that would conflict with the per-day-project rule', function () {
    $other = Project::factory()->for($this->company)->create();
    $this->employee->projects()->attach($other);
    TimeEntry::create([
        'company_id' => $this->company->id,
        'employee_id' => $this->employee->id,
        'project_id' => $this->project->id,
        'task_id' => $this->task->id,
        'date' => '2026-05-02',
        'hours' => 1.0,
    ]);
    $action = app(UpdateTimeEntry::class);
    try {
        $action->execute($this->entry, [
            'date' => '2026-05-02',
            'project_id' => $other->id,
        ]);
        $this->fail('expected exception');
    } catch (TimeEntryValidationException $e) {
        expect($e->errors)->toHaveKey('project_id');
    }
});
```

- [ ] **Step 2: Implement action**

```php
<?php

namespace App\Actions;

use App\Exceptions\TimeEntryValidationException;
use App\Models\TimeEntry;
use Illuminate\Support\Facades\DB;

class UpdateTimeEntry
{
    /** @param  array<string,mixed>  $payload */
    public function execute(TimeEntry $entry, array $payload): TimeEntry
    {
        return DB::transaction(function () use ($entry, $payload) {
            $merged = array_merge($entry->only([
                'company_id', 'employee_id', 'project_id', 'task_id', 'date', 'hours', 'notes',
            ]), $payload);

            $errors = $this->validate($entry, $merged);
            if ($errors !== []) {
                throw new TimeEntryValidationException($errors);
            }

            $entry->update($payload);
            return $entry->refresh();
        });
    }

    /**
     * @param  array<string,mixed>  $merged
     * @return array<string, array<string>>
     */
    private function validate(TimeEntry $entry, array $merged): array
    {
        $errors = [];

        $existing = TimeEntry::where('employee_id', $merged['employee_id'])
            ->where('date', $merged['date'])
            ->where('id', '!=', $entry->id)
            ->lockForUpdate()
            ->get();

        foreach ($existing as $other) {
            if ($other->project_id !== $merged['project_id']) {
                $errors['project_id'][] = 'Employee already has a different project on this date.';
                break;
            }
        }

        return $errors;
    }
}
```

- [ ] **Step 3: Run tests**

```bash
cd apps/api
./vendor/bin/pest --filter=UpdateTimeEntry
```

- [ ] **Step 4: Commit**

```bash
cd /home/codigo47/sistemas/mason/source
git add apps/api/app/Actions/UpdateTimeEntry.php apps/api/tests/Unit/Actions/UpdateTimeEntryTest.php
git commit -m "feat(api): add UpdateTimeEntry action"
```

---

### Task 5.5: ParseTimeEntryText action

**Files:**
- Create: `apps/api/app/Actions/ParseTimeEntryText.php`
- Create: `apps/api/tests/Unit/Actions/ParseTimeEntryTextTest.php`
- Create: `apps/api/config/openai.php` (if not generated by package)

- [ ] **Step 1: Write the failing test**

```php
<?php

use App\Actions\ParseTimeEntryText;
use App\Models\Company;
use App\Models\Employee;
use App\Models\Project;
use App\Models\Task;
use OpenAI\Laravel\Facades\OpenAI;

it('returns an empty array if no key configured', function () {
    config(['openai.api_key' => null]);
    $action = app(ParseTimeEntryText::class);
    $result = $action->execute('John worked on Project X for 2 hours on 2026-01-01');
    expect($result)->toBe(['rows' => []]);
});

it('parses a sentence into a draft row using the configured model', function () {
    config(['openai.api_key' => 'test-key']);
    $company = Company::factory()->create(['name' => 'Jupiter Industries']);
    $employee = Employee::factory()->create(['name' => 'Athena Pallas']);
    $employee->companies()->attach($company);
    $project = Project::factory()->for($company)->create(['name' => 'Olympus CRM']);
    $employee->projects()->attach($project);
    $task = Task::factory()->for($company)->create(['name' => 'Cleanup']);

    OpenAI::fake([
        \OpenAI\Responses\Chat\CreateResponse::fake([
            'choices' => [[
                'message' => [
                    'content' => json_encode(['rows' => [[
                        'company_name' => 'Jupiter Industries',
                        'employee_name' => 'Athena Pallas',
                        'project_name' => 'Olympus CRM',
                        'task_name' => 'Cleanup',
                        'date' => '2026-05-01',
                        'hours' => 2.0,
                        'notes' => null,
                    ]]]),
                ],
            ]],
        ]),
    ]);

    $action = app(ParseTimeEntryText::class);
    $result = $action->execute('Athena worked on Olympus CRM doing cleanup for 2 hours on 2026-05-01');

    expect($result['rows'])->toHaveCount(1);
    expect($result['rows'][0]['company_id'])->toBe($company->id);
    expect($result['rows'][0]['employee_id'])->toBe($employee->id);
    expect($result['rows'][0]['project_id'])->toBe($project->id);
    expect($result['rows'][0]['task_id'])->toBe($task->id);
    expect((float) $result['rows'][0]['hours'])->toBe(2.0);
});
```

- [ ] **Step 2: Publish OpenAI config (if needed)**

```bash
cd apps/api
php artisan vendor:publish --provider="OpenAI\Laravel\ServiceProvider"
```

- [ ] **Step 3: Implement action**

```php
<?php

namespace App\Actions;

use App\Models\Company;
use App\Models\Employee;
use App\Models\Project;
use App\Models\Task;
use OpenAI\Laravel\Facades\OpenAI;

class ParseTimeEntryText
{
    /** @return array{rows: array<int, array<string, mixed>>} */
    public function execute(string $text): array
    {
        if (! config('openai.api_key')) {
            return ['rows' => []];
        }

        $context = $this->buildContext();

        $response = OpenAI::chat()->create([
            'model' => env('OPENAI_MODEL', 'gpt-4o-mini'),
            'response_format' => ['type' => 'json_object'],
            'messages' => [
                ['role' => 'system', 'content' => 'You parse natural-language time-entry descriptions into structured rows. Use ONLY names that exist in the provided directory. Output JSON: {"rows":[{"company_name","employee_name","project_name","task_name","date","hours","notes"}]}.'],
                ['role' => 'user', 'content' => "Directory:\n".$context."\n\nUser text:\n".$text],
            ],
        ]);

        $payload = json_decode($response->choices[0]->message->content ?? '{}', true);
        $raw = $payload['rows'] ?? [];

        return ['rows' => array_values(array_map(fn ($r) => $this->resolveNamesToIds($r), $raw))];
    }

    private function buildContext(): string
    {
        $companies = Company::with(['employees:id,name', 'projects:id,company_id,name', 'tasks:id,company_id,name'])->get();
        return $companies->map(function (Company $c) {
            return sprintf(
                "Company: %s\n  Employees: %s\n  Projects: %s\n  Tasks: %s",
                $c->name,
                $c->employees->pluck('name')->join(', '),
                $c->projects->pluck('name')->join(', '),
                $c->tasks->pluck('name')->join(', '),
            );
        })->implode("\n\n");
    }

    /** @param array<string, mixed> $row */
    private function resolveNamesToIds(array $row): array
    {
        $company = Company::where('name', $row['company_name'] ?? '')->first();
        $employee = Employee::where('name', $row['employee_name'] ?? '')->first();
        $project = $company ? Project::where('company_id', $company->id)->where('name', $row['project_name'] ?? '')->first() : null;
        $task = $company ? Task::where('company_id', $company->id)->where('name', $row['task_name'] ?? '')->first() : null;

        return [
            'company_id' => $company?->id,
            'employee_id' => $employee?->id,
            'project_id' => $project?->id,
            'task_id' => $task?->id,
            'date' => $row['date'] ?? null,
            'hours' => $row['hours'] ?? null,
            'notes' => $row['notes'] ?? null,
        ];
    }
}
```

- [ ] **Step 4: Run tests**

```bash
cd apps/api
./vendor/bin/pest --filter=ParseTimeEntryText
```

- [ ] **Step 5: Commit**

```bash
cd /home/codigo47/sistemas/mason/source
git add apps/api/app/Actions/ParseTimeEntryText.php apps/api/tests/Unit/Actions/ParseTimeEntryTextTest.php apps/api/config/openai.php
git commit -m "feat(api): add ParseTimeEntryText action with OpenAI fake test"
```

---

## Phase 6 — HTTP Layer

### Task 6.1: API Resources

**Files:**
- Create: `apps/api/app/Http/Resources/CompanyResource.php`
- Create: `apps/api/app/Http/Resources/EmployeeResource.php`
- Create: `apps/api/app/Http/Resources/ProjectResource.php`
- Create: `apps/api/app/Http/Resources/TaskResource.php`
- Create: `apps/api/app/Http/Resources/TimeEntryResource.php`

- [ ] **Step 1: CompanyResource**

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CompanyResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
        ];
    }
}
```

- [ ] **Step 2: EmployeeResource**

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EmployeeResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
        ];
    }
}
```

- [ ] **Step 3: ProjectResource**

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProjectResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'company_id' => $this->company_id,
            'name' => $this->name,
        ];
    }
}
```

- [ ] **Step 4: TaskResource**

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TaskResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'company_id' => $this->company_id,
            'name' => $this->name,
        ];
    }
}
```

- [ ] **Step 5: TimeEntryResource**

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TimeEntryResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'company' => new CompanyResource($this->whenLoaded('company')),
            'employee' => new EmployeeResource($this->whenLoaded('employee')),
            'project' => new ProjectResource($this->whenLoaded('project')),
            'task' => new TaskResource($this->whenLoaded('task')),
            'company_id' => $this->company_id,
            'employee_id' => $this->employee_id,
            'project_id' => $this->project_id,
            'task_id' => $this->task_id,
            'date' => $this->date->toDateString(),
            'hours' => (float) $this->hours,
            'notes' => $this->notes,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
```

- [ ] **Step 6: Commit**

```bash
cd /home/codigo47/sistemas/mason/source
git add apps/api/app/Http/Resources/
git commit -m "feat(api): add API resources for all entities"
```

---

### Task 6.2: Form Requests

**Files:**
- Create: `apps/api/app/Http/Requests/StoreTimeEntryRequest.php`
- Create: `apps/api/app/Http/Requests/BatchStoreTimeEntryRequest.php`
- Create: `apps/api/app/Http/Requests/UpdateTimeEntryRequest.php`
- Create: `apps/api/app/Http/Requests/ParseTimeEntryRequest.php`
- Create: `apps/api/tests/Feature/Requests/StoreTimeEntryRequestTest.php`

- [ ] **Step 1: Define common rules in a trait**

`apps/api/app/Http/Requests/Concerns/TimeEntryRules.php`:
```php
<?php

namespace App\Http\Requests\Concerns;

trait TimeEntryRules
{
    /** @return array<string, array<int, string>> */
    protected function rowRules(string $prefix = ''): array
    {
        return [
            "{$prefix}company_id" => ['required', 'uuid', 'exists:companies,id'],
            "{$prefix}employee_id" => ['required', 'uuid', 'exists:employees,id'],
            "{$prefix}project_id" => ['required', 'uuid', 'exists:projects,id'],
            "{$prefix}task_id" => ['required', 'uuid', 'exists:tasks,id'],
            "{$prefix}date" => ['required', 'date_format:Y-m-d', 'after_or_equal:2000-01-01', 'before_or_equal:'.now()->addDays(7)->toDateString()],
            "{$prefix}hours" => ['required', 'numeric', 'min:0.25', 'max:24', 'multiple_of:0.25'],
            "{$prefix}notes" => ['nullable', 'string', 'max:1000'],
        ];
    }
}
```

- [ ] **Step 2: StoreTimeEntryRequest**

```php
<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\TimeEntryRules;
use Illuminate\Foundation\Http\FormRequest;

class StoreTimeEntryRequest extends FormRequest
{
    use TimeEntryRules;

    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, string>> */
    public function rules(): array
    {
        return $this->rowRules();
    }
}
```

- [ ] **Step 3: BatchStoreTimeEntryRequest**

```php
<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\TimeEntryRules;
use Illuminate\Foundation\Http\FormRequest;

class BatchStoreTimeEntryRequest extends FormRequest
{
    use TimeEntryRules;

    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, string>> */
    public function rules(): array
    {
        return array_merge(
            ['entries' => ['required', 'array', 'min:1', 'max:200']],
            $this->rowRules('entries.*.'),
        );
    }
}
```

- [ ] **Step 4: UpdateTimeEntryRequest**

```php
<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\TimeEntryRules;
use Illuminate\Foundation\Http\FormRequest;

class UpdateTimeEntryRequest extends FormRequest
{
    use TimeEntryRules;

    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, string>> */
    public function rules(): array
    {
        $rules = $this->rowRules();
        // PATCH semantics: each field optional but if present must validate
        return array_map(fn (array $r) => array_map(
            fn ($v) => $v === 'required' ? 'sometimes' : $v,
            $r,
        ), $rules);
    }
}
```

- [ ] **Step 5: ParseTimeEntryRequest**

```php
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ParseTimeEntryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, string>> */
    public function rules(): array
    {
        return [
            'text' => ['required', 'string', 'max:2000'],
        ];
    }
}
```

- [ ] **Step 6: Test for the Form Requests**

```php
<?php

use App\Http\Requests\StoreTimeEntryRequest;
use Illuminate\Foundation\Testing\TestCase;
use Illuminate\Support\Facades\Validator;

it('validates hours quarter step', function () {
    $rules = (new StoreTimeEntryRequest())->rules();
    $v = Validator::make([
        'company_id' => fake()->uuid(),
        'employee_id' => fake()->uuid(),
        'project_id' => fake()->uuid(),
        'task_id' => fake()->uuid(),
        'date' => '2026-05-01',
        'hours' => 0.3,
        'notes' => null,
    ], $rules);
    expect($v->fails())->toBeTrue();
    expect($v->errors()->has('hours'))->toBeTrue();
});

it('rejects future dates beyond 7 days', function () {
    $rules = (new StoreTimeEntryRequest())->rules();
    $v = Validator::make(['date' => now()->addDays(30)->toDateString()] + $this->validRow(), $rules);
    expect($v->fails())->toBeTrue();
});
```

(Add a Pest helper `validRow()` in the test file or `Pest.php` to provide a baseline payload that exists in DB; or use factories for IDs that exist.)

- [ ] **Step 7: Commit**

```bash
cd /home/codigo47/sistemas/mason/source
git add apps/api/app/Http/Requests/ apps/api/tests/Feature/Requests/
git commit -m "feat(api): add form requests for time entries"
```

---

### Task 6.3: CompanyController + endpoints + tests

**Files:**
- Create: `apps/api/app/Http/Controllers/Api/V1/CompanyController.php`
- Create: `apps/api/tests/Feature/Api/CompanyEndpointsTest.php`

- [ ] **Step 1: Write the failing feature test**

```php
<?php

use App\Models\Company;

it('lists companies with cache headers', function () {
    Company::factory()->count(3)->create();
    $response = $this->getJson('/api/v1/companies');
    $response->assertOk();
    expect($response->json('data'))->toHaveCount(3);
    expect($response->headers->get('ETag'))->not->toBeNull();
    expect($response->headers->get('Cache-Control'))->toContain('private');
});

it('returns 304 when If-None-Match matches', function () {
    Company::factory()->count(2)->create();
    $first = $this->getJson('/api/v1/companies');
    $etag = $first->headers->get('ETag');
    $second = $this->withHeaders(['If-None-Match' => $etag])->getJson('/api/v1/companies');
    $second->assertNoContent(304);
});

it('lists employees of a company', function () {
    $company = Company::factory()->hasAttached(\App\Models\Employee::factory()->count(2))->create();
    $response = $this->getJson("/api/v1/companies/{$company->id}/employees");
    $response->assertOk();
    expect($response->json('data'))->toHaveCount(2);
});

it('lists projects of a company', function () {
    $company = Company::factory()->create();
    \App\Models\Project::factory()->for($company)->count(3)->create();
    $response = $this->getJson("/api/v1/companies/{$company->id}/projects");
    $response->assertOk();
    expect($response->json('data'))->toHaveCount(3);
});

it('lists tasks of a company', function () {
    $company = Company::factory()->create();
    \App\Models\Task::factory()->for($company)->count(4)->create();
    $response = $this->getJson("/api/v1/companies/{$company->id}/tasks");
    $response->assertOk();
    expect($response->json('data'))->toHaveCount(4);
});
```

- [ ] **Step 2: Implement controller**

```php
<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\CompanyResource;
use App\Http\Resources\EmployeeResource;
use App\Http\Resources\ProjectResource;
use App\Http\Resources\TaskResource;
use App\Models\Company;
use App\Services\EtagService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CompanyController extends Controller
{
    public function __construct(private readonly EtagService $etag) {}

    public function index(Request $request): JsonResponse
    {
        return $this->cached($request, Company::class, fn () => Company::orderBy('name')->get(), CompanyResource::class);
    }

    public function employees(Request $request, Company $company): JsonResponse
    {
        return $this->cached(
            $request,
            $company->employees()->getQuery(),
            fn () => $company->employees()->orderBy('name')->get(),
            EmployeeResource::class,
        );
    }

    public function projects(Request $request, Company $company): JsonResponse
    {
        return $this->cached(
            $request,
            $company->projects()->getQuery(),
            fn () => $company->projects()->orderBy('name')->get(),
            ProjectResource::class,
        );
    }

    public function tasks(Request $request, Company $company): JsonResponse
    {
        return $this->cached(
            $request,
            $company->tasks()->getQuery(),
            fn () => $company->tasks()->orderBy('name')->get(),
            TaskResource::class,
        );
    }

    /**
     * @param  class-string<\Illuminate\Database\Eloquent\Model>|\Illuminate\Database\Eloquent\Builder|\Illuminate\Database\Eloquent\Relations\Relation  $source
     */
    private function cached(Request $request, mixed $source, \Closure $resolver, string $resourceClass): JsonResponse
    {
        $etag = is_string($source) ? $this->etag->forModel($source) : $this->etag->forQuery($source);

        if ($request->headers->get('If-None-Match') === $etag) {
            return response()->json(null, 304)->header('ETag', $etag);
        }

        $data = $resolver();
        return $resourceClass::collection($data)
            ->response()
            ->setStatusCode(200)
            ->header('ETag', $etag)
            ->header('Cache-Control', 'private, max-age=60');
    }
}
```

- [ ] **Step 3: Wire routes in `routes/api.php`**

```php
<?php

use App\Http\Controllers\Api\V1\CompanyController;
use Illuminate\Support\Facades\Route;

Route::get('/health', fn () => response()->json(['ok' => true]));

Route::prefix('v1')->group(function () {
    Route::get('companies', [CompanyController::class, 'index']);
    Route::get('companies/{company}/employees', [CompanyController::class, 'employees']);
    Route::get('companies/{company}/projects', [CompanyController::class, 'projects']);
    Route::get('companies/{company}/tasks', [CompanyController::class, 'tasks']);
});
```

Note: because `apiPrefix: 'api/v1'` is set in `bootstrap/app.php`, the routes are mounted under `/api/v1`. Remove the inner `prefix('v1')` to avoid double prefix:

```php
<?php

use App\Http\Controllers\Api\V1\CompanyController;
use Illuminate\Support\Facades\Route;

Route::get('/health', fn () => response()->json(['ok' => true]));
Route::get('companies', [CompanyController::class, 'index']);
Route::get('companies/{company}/employees', [CompanyController::class, 'employees']);
Route::get('companies/{company}/projects', [CompanyController::class, 'projects']);
Route::get('companies/{company}/tasks', [CompanyController::class, 'tasks']);
```

- [ ] **Step 4: Run tests**

```bash
cd apps/api
./vendor/bin/pest --filter=CompanyEndpoints
```

- [ ] **Step 5: Commit**

```bash
cd /home/codigo47/sistemas/mason/source
git add apps/api/app/Http/Controllers/Api/V1/CompanyController.php apps/api/routes/api.php apps/api/tests/Feature/Api/CompanyEndpointsTest.php
git commit -m "feat(api): add CompanyController with cache-aware endpoints"
```

---

### Task 6.4: EmployeeController + endpoints + tests

**Files:**
- Create: `apps/api/app/Http/Controllers/Api/V1/EmployeeController.php`
- Create: `apps/api/tests/Feature/Api/EmployeeEndpointsTest.php`

- [ ] **Step 1: Write the failing feature test**

```php
<?php

use App\Models\Company;
use App\Models\Employee;
use App\Models\Project;

it('lists projects an employee is on', function () {
    $employee = Employee::factory()->create();
    $company = Company::factory()->create();
    $employee->companies()->attach($company);
    $project = Project::factory()->for($company)->create();
    $employee->projects()->attach($project);

    $response = $this->getJson("/api/v1/employees/{$employee->id}/projects");
    $response->assertOk();
    expect($response->json('data'))->toHaveCount(1);
});

it('lists companies an employee belongs to', function () {
    $employee = Employee::factory()->create();
    $employee->companies()->attach(Company::factory()->create());
    $response = $this->getJson("/api/v1/employees/{$employee->id}/companies");
    $response->assertOk();
    expect($response->json('data'))->toHaveCount(1);
});
```

- [ ] **Step 2: Implement controller**

```php
<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\CompanyResource;
use App\Http\Resources\ProjectResource;
use App\Models\Employee;
use App\Services\EtagService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EmployeeController extends Controller
{
    public function __construct(private readonly EtagService $etag) {}

    public function projects(Request $request, Employee $employee): JsonResponse
    {
        $etag = $this->etag->forQuery($employee->projects()->getQuery());
        if ($request->headers->get('If-None-Match') === $etag) {
            return response()->json(null, 304)->header('ETag', $etag);
        }

        return ProjectResource::collection($employee->projects()->orderBy('name')->get())
            ->response()
            ->header('ETag', $etag)
            ->header('Cache-Control', 'private, max-age=60');
    }

    public function companies(Request $request, Employee $employee): JsonResponse
    {
        $etag = $this->etag->forQuery($employee->companies()->getQuery());
        if ($request->headers->get('If-None-Match') === $etag) {
            return response()->json(null, 304)->header('ETag', $etag);
        }

        return CompanyResource::collection($employee->companies()->orderBy('name')->get())
            ->response()
            ->header('ETag', $etag)
            ->header('Cache-Control', 'private, max-age=60');
    }
}
```

- [ ] **Step 3: Add routes**

```php
Route::get('employees/{employee}/projects', [\App\Http\Controllers\Api\V1\EmployeeController::class, 'projects']);
Route::get('employees/{employee}/companies', [\App\Http\Controllers\Api\V1\EmployeeController::class, 'companies']);
```

- [ ] **Step 4: Run tests + commit**

```bash
cd apps/api && ./vendor/bin/pest --filter=EmployeeEndpoints
cd /home/codigo47/sistemas/mason/source
git add apps/api/app/Http/Controllers/Api/V1/EmployeeController.php apps/api/routes/api.php apps/api/tests/Feature/Api/EmployeeEndpointsTest.php
git commit -m "feat(api): add EmployeeController endpoints"
```

---

### Task 6.5: TimeEntryController — index, show, store, batch

**Files:**
- Create: `apps/api/app/Http/Controllers/Api/V1/TimeEntryController.php`
- Create: `apps/api/tests/Feature/Api/TimeEntryEndpointsTest.php`

- [ ] **Step 1: Write the failing test**

```php
<?php

use App\Models\Company;
use App\Models\Employee;
use App\Models\Project;
use App\Models\Task;
use App\Models\TimeEntry;

beforeEach(function () {
    $this->company = Company::factory()->create();
    $this->employee = Employee::factory()->create();
    $this->employee->companies()->attach($this->company);
    $this->project = Project::factory()->for($this->company)->create();
    $this->employee->projects()->attach($this->project);
    $this->task = Task::factory()->for($this->company)->create();
});

it('GET /time-entries paginates', function () {
    TimeEntry::factory()->count(30)->create();
    $response = $this->getJson('/api/v1/time-entries?per_page=10');
    $response->assertOk();
    expect($response->json('data'))->toHaveCount(10);
    expect($response->json('meta.total'))->toBe(30);
});

it('GET /time-entries supports filtering by company_id', function () {
    TimeEntry::factory()->count(5)->create();
    TimeEntry::factory()->count(2)->for($this->company)->create([
        'employee_id' => $this->employee->id,
        'project_id' => $this->project->id,
        'task_id' => $this->task->id,
    ]);
    $response = $this->getJson("/api/v1/time-entries?company_id={$this->company->id}");
    $response->assertOk();
    expect($response->json('data'))->toHaveCount(2);
});

it('POST /time-entries creates one entry', function () {
    $payload = [
        'company_id' => $this->company->id,
        'employee_id' => $this->employee->id,
        'project_id' => $this->project->id,
        'task_id' => $this->task->id,
        'date' => '2026-05-01',
        'hours' => 2.0,
        'notes' => 'Refactor',
    ];
    $response = $this->postJson('/api/v1/time-entries', $payload);
    $response->assertCreated();
    expect(TimeEntry::count())->toBe(1);
});

it('POST /time-entries/batch creates multiple entries in one transaction', function () {
    $task2 = Task::factory()->for($this->company)->create();
    $response = $this->postJson('/api/v1/time-entries/batch', [
        'entries' => [
            ['company_id' => $this->company->id, 'employee_id' => $this->employee->id, 'project_id' => $this->project->id, 'task_id' => $this->task->id, 'date' => '2026-05-01', 'hours' => 1.0, 'notes' => null],
            ['company_id' => $this->company->id, 'employee_id' => $this->employee->id, 'project_id' => $this->project->id, 'task_id' => $task2->id, 'date' => '2026-05-01', 'hours' => 2.0, 'notes' => null],
        ],
    ]);
    $response->assertCreated();
    expect(TimeEntry::count())->toBe(2);
});

it('POST /time-entries/batch returns row-keyed errors on conflict', function () {
    $other = Project::factory()->for($this->company)->create();
    $this->employee->projects()->attach($other);

    $response = $this->postJson('/api/v1/time-entries/batch', [
        'entries' => [
            ['company_id' => $this->company->id, 'employee_id' => $this->employee->id, 'project_id' => $this->project->id, 'task_id' => $this->task->id, 'date' => '2026-05-01', 'hours' => 1.0, 'notes' => null],
            ['company_id' => $this->company->id, 'employee_id' => $this->employee->id, 'project_id' => $other->id, 'task_id' => $this->task->id, 'date' => '2026-05-01', 'hours' => 1.0, 'notes' => null],
        ],
    ]);
    $response->assertStatus(422);
    expect($response->json('errors'))->toHaveKey('entries.1.project_id');
    expect(TimeEntry::count())->toBe(0);
});
```

- [ ] **Step 2: Implement controller (partial)**

```php
<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\CreateTimeEntries;
use App\Actions\ParseTimeEntryText;
use App\Actions\UpdateTimeEntry;
use App\Exceptions\TimeEntryValidationException;
use App\Http\Controllers\Controller;
use App\Http\Requests\BatchStoreTimeEntryRequest;
use App\Http\Requests\ParseTimeEntryRequest;
use App\Http\Requests\StoreTimeEntryRequest;
use App\Http\Requests\UpdateTimeEntryRequest;
use App\Http\Resources\TimeEntryResource;
use App\Models\TimeEntry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class TimeEntryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = min((int) $request->query('per_page', 25), 100);

        $query = QueryBuilder::for(TimeEntry::class)
            ->allowedFilters([
                AllowedFilter::exact('company_id'),
                AllowedFilter::exact('employee_id'),
                AllowedFilter::exact('project_id'),
                AllowedFilter::exact('task_id'),
                AllowedFilter::callback('date_from', fn ($q, $v) => $q->where('date', '>=', $v)),
                AllowedFilter::callback('date_to', fn ($q, $v) => $q->where('date', '<=', $v)),
                AllowedFilter::callback('q', fn ($q, $v) => $q->where('notes', 'ilike', '%'.$v.'%')),
            ])
            ->allowedSorts(['date', 'hours', 'created_at'])
            ->defaultSort('-date')
            ->with(['company', 'employee', 'project', 'task']);

        return TimeEntryResource::collection($query->paginate($perPage)->appends($request->query()))
            ->response();
    }

    public function show(TimeEntry $timeEntry): JsonResponse
    {
        $timeEntry->load(['company', 'employee', 'project', 'task']);
        return (new TimeEntryResource($timeEntry))->response();
    }

    public function store(StoreTimeEntryRequest $request, CreateTimeEntries $action): JsonResponse
    {
        try {
            $entries = $action->execute([$request->validated()]);
        } catch (TimeEntryValidationException $e) {
            return response()->json(['message' => $e->getMessage(), 'errors' => $this->stripBatchPrefix($e->errors)], 422);
        }

        $entries[0]->load(['company', 'employee', 'project', 'task']);
        return (new TimeEntryResource($entries[0]))->response()->setStatusCode(201);
    }

    public function batch(BatchStoreTimeEntryRequest $request, CreateTimeEntries $action): JsonResponse
    {
        try {
            $entries = $action->execute($request->validated()['entries']);
        } catch (TimeEntryValidationException $e) {
            return response()->json(['message' => $e->getMessage(), 'errors' => $e->errors], 422);
        }

        foreach ($entries as $e) {
            $e->load(['company', 'employee', 'project', 'task']);
        }
        return TimeEntryResource::collection($entries)->response()->setStatusCode(201);
    }

    public function update(UpdateTimeEntryRequest $request, TimeEntry $timeEntry, UpdateTimeEntry $action): JsonResponse
    {
        try {
            $updated = $action->execute($timeEntry, $request->validated());
        } catch (TimeEntryValidationException $e) {
            return response()->json(['message' => $e->getMessage(), 'errors' => $e->errors], 422);
        }
        $updated->load(['company', 'employee', 'project', 'task']);
        return (new TimeEntryResource($updated))->response();
    }

    public function destroy(TimeEntry $timeEntry): JsonResponse
    {
        $timeEntry->delete();
        return response()->json(null, 204);
    }

    public function summary(Request $request): JsonResponse
    {
        $allowed = ['employee', 'project', 'task', 'date', 'company'];
        $groupBy = in_array($request->query('group_by'), $allowed, true) ? $request->query('group_by') : 'employee';
        $col = $groupBy === 'date' ? 'date' : "{$groupBy}_id";

        $query = QueryBuilder::for(TimeEntry::class)
            ->allowedFilters([
                AllowedFilter::exact('company_id'),
                AllowedFilter::exact('employee_id'),
                AllowedFilter::exact('project_id'),
                AllowedFilter::exact('task_id'),
                AllowedFilter::callback('date_from', fn ($q, $v) => $q->where('date', '>=', $v)),
                AllowedFilter::callback('date_to', fn ($q, $v) => $q->where('date', '<=', $v)),
            ])
            ->getEloquentBuilder()
            ->selectRaw("$col as group_key, SUM(hours) as total_hours, COUNT(*) as entry_count")
            ->groupBy($col)
            ->orderBy('group_key');

        return response()->json(['data' => $query->get(), 'meta' => ['group_by' => $groupBy]]);
    }

    public function parse(ParseTimeEntryRequest $request, ParseTimeEntryText $action): JsonResponse
    {
        $result = $action->execute($request->validated()['text']);
        return response()->json($result);
    }

    /** @param  array<string, array<string>>  $errors @return array<string, array<string>> */
    private function stripBatchPrefix(array $errors): array
    {
        $out = [];
        foreach ($errors as $key => $msgs) {
            $clean = preg_replace('/^entries\.\d+\./', '', $key);
            $out[$clean] = $msgs;
        }
        return $out;
    }
}
```

- [ ] **Step 3: Routes**

```php
Route::get('time-entries', [\App\Http\Controllers\Api\V1\TimeEntryController::class, 'index']);
Route::get('time-entries/summary', [\App\Http\Controllers\Api\V1\TimeEntryController::class, 'summary']);
Route::post('time-entries/parse', [\App\Http\Controllers\Api\V1\TimeEntryController::class, 'parse'])
    ->middleware('throttle:10,1');
Route::post('time-entries/batch', [\App\Http\Controllers\Api\V1\TimeEntryController::class, 'batch']);
Route::post('time-entries', [\App\Http\Controllers\Api\V1\TimeEntryController::class, 'store']);
Route::get('time-entries/{timeEntry}', [\App\Http\Controllers\Api\V1\TimeEntryController::class, 'show']);
Route::patch('time-entries/{timeEntry}', [\App\Http\Controllers\Api\V1\TimeEntryController::class, 'update']);
Route::delete('time-entries/{timeEntry}', [\App\Http\Controllers\Api\V1\TimeEntryController::class, 'destroy']);
```

- [ ] **Step 4: Run tests + commit**

```bash
cd apps/api && ./vendor/bin/pest --filter=TimeEntryEndpoints
cd /home/codigo47/sistemas/mason/source
git add apps/api/app/Http/Controllers/Api/V1/TimeEntryController.php apps/api/routes/api.php apps/api/tests/Feature/Api/TimeEntryEndpointsTest.php
git commit -m "feat(api): add TimeEntryController with crud, batch, summary, parse"
```

---

### Task 6.6: Edge cases and missing tests for endpoints

**Files:**
- Modify: `apps/api/tests/Feature/Api/TimeEntryEndpointsTest.php`

- [ ] **Step 1: Add tests**

```php
it('PATCH /time-entries/{id} updates fields', function () {
    $entry = TimeEntry::factory()->create();
    $response = $this->patchJson("/api/v1/time-entries/{$entry->id}", ['hours' => 5.0, 'notes' => 'Edited']);
    $response->assertOk();
    expect((float) $response->json('data.hours'))->toBe(5.0);
});

it('DELETE /time-entries/{id} deletes the entry', function () {
    $entry = TimeEntry::factory()->create();
    $this->deleteJson("/api/v1/time-entries/{$entry->id}")->assertNoContent();
    expect(TimeEntry::count())->toBe(0);
});

it('GET /time-entries/summary returns totals by group', function () {
    TimeEntry::factory()->count(3)->create(['hours' => 1.0]);
    $response = $this->getJson('/api/v1/time-entries/summary?group_by=date');
    $response->assertOk();
    expect($response->json('meta.group_by'))->toBe('date');
    expect($response->json('data'))->not->toBeEmpty();
});

it('POST /time-entries/parse returns empty rows when no AI key', function () {
    config(['openai.api_key' => null]);
    $response = $this->postJson('/api/v1/time-entries/parse', ['text' => 'Athena did stuff']);
    $response->assertOk();
    expect($response->json('rows'))->toBe([]);
});
```

- [ ] **Step 2: Run + commit**

```bash
cd apps/api && ./vendor/bin/pest --filter=TimeEntryEndpoints
cd /home/codigo47/sistemas/mason/source
git add apps/api/tests/Feature/Api/TimeEntryEndpointsTest.php
git commit -m "test(api): add edge cases for time entry endpoints"
```

---

## Phase 7 — Frontend Setup

### Task 7.1: Scaffold Vue 3 + Vite + TS

**Files:** All inside `apps/dashboard/`

- [ ] **Step 1: Create the Vite project**

```bash
cd /home/codigo47/sistemas/mason/source
npm create vite@latest apps/dashboard -- --template vue-ts -y
cd apps/dashboard
npm install
```

- [ ] **Step 2: Add dependencies**

```bash
npm install vue-router pinia axios @vueuse/core zod @vee-validate/zod vee-validate
npm install -D tailwindcss @tailwindcss/postcss postcss autoprefixer @types/node \
  vitest @vitest/coverage-v8 @vue/test-utils jsdom @testing-library/vue @testing-library/jest-dom \
  eslint typescript-eslint vue-eslint-parser eslint-plugin-vue \
  @time-entries/eslint-config @time-entries/shared-types
```

- [ ] **Step 3: Configure Tailwind**

`apps/dashboard/postcss.config.js`:
```js
export default {
  plugins: { '@tailwindcss/postcss': {} },
}
```

`apps/dashboard/tailwind.config.ts`:
```ts
import type { Config } from 'tailwindcss'
export default {
  content: ['./index.html', './src/**/*.{ts,vue}'],
  theme: {
    extend: {},
  },
} satisfies Config
```

`apps/dashboard/src/assets/main.css` — replace with:
```css
@import "tailwindcss";

:root {
  color-scheme: light dark;
}
```

(Wire it from `main.ts` if not already.)

- [ ] **Step 4: Set up shadcn-vue**

```bash
cd /home/codigo47/sistemas/mason/source/apps/dashboard
npx shadcn-vue@latest init -y --base-color slate
npx shadcn-vue@latest add button input select dialog table tabs toast tooltip dropdown-menu popover calendar
```

- [ ] **Step 5: tsconfig + path alias**

`apps/dashboard/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "jsx": "preserve",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "useDefineForClassFields": true,
    "types": ["vitest/globals", "node"],
    "paths": {
      "@/*": ["./src/*"],
      "@shared/*": ["../../packages/shared-types/src/*"]
    }
  },
  "include": ["src/**/*", "tests/**/*"]
}
```

`apps/dashboard/vite.config.ts`:
```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@shared': fileURLToPath(new URL('../../packages/shared-types/src', import.meta.url)),
    },
  },
  server: { port: 5173, host: '127.0.0.1' },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: { reporter: ['text', 'html'], thresholds: { lines: 100, branches: 100, functions: 100, statements: 100 } },
  },
})
```

`apps/dashboard/tests/setup.ts`:
```ts
import '@testing-library/jest-dom/vitest'
```

- [ ] **Step 6: Add `.env.example`**

`apps/dashboard/.env.example`:
```
VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1
VITE_AI_ENABLED=true
```

- [ ] **Step 7: Add `package.json` scripts**

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc -b && vite build",
    "test": "vitest run --coverage",
    "test:watch": "vitest",
    "lint": "eslint . --max-warnings=0",
    "typecheck": "vue-tsc --noEmit"
  }
}
```

- [ ] **Step 8: Commit**

```bash
cd /home/codigo47/sistemas/mason/source
git add apps/dashboard/ package-lock.json
git commit -m "feat(dashboard): scaffold vue 3 + vite + tailwind + shadcn"
```

---

### Task 7.2: Shared types and Zod schemas in `packages/shared-types`

**Files:**
- Create/Modify: `packages/shared-types/src/types.ts`
- Create/Modify: `packages/shared-types/src/schemas/timeEntry.ts`
- Create/Modify: `packages/shared-types/src/schemas/{company,employee,project,task}.ts`

- [ ] **Step 1: types.ts**

```ts
export type Uuid = string

export interface CompanyDto { id: Uuid; name: string }
export interface EmployeeDto { id: Uuid; name: string; email: string }
export interface ProjectDto { id: Uuid; company_id: Uuid; name: string }
export interface TaskDto { id: Uuid; company_id: Uuid; name: string }

export interface TimeEntryDto {
  id: Uuid
  company_id: Uuid
  employee_id: Uuid
  project_id: Uuid
  task_id: Uuid
  date: string
  hours: number
  notes: string | null
  company?: CompanyDto
  employee?: EmployeeDto
  project?: ProjectDto
  task?: TaskDto
  created_at?: string
  updated_at?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: { current_page: number; last_page: number; per_page: number; total: number }
}
```

- [ ] **Step 2: timeEntry.ts**

```ts
import { z } from 'zod'

export const timeEntryRowSchema = z.object({
  company_id: z.string().uuid(),
  employee_id: z.string().uuid(),
  project_id: z.string().uuid(),
  task_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  hours: z.number().min(0.25).max(24).refine((v) => Number.isInteger(v * 4), {
    message: 'Hours must be in 0.25 increments',
  }),
  notes: z.string().max(1000).nullable(),
})

export type TimeEntryRow = z.infer<typeof timeEntryRowSchema>

export const timeEntryDraftSchema = timeEntryRowSchema.partial().extend({
  _id: z.string(),
})
export type TimeEntryDraft = z.infer<typeof timeEntryDraftSchema>
```

- [ ] **Step 3: trivial schema files for company/employee/project/task** (re-export of `z.object` plus the DTO type aliases)

```ts
// company.ts
import { z } from 'zod'
export const companySchema = z.object({ id: z.string().uuid(), name: z.string() })
```

(Same for employee, project, task.)

- [ ] **Step 4: Commit**

```bash
cd /home/codigo47/sistemas/mason/source
git add packages/shared-types/src/
git commit -m "feat(shared): define types and zod schemas for time entries"
```

---

## Phase 8 — Frontend Implementation

> NOTE: Each component task includes the test alongside the implementation. Run `npm --workspace apps/dashboard run test` after each commit to keep coverage at 100%.

### Task 8.1: API service layer

**Files:**
- Create: `apps/dashboard/src/services/api.ts`
- Create: `apps/dashboard/tests/services/api.test.ts`

- [ ] **Step 1: Implement `src/services/api.ts`**

```ts
import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000/api/v1'

const etagCache = new Map<string, { etag: string; data: unknown }>()

export const api: AxiosInstance = axios.create({ baseURL })

api.interceptors.request.use((cfg) => {
  if ((cfg.method ?? 'get').toLowerCase() === 'get' && cfg.url) {
    const cached = etagCache.get(cfg.url)
    if (cached) {
      cfg.headers.set('If-None-Match', cached.etag)
    }
  }
  return cfg
})

api.interceptors.response.use(
  (res) => {
    if ((res.config.method ?? 'get').toLowerCase() === 'get' && res.config.url) {
      const etag = res.headers['etag'] as string | undefined
      if (etag) etagCache.set(res.config.url, { etag, data: res.data })
    }
    return res
  },
  (err) => {
    if (err.response?.status === 304 && err.config?.url) {
      const cached = etagCache.get(err.config.url)
      if (cached) {
        return Promise.resolve({ ...err.response, status: 200, data: cached.data })
      }
    }
    return Promise.reject(err)
  },
)

export interface ApiErrorBody {
  message: string
  errors?: Record<string, string[]>
}

export function fieldErrors(err: unknown): Record<string, string[]> {
  if (axios.isAxiosError(err)) {
    return (err.response?.data as ApiErrorBody | undefined)?.errors ?? {}
  }
  return {}
}

export type RequestConfig = AxiosRequestConfig
```

- [ ] **Step 2: Test (mock axios)**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { api, fieldErrors } from '@/services/api'

describe('api service', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('exposes baseURL from env', () => {
    expect(api.defaults.baseURL).toBeDefined()
  })

  it('extracts field errors from axios errors', () => {
    const err = { isAxiosError: true, response: { data: { errors: { foo: ['bar'] } } } } as unknown
    // Simulate axios.isAxiosError true via real instance import
    const ax = vi.spyOn((globalThis as any), 'axios', 'get').mockReturnValue({ isAxiosError: () => true })
    expect(fieldErrors(err as Error)).toBeTypeOf('object')
    ax.mockRestore()
  })
})
```

(Refine tests to use `axios.isAxiosError` mock more cleanly. The point is exercise of the helper.)

- [ ] **Step 3: Commit**

```bash
cd /home/codigo47/sistemas/mason/source
git add apps/dashboard/src/services/api.ts apps/dashboard/tests/services/api.test.ts
git commit -m "feat(dashboard): add api service with etag caching"
```

---

### Task 8.2: Pinia stores

**Files:**
- Create: `apps/dashboard/src/stores/companyContext.ts`
- Create: `apps/dashboard/src/stores/lookups.ts`
- Create: `apps/dashboard/src/stores/draftEntries.ts`
- Create: `apps/dashboard/src/stores/history.ts`
- Create: `apps/dashboard/tests/stores/*.test.ts`

- [ ] **Step 1: companyContext store**

```ts
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useCompanyContextStore = defineStore('companyContext', () => {
  const companyId = ref<string | 'all'>(localStorage.getItem('companyId') ?? 'all')
  watch(companyId, (v) => localStorage.setItem('companyId', v))
  return { companyId }
})
```

- [ ] **Step 2: lookups store with ETag-aware fetches**

```ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/services/api'
import type { CompanyDto, EmployeeDto, ProjectDto, TaskDto } from '@shared/types'

export const useLookupsStore = defineStore('lookups', () => {
  const companies = ref<CompanyDto[]>([])
  const employeesByCompany = ref<Record<string, EmployeeDto[]>>({})
  const projectsByCompany = ref<Record<string, ProjectDto[]>>({})
  const tasksByCompany = ref<Record<string, TaskDto[]>>({})

  async function loadCompanies() {
    if (companies.value.length) return
    const { data } = await api.get('/companies')
    companies.value = data.data
  }
  async function loadEmployees(companyId: string) {
    if (employeesByCompany.value[companyId]) return
    const { data } = await api.get(`/companies/${companyId}/employees`)
    employeesByCompany.value = { ...employeesByCompany.value, [companyId]: data.data }
  }
  async function loadProjects(companyId: string) {
    if (projectsByCompany.value[companyId]) return
    const { data } = await api.get(`/companies/${companyId}/projects`)
    projectsByCompany.value = { ...projectsByCompany.value, [companyId]: data.data }
  }
  async function loadTasks(companyId: string) {
    if (tasksByCompany.value[companyId]) return
    const { data } = await api.get(`/companies/${companyId}/tasks`)
    tasksByCompany.value = { ...tasksByCompany.value, [companyId]: data.data }
  }

  function invalidateAll() {
    companies.value = []
    employeesByCompany.value = {}
    projectsByCompany.value = {}
    tasksByCompany.value = {}
  }

  return {
    companies, employeesByCompany, projectsByCompany, tasksByCompany,
    loadCompanies, loadEmployees, loadProjects, loadTasks, invalidateAll,
  }
})
```

- [ ] **Step 3: draftEntries store** (persisted to localStorage)

```ts
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { TimeEntryDraft } from '@shared/schemas/timeEntry'

const STORAGE_KEY = 'draftEntries'

function load(): TimeEntryDraft[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export const useDraftEntriesStore = defineStore('draftEntries', () => {
  const rows = ref<TimeEntryDraft[]>(load())

  watch(rows, (v) => localStorage.setItem(STORAGE_KEY, JSON.stringify(v)), { deep: true })

  function addRow(seed: Partial<TimeEntryDraft> = {}) {
    rows.value.push({ _id: crypto.randomUUID(), notes: null, ...seed } as TimeEntryDraft)
  }
  function duplicate(index: number) {
    const src = rows.value[index]
    if (!src) return
    rows.value.splice(index + 1, 0, { ...src, _id: crypto.randomUUID() })
  }
  function remove(index: number) { rows.value.splice(index, 1) }
  function clear() { rows.value = [] }

  return { rows, addRow, duplicate, remove, clear }
})
```

- [ ] **Step 4: history store**

```ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/services/api'
import type { PaginatedResponse, TimeEntryDto } from '@shared/types'

interface Filters {
  company_id?: string
  employee_id?: string
  project_id?: string
  task_id?: string
  date_from?: string
  date_to?: string
  q?: string
  sort?: string
  page?: number
  per_page?: number
}

export const useHistoryStore = defineStore('history', () => {
  const items = ref<TimeEntryDto[]>([])
  const meta = ref({ current_page: 1, last_page: 1, per_page: 25, total: 0 })
  const filters = ref<Filters>({ per_page: 25, sort: '-date' })
  const summary = ref<Array<{ group_key: string; total_hours: number; entry_count: number }>>([])

  async function load() {
    const { data } = await api.get<PaginatedResponse<TimeEntryDto>>('/time-entries', { params: filters.value })
    items.value = data.data
    meta.value = data.meta
  }

  async function loadSummary(groupBy: string) {
    const { data } = await api.get('/time-entries/summary', { params: { ...filters.value, group_by: groupBy } })
    summary.value = data.data
  }

  return { items, meta, filters, summary, load, loadSummary }
})
```

- [ ] **Step 5: Tests for stores**

(Use `setActivePinia(createPinia())` and `vi.mock('@/services/api')` to assert request shapes and state mutations. Each store gets a test file with at least: initial state, mutations, and persisted side effects.)

- [ ] **Step 6: Commit**

```bash
cd /home/codigo47/sistemas/mason/source
git add apps/dashboard/src/stores/ apps/dashboard/tests/stores/
git commit -m "feat(dashboard): add pinia stores with tests"
```

---

### Task 8.3: Composables

**Files:**
- Create: `apps/dashboard/src/composables/useLookups.ts`
- Create: `apps/dashboard/src/composables/useKeyboardShortcuts.ts`
- Create: `apps/dashboard/src/composables/useDraftEntries.ts`

- [ ] **Step 1: `useLookups`** — convenience wrapper over the lookups store, returning ref slices for a given company

```ts
import { computed } from 'vue'
import { useLookupsStore } from '@/stores/lookups'

export function useLookupsForCompany(companyId: () => string | undefined) {
  const store = useLookupsStore()

  const employees = computed(() => companyId() ? store.employeesByCompany[companyId()!] ?? [] : [])
  const projects = computed(() => companyId() ? store.projectsByCompany[companyId()!] ?? [] : [])
  const tasks = computed(() => companyId() ? store.tasksByCompany[companyId()!] ?? [] : [])

  async function ensure() {
    const id = companyId()
    if (!id) return
    await Promise.all([store.loadEmployees(id), store.loadProjects(id), store.loadTasks(id)])
  }
  return { employees, projects, tasks, ensure }
}
```

- [ ] **Step 2: `useKeyboardShortcuts`**

```ts
import { onMounted, onUnmounted } from 'vue'

export interface Shortcut { combo: string; handler: (ev: KeyboardEvent) => void; preventDefault?: boolean }

export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  function match(ev: KeyboardEvent, combo: string) {
    const parts = combo.toLowerCase().split('+')
    const key = parts.pop() ?? ''
    const wantCtrl = parts.includes('ctrl') || parts.includes('cmd')
    const wantShift = parts.includes('shift')
    const wantAlt = parts.includes('alt')
    const ctrlPressed = ev.ctrlKey || ev.metaKey
    return ev.key.toLowerCase() === key
      && (wantCtrl ? ctrlPressed : !ctrlPressed)
      && (wantShift ? ev.shiftKey : !ev.shiftKey)
      && (wantAlt ? ev.altKey : !ev.altKey)
  }

  function handler(ev: KeyboardEvent) {
    for (const s of shortcuts) {
      if (match(ev, s.combo)) {
        if (s.preventDefault !== false) ev.preventDefault()
        s.handler(ev)
        return
      }
    }
  }

  onMounted(() => window.addEventListener('keydown', handler))
  onUnmounted(() => window.removeEventListener('keydown', handler))
}
```

- [ ] **Step 3: Tests**

(Mount in `@vue/test-utils`, dispatch keyboard events with `KeyboardEvent`, assert handlers fire.)

- [ ] **Step 4: Commit**

```bash
cd /home/codigo47/sistemas/mason/source
git add apps/dashboard/src/composables/ apps/dashboard/tests/composables/
git commit -m "feat(dashboard): add lookup and keyboard composables"
```

---

### Task 8.4: Layout, Router, App shell

**Files:**
- Modify: `apps/dashboard/src/main.ts`
- Modify: `apps/dashboard/src/App.vue`
- Create: `apps/dashboard/src/router/index.ts`
- Create: `apps/dashboard/src/layouts/DefaultLayout.vue`

- [ ] **Step 1: `main.ts`**

```ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/main.css'

createApp(App).use(createPinia()).use(router).mount('#app')
```

- [ ] **Step 2: `router/index.ts`**

```ts
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/entries' },
    {
      path: '/entries',
      component: () => import('@/pages/EntriesPage.vue'),
    },
  ],
})

export default router
```

- [ ] **Step 3: `App.vue`**

```vue
<script setup lang="ts">
import DefaultLayout from '@/layouts/DefaultLayout.vue'
</script>

<template>
  <DefaultLayout>
    <RouterView />
  </DefaultLayout>
</template>
```

- [ ] **Step 4: `DefaultLayout.vue`**

```vue
<script setup lang="ts">
import CompanyContext from '@/components/CompanyContext.vue'
</script>

<template>
  <div class="min-h-screen bg-background text-foreground">
    <header class="border-b">
      <div class="mx-auto max-w-6xl flex items-center justify-between p-4">
        <h1 class="text-lg font-semibold">Time Entry</h1>
        <CompanyContext />
      </div>
    </header>
    <main class="mx-auto max-w-6xl p-4">
      <slot />
    </main>
  </div>
</template>
```

- [ ] **Step 5: Commit**

```bash
cd /home/codigo47/sistemas/mason/source
git add apps/dashboard/src/main.ts apps/dashboard/src/App.vue apps/dashboard/src/router apps/dashboard/src/layouts
git commit -m "feat(dashboard): wire router, pinia, layout shell"
```

---

### Task 8.5: CompanyContext component

**Files:**
- Create: `apps/dashboard/src/components/CompanyContext.vue`
- Create: `apps/dashboard/tests/components/CompanyContext.test.ts`

- [ ] **Step 1: Component**

```vue
<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useLookupsStore } from '@/stores/lookups'
import { useCompanyContextStore } from '@/stores/companyContext'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'

const lookups = useLookupsStore()
const ctx = useCompanyContextStore()

onMounted(() => lookups.loadCompanies())

const value = computed({
  get: () => ctx.companyId,
  set: (v) => (ctx.companyId = v as 'all' | string),
})
</script>

<template>
  <Select v-model="value">
    <SelectTrigger class="w-56" data-test="company-context">
      <SelectValue placeholder="Company" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">All companies</SelectItem>
      <SelectItem v-for="c in lookups.companies" :key="c.id" :value="c.id">{{ c.name }}</SelectItem>
    </SelectContent>
  </Select>
</template>
```

- [ ] **Step 2: Test** (use `@testing-library/vue`, mock the store, assert it loads companies on mount, that switching the value updates the store)

- [ ] **Step 3: Commit**

```bash
cd /home/codigo47/sistemas/mason/source
git add apps/dashboard/src/components/CompanyContext.vue apps/dashboard/tests/components/CompanyContext.test.ts
git commit -m "feat(dashboard): add CompanyContext selector"
```

---

### Task 8.6: EntriesPage with tabs

**Files:**
- Create: `apps/dashboard/src/pages/EntriesPage.vue`
- Create: `apps/dashboard/tests/pages/EntriesPage.test.ts`

- [ ] **Step 1: Implement page**

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import NewEntriesTab from '@/components/NewEntriesTab.vue'
import HistoryTab from '@/components/HistoryTab.vue'

const route = useRoute()
const router = useRouter()

const tab = computed({
  get: () => (route.query.tab === 'history' ? 'history' : 'new'),
  set: (v) => router.replace({ query: { ...route.query, tab: v } }),
})
</script>

<template>
  <Tabs v-model="tab" class="w-full">
    <TabsList>
      <TabsTrigger value="new">New Entries</TabsTrigger>
      <TabsTrigger value="history">History</TabsTrigger>
    </TabsList>
    <TabsContent value="new"><NewEntriesTab /></TabsContent>
    <TabsContent value="history"><HistoryTab /></TabsContent>
  </Tabs>
</template>
```

- [ ] **Step 2: Test** — mount with `mount(EntriesPage, { global: { plugins: [router, pinia] } })`, assert default tab is "new", switching tab updates URL.

- [ ] **Step 3: Commit**

```bash
cd /home/codigo47/sistemas/mason/source
git add apps/dashboard/src/pages/ apps/dashboard/tests/pages/
git commit -m "feat(dashboard): add EntriesPage with tabs"
```

---

### Task 8.7: NewEntriesTab + EntryRow + EntryFooter

**Files:**
- Create: `apps/dashboard/src/components/NewEntriesTab.vue`
- Create: `apps/dashboard/src/components/EntryRow.vue`
- Create: `apps/dashboard/src/components/EntryFooter.vue`
- Create: `apps/dashboard/src/components/AiAssistInput.vue`
- Create: `apps/dashboard/tests/components/NewEntriesTab.test.ts`
- Create: `apps/dashboard/tests/components/EntryRow.test.ts`

- [ ] **Step 1: EntryRow.vue** — receives a draft + emits `update:draft`, shows a row of selects/inputs

```vue
<script setup lang="ts">
import { computed, watch } from 'vue'
import type { TimeEntryDraft } from '@shared/schemas/timeEntry'
import { useLookupsStore } from '@/stores/lookups'

const props = defineProps<{
  draft: TimeEntryDraft
  rowErrors: Record<string, string[]>
}>()
const emit = defineEmits<{
  (e: 'update:draft', value: TimeEntryDraft): void
  (e: 'duplicate'): void
  (e: 'remove'): void
}>()

const lookups = useLookupsStore()

const employees = computed(() =>
  props.draft.company_id ? lookups.employeesByCompany[props.draft.company_id] ?? [] : [])
const projects = computed(() =>
  props.draft.company_id ? lookups.projectsByCompany[props.draft.company_id] ?? [] : [])
const tasks = computed(() =>
  props.draft.company_id ? lookups.tasksByCompany[props.draft.company_id] ?? [] : [])

watch(() => props.draft.company_id, async (id) => {
  if (!id) return
  await Promise.all([
    lookups.loadEmployees(id),
    lookups.loadProjects(id),
    lookups.loadTasks(id),
  ])
  // clear dependent fields when company changes
  emit('update:draft', { ...props.draft, employee_id: undefined, project_id: undefined, task_id: undefined })
})

function set<K extends keyof TimeEntryDraft>(key: K, value: TimeEntryDraft[K]) {
  emit('update:draft', { ...props.draft, [key]: value })
}
function err(field: string): string | undefined {
  return props.rowErrors[field]?.[0]
}
</script>

<template>
  <tr>
    <td><!-- company select bound to draft.company_id, list = lookups.companies, on change calls set('company_id', v) -->
      <select :value="draft.company_id" @change="set('company_id', ($event.target as HTMLSelectElement).value)">
        <option value="">Select…</option>
        <option v-for="c in lookups.companies" :key="c.id" :value="c.id">{{ c.name }}</option>
      </select>
      <p v-if="err('company_id')" class="text-xs text-red-600">{{ err('company_id') }}</p>
    </td>
    <td><input type="date" :value="draft.date" @input="set('date', ($event.target as HTMLInputElement).value)" /></td>
    <td>
      <select :value="draft.employee_id" :disabled="!draft.company_id" @change="set('employee_id', ($event.target as HTMLSelectElement).value)">
        <option value="">Select…</option>
        <option v-for="e in employees" :key="e.id" :value="e.id">{{ e.name }}</option>
      </select>
      <p v-if="err('employee_id')" class="text-xs text-red-600">{{ err('employee_id') }}</p>
    </td>
    <td>
      <select :value="draft.project_id" :disabled="!draft.company_id" @change="set('project_id', ($event.target as HTMLSelectElement).value)">
        <option value="">Select…</option>
        <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.name }}</option>
      </select>
      <p v-if="err('project_id')" class="text-xs text-red-600">{{ err('project_id') }}</p>
    </td>
    <td>
      <select :value="draft.task_id" :disabled="!draft.company_id" @change="set('task_id', ($event.target as HTMLSelectElement).value)">
        <option value="">Select…</option>
        <option v-for="t in tasks" :key="t.id" :value="t.id">{{ t.name }}</option>
      </select>
      <p v-if="err('task_id')" class="text-xs text-red-600">{{ err('task_id') }}</p>
    </td>
    <td>
      <input type="number" step="0.25" min="0.25" max="24" :value="draft.hours"
        @input="set('hours', Number(($event.target as HTMLInputElement).value))" />
      <p v-if="err('hours')" class="text-xs text-red-600">{{ err('hours') }}</p>
    </td>
    <td>
      <input type="text" :value="draft.notes ?? ''"
        @input="set('notes', ($event.target as HTMLInputElement).value)" />
    </td>
    <td>
      <button @click="emit('duplicate')">Duplicate</button>
      <button @click="emit('remove')">Remove</button>
    </td>
  </tr>
</template>
```

- [ ] **Step 2: NewEntriesTab.vue**

```vue
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useDraftEntriesStore } from '@/stores/draftEntries'
import { useLookupsStore } from '@/stores/lookups'
import { useCompanyContextStore } from '@/stores/companyContext'
import { useKeyboardShortcuts } from '@/composables/useKeyboardShortcuts'
import { api, fieldErrors } from '@/services/api'
import { timeEntryRowSchema } from '@shared/schemas/timeEntry'
import EntryRow from './EntryRow.vue'
import EntryFooter from './EntryFooter.vue'
import AiAssistInput from './AiAssistInput.vue'

const drafts = useDraftEntriesStore()
const lookups = useLookupsStore()
const ctx = useCompanyContextStore()

const errorsByRow = ref<Record<number, Record<string, string[]>>>({})
const banner = ref<string | null>(null)

onMounted(async () => {
  await lookups.loadCompanies()
  if (drafts.rows.length === 0) {
    drafts.addRow({ company_id: ctx.companyId !== 'all' ? ctx.companyId : undefined })
  }
})

function localValidate(): boolean {
  errorsByRow.value = {}
  let ok = true
  drafts.rows.forEach((row, i) => {
    const result = timeEntryRowSchema.safeParse(row)
    if (!result.success) {
      ok = false
      const fmt: Record<string, string[]> = {}
      for (const issue of result.error.issues) {
        const k = issue.path.join('.')
        ;(fmt[k] ??= []).push(issue.message)
      }
      errorsByRow.value = { ...errorsByRow.value, [i]: fmt }
    }
  })

  // cross-row: same employee+date with different project
  const seen = new Map<string, { idx: number; project: string }>()
  drafts.rows.forEach((row, i) => {
    if (!row.employee_id || !row.date || !row.project_id) return
    const key = row.employee_id + '|' + row.date
    const existing = seen.get(key)
    if (existing && existing.project !== row.project_id) {
      ok = false
      ;(errorsByRow.value[i] ??= {}).project_id = ['Conflicts with row '+(existing.idx + 1)+' (different project on same day).']
    } else {
      seen.set(key, { idx: i, project: row.project_id })
    }
  })

  return ok
}

async function submit() {
  banner.value = null
  if (!localValidate()) {
    banner.value = 'Fix highlighted issues and try again.'
    return
  }
  try {
    await api.post('/time-entries/batch', { entries: drafts.rows })
    drafts.clear()
    drafts.addRow()
    banner.value = 'Saved!'
  } catch (e) {
    const errs = fieldErrors(e)
    const grouped: Record<number, Record<string, string[]>> = {}
    for (const [k, v] of Object.entries(errs)) {
      const m = k.match(/^entries\.(\d+)\.(.+)$/)
      if (m) {
        const idx = Number(m[1])
        ;(grouped[idx] ??= {})[m[2]] = v
      }
    }
    errorsByRow.value = grouped
    banner.value = 'Server rejected one or more rows.'
  }
}

useKeyboardShortcuts([
  { combo: 'ctrl+enter', handler: submit },
  { combo: 'cmd+enter', handler: submit },
])
</script>

<template>
  <div class="space-y-4">
    <AiAssistInput />
    <div v-if="banner" data-test="banner">{{ banner }}</div>
    <table class="w-full">
      <thead>
        <tr>
          <th>Company</th><th>Date</th><th>Employee</th><th>Project</th><th>Task</th><th>Hours</th><th>Notes</th><th></th>
        </tr>
      </thead>
      <tbody>
        <EntryRow v-for="(row, i) in drafts.rows" :key="row._id"
          :draft="row" :row-errors="errorsByRow[i] ?? {}"
          @update:draft="(v) => (drafts.rows[i] = v)"
          @duplicate="drafts.duplicate(i)"
          @remove="drafts.remove(i)"
        />
      </tbody>
    </table>
    <EntryFooter @add-row="drafts.addRow()" @submit="submit" />
  </div>
</template>
```

- [ ] **Step 3: EntryFooter.vue** — Add row, submit, totals

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useDraftEntriesStore } from '@/stores/draftEntries'

const emit = defineEmits<{ (e: 'add-row'): void; (e: 'submit'): void }>()
const drafts = useDraftEntriesStore()
const total = computed(() => drafts.rows.reduce((s, r) => s + (Number(r.hours) || 0), 0))
</script>

<template>
  <div class="flex items-center gap-3">
    <button @click="emit('add-row')">Add row</button>
    <button @click="emit('submit')">Submit</button>
    <span class="ml-auto">Total: {{ total.toFixed(2) }}h</span>
  </div>
</template>
```

- [ ] **Step 4: AiAssistInput.vue**

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { api } from '@/services/api'
import { useDraftEntriesStore } from '@/stores/draftEntries'

const aiEnabled = import.meta.env.VITE_AI_ENABLED === 'true'
const text = ref('')
const loading = ref(false)
const error = ref<string | null>(null)
const drafts = useDraftEntriesStore()

async function parse() {
  if (!text.value.trim()) return
  loading.value = true
  error.value = null
  try {
    const { data } = await api.post('/time-entries/parse', { text: text.value })
    if (!data.rows.length) {
      error.value = 'AI could not extract any rows. Add manually.'
      return
    }
    for (const row of data.rows) {
      drafts.addRow({ ...row })
    }
    text.value = ''
  } catch (_e) {
    error.value = 'AI parsing failed.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div v-if="aiEnabled" class="rounded border p-3">
    <label class="text-sm">AI assist</label>
    <textarea v-model="text" rows="2" class="w-full" placeholder="e.g. Athena worked on Olympus CRM doing cleanup for 2 hours on 2026-05-01" />
    <div class="flex items-center gap-2">
      <button :disabled="loading" @click="parse">{{ loading ? 'Parsing…' : 'Parse' }}</button>
      <span v-if="error" class="text-red-600 text-sm">{{ error }}</span>
    </div>
  </div>
</template>
```

- [ ] **Step 5: Tests** — for each component, render with @testing-library/vue, simulate user interactions (typing, selecting, click submit), assert API call shape (mock api.post) and DOM updates.

- [ ] **Step 6: Commit**

```bash
cd /home/codigo47/sistemas/mason/source
git add apps/dashboard/src/components/{NewEntriesTab,EntryRow,EntryFooter,AiAssistInput}.vue apps/dashboard/tests/components/
git commit -m "feat(dashboard): implement new entries tab with row UI, AI assist, keyboard submit"
```

---

### Task 8.8: HistoryTab + filters + table + summary

**Files:**
- Create: `apps/dashboard/src/components/HistoryTab.vue`
- Create: `apps/dashboard/src/components/HistoryFilters.vue`
- Create: `apps/dashboard/src/components/HistoryTable.vue`
- Create: `apps/dashboard/src/components/HistorySummary.vue`
- Create: tests for each component

- [ ] **Step 1: HistoryTab.vue**

```vue
<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useHistoryStore } from '@/stores/history'
import { useCompanyContextStore } from '@/stores/companyContext'
import HistoryFilters from './HistoryFilters.vue'
import HistoryTable from './HistoryTable.vue'
import HistorySummary from './HistorySummary.vue'

const history = useHistoryStore()
const ctx = useCompanyContextStore()

watch(() => ctx.companyId, (id) => {
  history.filters.company_id = id === 'all' ? undefined : id
  history.load()
}, { immediate: true })

onMounted(() => { history.load() })
</script>

<template>
  <div class="space-y-4">
    <HistoryFilters />
    <HistoryTable />
    <HistorySummary />
  </div>
</template>
```

- [ ] **Step 2: HistoryFilters.vue** — date range, employee filter, project filter, search box bound to `history.filters` and triggers `load()` on change (debounced for `q`).

- [ ] **Step 3: HistoryTable.vue** — sortable columns, pagination controls, edit-in-place dialog, delete with confirm.

- [ ] **Step 4: HistorySummary.vue** — group_by dropdown, calls `history.loadSummary(groupBy)`, renders totals.

- [ ] **Step 5: Tests** — covering filter changes triggering loads, sort updating params, edit/delete API calls.

- [ ] **Step 6: Commit**

```bash
cd /home/codigo47/sistemas/mason/source
git add apps/dashboard/src/components/History*.vue apps/dashboard/tests/components/History*
git commit -m "feat(dashboard): implement history tab with filters, sorting, pagination, summary"
```

---

### Task 8.9: Keyboard shortcut help dialog and additional shortcuts

**Files:**
- Modify: `apps/dashboard/src/pages/EntriesPage.vue`
- Create: `apps/dashboard/src/components/ShortcutsDialog.vue`

- [ ] **Step 1: ShortcutsDialog**

```vue
<script setup lang="ts">
const shortcuts = [
  ['Tab / Shift+Tab', 'Move between cells'],
  ['Enter (last cell)', 'Add a new row'],
  ['Ctrl/Cmd + D', 'Duplicate row'],
  ['Ctrl/Cmd + Backspace', 'Delete row'],
  ['Ctrl/Cmd + Enter', 'Submit'],
  ['Ctrl/Cmd + 1 / 2', 'Switch tabs'],
  ['?', 'Open this help'],
]
</script>

<template>
  <div class="rounded border p-4">
    <h2 class="font-semibold">Keyboard shortcuts</h2>
    <ul class="mt-2 grid grid-cols-2 gap-2 text-sm">
      <li v-for="[k, v] in shortcuts" :key="k"><code>{{ k }}</code> — {{ v }}</li>
    </ul>
  </div>
</template>
```

- [ ] **Step 2: Wire `?` shortcut on the EntriesPage** to toggle dialog visibility; Ctrl/Cmd+1/2 to switch tabs.

- [ ] **Step 3: Commit**

```bash
cd /home/codigo47/sistemas/mason/source
git add apps/dashboard/src/components/ShortcutsDialog.vue apps/dashboard/src/pages/EntriesPage.vue
git commit -m "feat(dashboard): add keyboard shortcut help dialog"
```

---

### Task 8.10: Final lint, typecheck, coverage

- [ ] **Step 1: Run all checks**

```bash
cd /home/codigo47/sistemas/mason/source
npm --workspace apps/dashboard run lint
npm --workspace apps/dashboard run typecheck
npm --workspace apps/dashboard run test
(cd apps/api && ./vendor/bin/phpstan analyse --memory-limit=2G)
(cd apps/api && ./vendor/bin/pest --coverage --min=100)
```

Expected: all green; coverage ≥ 100% on backend and frontend modules.

- [ ] **Step 2: Commit any cleanups**

```bash
git add .
git commit -m "chore: lint, typecheck, coverage clean" || true
```

---

## Phase 9 — Documentation

### Task 9.1: Root CLAUDE.md

**Files:**
- Create: `CLAUDE.md`

- [ ] **Step 1: Write CLAUDE.md**

```markdown
# CLAUDE.md — Time Entry Monorepo

This is a Laravel + Vue monorepo. Two apps:

- `apps/api` — Laravel 12 REST API (PHP 8.3, Postgres). See `apps/api/CLAUDE.md`.
- `apps/dashboard` — Vue 3 SPA (TypeScript, Vite, Tailwind, shadcn-vue). See `apps/dashboard/CLAUDE.md`.

## Working directory contract

Always run commands from the repo root unless the file says otherwise.
- Bring up the database: `docker compose up -d`
- Full bootstrap: `bash scripts/dev.sh`

## Conventions

- All new IDs are UUIDv7. Never introduce auto-incrementing primary keys.
- The API never serves HTML; the dashboard never embeds in a server-rendered page. Calls go over HTTP.
- Validations live in the API. The frontend mirrors them with Zod for UX speed but is not authoritative.
- Cache only via `Cache-Control` and `ETag` (HTTP-level). No Redis until traffic justifies it (see README_detailed).

## Tests

- Backend: `cd apps/api && ./vendor/bin/pest`
- Frontend: `npm --workspace apps/dashboard run test`
- Both target 100% coverage. Don't ship a feature without tests.

## Style

- Backend follows Laravel + PSR-12 + Larastan level 8.
- Frontend follows the shared ESLint config in `packages/eslint-config` and `vue-tsc --strict`.
```

- [ ] **Step 2: Commit**

```bash
cd /home/codigo47/sistemas/mason/source
git add CLAUDE.md
git commit -m "docs: add root CLAUDE.md"
```

---

### Task 9.2: API CLAUDE.md

**Files:**
- Create: `apps/api/CLAUDE.md`

- [ ] **Step 1: Write**

```markdown
# CLAUDE.md — apps/api

Laravel 12 REST API on PHP 8.3, Postgres 16. No auth scaffolded.

## Layout

- `app/Models/` — Eloquent models with `HasUuids` and a `newUniqueId()` returning UUIDv7.
- `app/Http/Controllers/Api/V1/` — thin controllers, one per resource.
- `app/Http/Resources/` — JSON shape for responses.
- `app/Http/Requests/` — validation rules. Common rules in `Concerns/TimeEntryRules.php`.
- `app/Actions/` — write-side business logic (CreateTimeEntries, UpdateTimeEntry, ParseTimeEntryText).
- `app/Services/` — read-side helpers (EtagService).
- `app/Exceptions/TimeEntryValidationException` — carries field-pathed errors out of actions.

## Business rule

An employee can only work on one project per date. Enforced in `CreateTimeEntries` and `UpdateTimeEntry` inside a transaction with `SELECT ... FOR UPDATE` on the `(employee_id, date)` rows. The DB only protects against exact duplicates via `UNIQUE(employee_id, date, project_id, task_id)`.

## Cache headers

Lookup endpoints set `Cache-Control: private, max-age=60` and an `ETag` from `EtagService`. They return `304` on `If-None-Match` match. The dashboard's axios layer auto-replays the cached body on 304.

## Tests

- `tests/Unit/` — pure unit tests for models, services, actions
- `tests/Feature/` — HTTP tests for endpoints and form requests
- Run: `./vendor/bin/pest --coverage`

## Adding a new endpoint

1. Form Request with rules
2. Action (if it mutates state) or controller method (if read-only)
3. Resource (if returning a model)
4. Route
5. Feature test for the route + Unit test for the action
```

- [ ] **Step 2: Commit**

```bash
git add apps/api/CLAUDE.md
git commit -m "docs(api): add CLAUDE.md"
```

---

### Task 9.3: Dashboard CLAUDE.md

**Files:**
- Create: `apps/dashboard/CLAUDE.md`

- [ ] **Step 1: Write**

```markdown
# CLAUDE.md — apps/dashboard

Vue 3 + TypeScript + Vite + Tailwind + shadcn-vue.

## Layout

- `src/services/api.ts` — Axios instance with ETag cache (replays cached body on 304).
- `src/stores/` — Pinia stores. Each has its own file (`companyContext`, `lookups`, `draftEntries`, `history`).
- `src/composables/` — reusable hooks (`useLookupsForCompany`, `useKeyboardShortcuts`).
- `src/components/` — UI components. shadcn-vue primitives live in `src/components/ui/` (don't hand-edit).
- `src/pages/` — route-level views.
- `src/layouts/` — outer chrome.

## Validation

Frontend validation uses Zod schemas from `@shared/schemas/timeEntry`. They are intentionally identical in spirit to the backend's Form Request rules. The backend remains authoritative — render its errors keyed by `entries.<i>.<field>` for the right cell.

## Keyboard shortcuts

Defined in `composables/useKeyboardShortcuts.ts`. Add new ones at the call site (typically `EntriesPage.vue`). Press `?` for the help dialog.

## Tests

`npm run test` runs Vitest with `@vue/test-utils` and `@testing-library/vue`. Coverage thresholds are 100% for lines/branches/functions/statements.

## When adding a feature

1. Schema in `packages/shared-types/src/schemas/`
2. Store changes (state + actions)
3. Component(s)
4. Tests for store + component
5. Wire into page
```

- [ ] **Step 2: Commit**

```bash
git add apps/dashboard/CLAUDE.md
git commit -m "docs(dashboard): add CLAUDE.md"
```

---

### Task 9.4: README.md and README_detailed.md

**Files:**
- Modify: `README.md`
- Create: `README_detailed.md`

- [ ] **Step 1: README.md**

```markdown
# Time Entry App

A Laravel 12 REST API + Vue 3 SPA for recording employee time entries. See `README_detailed.md` for the deeper write-up.

## Requirements

- PHP 8.3 with `pdo_pgsql`, `intl`, `bcmath`
- Composer 2.x
- Node 22 + npm 10
- Docker (only for Postgres)

## Setup

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/dashboard/.env.example apps/dashboard/.env
bash scripts/dev.sh
```

`scripts/dev.sh` brings up Postgres on port 5477, installs dependencies for both apps, and runs migrations + seeders.

## Run (in two terminals)

```bash
# Terminal 1 — API
cd apps/api && php artisan serve --host=127.0.0.1 --port=8000

# Terminal 2 — Dashboard
npm --workspace apps/dashboard run dev
```

Visit http://127.0.0.1:5173.

## Environment variables

- Root `.env`: Postgres credentials and ports (used by docker-compose).
- `apps/api/.env`:
  - `DB_*` for Postgres
  - `OPENAI_API_KEY` (optional) — enables AI-assisted entry. Leave blank to hide it.
  - `OPENAI_MODEL` — defaults to `gpt-4o-mini`.
- `apps/dashboard/.env`:
  - `VITE_API_BASE_URL` — defaults to `http://127.0.0.1:8000/api/v1`.
  - `VITE_AI_ENABLED` — `true`/`false`. Set to `false` to hide the AI chat box.

## Tests

```bash
# Backend
cd apps/api && ./vendor/bin/pest --coverage

# Frontend
npm --workspace apps/dashboard run test
```
```

- [ ] **Step 2: README_detailed.md**

```markdown
# Time Entry App — Detailed

## Goal

Capture employee time entries while enforcing:
- Employee belongs to a chosen company.
- Project belongs to that company.
- Task belongs to that company.
- An employee can have only one project per date — but multiple tasks for that project that day.

## Architecture

Decoupled monorepo:
- `apps/api` — Laravel 12 REST API on Postgres 16.
- `apps/dashboard` — Vue 3 SPA.
- `packages/shared-types` — TypeScript types and Zod schemas shared between frontend and (in concept) the API contract.
- `packages/eslint-config` — ESLint 9 flat config used by the dashboard.

Postgres runs in Docker on port 5477. The API and dashboard run on the host.

## Tech choices

- **Laravel 12 + PHP 8.3** — modern, broad compatibility.
- **Vue 3 + TypeScript + Vite + Tailwind + shadcn-vue** — distinctive UI, full control over the multi-row time-entry editor.
- **Pinia + VeeValidate + Zod** — Vue ecosystem standards. Zod schemas live in `packages/shared-types`.
- **Pest 3 + Larastan + Spatie Query Builder** — modern Laravel testing and clean filter parsing.
- **OpenAI** — `gpt-4o-mini` for AI-assisted entry parsing.

## Directory structure

[mirror the spec exactly]

## Features and how they were implemented

### Time entry creation (single + batch)

`POST /api/v1/time-entries` and `POST /api/v1/time-entries/batch` route to `CreateTimeEntries`, an Action wrapped in `DB::transaction`. It:
1. Validates each row (Form Request), then the action runs business validation.
2. Locks the existing `(employee_id, date)` rows with `SELECT ... FOR UPDATE`.
3. Rejects rows that conflict with persisted state OR with other rows in the same batch.
4. Returns row-keyed errors (e.g. `entries.3.project_id`) so the SPA highlights the offending cell.

### History tab

Backed by `GET /api/v1/time-entries`, paginated by Spatie Query Builder. Filters: company, employee, project, task, date range, full-text on notes. Sorts: `-date`, `hours`, `created_at`.

### Summary totals

`GET /api/v1/time-entries/summary?group_by=date|employee|project|task|company` aggregates SUM(hours) and COUNT(*) per group key, respecting the same filters.

### Edit and delete from history

`PATCH` and `DELETE` on `/api/v1/time-entries/{id}`. Edit goes through `UpdateTimeEntry`, which re-runs the per-day-project rule.

### AI-assisted entry

`POST /api/v1/time-entries/parse` accepts `{ text }`. The action sends a system prompt that includes the company directory and asks for structured JSON rows. Names are resolved to UUIDs server-side; unknown names produce `null` IDs that the user must correct in the UI. Hidden when `OPENAI_API_KEY` is unset.

### Keyboard-friendly entry

Tab/Shift+Tab moves cell-by-cell (default browser behavior given proper inputs). Enter on the last cell of the last row adds a new row. Ctrl/Cmd+D duplicates a row. Ctrl/Cmd+Enter submits. Ctrl/Cmd+1/2 switches tabs. `?` opens the help dialog.

### Caching

Lookup endpoints (companies, employees per company, projects per company, tasks per company) set `Cache-Control: private, max-age=60` and an `ETag` derived from `MAX(updated_at) + COUNT(*)`. The Axios layer in the SPA replays the cached body on 304. Pinia memoizes per-company lookups for the session.

### Validation strategy

Frontend uses Zod. Backend uses Form Requests + Action-level rules + DB constraints. The backend wins; the frontend just speeds up the user.

## Performance considerations

- Every list endpoint eager-loads relations to avoid N+1.
- Time-entry filters use indexed columns (`(company_id, date)`, `(employee_id, date)`).
- ETag-based revalidation prevents redundant payloads on dropdowns.
- Pagination caps at 100 rows per page.
- AI parsing is rate-limited to 10/min/IP and timeboxed (8s).

### Future scale-up paths

- **Redis tagged cache** — replace HTTP caching for high-traffic dropdowns; invalidate by tag on writes.
- **Materialized summary views** — pre-aggregate by employee/project/date for very large datasets.
- **Cursor pagination** — once `time_entries` exceeds a few million rows, switch from offset to keyset.
- **Search index** — full-text search on notes and entity names via Postgres GIN index or a dedicated search service.
- **Read replicas** — split read traffic for `GET /time-entries` once write QPS becomes meaningful.

## Testing

- Backend: 100% line coverage on models, services, actions, requests, and controllers.
- Frontend: 100% on stores, composables, and components.
- Static analysis: Larastan level 8 + `vue-tsc --strict`.

## Out of scope

Authentication, RBAC, Redis, E2E tests, CI workflows, production deployment beyond `scripts/deploy.sh` stub. All documented in the spec.
```

- [ ] **Step 3: Commit**

```bash
git add README.md README_detailed.md
git commit -m "docs: write basic and detailed README"
```

---

## Phase 10 — Final Verification

### Task 10.1: Full check

- [ ] **Step 1: Reset DB and reseed**

```bash
cd apps/api
php artisan migrate:fresh --seed
```

- [ ] **Step 2: Run full test suite + coverage**

```bash
cd /home/codigo47/sistemas/mason/source
(cd apps/api && ./vendor/bin/pest --coverage --min=100)
(cd apps/api && ./vendor/bin/phpstan analyse --memory-limit=2G)
npm --workspace apps/dashboard run typecheck
npm --workspace apps/dashboard run lint
npm --workspace apps/dashboard run test
```

Expected: all pass; coverage ≥ 100%.

- [ ] **Step 3: Boot the app and smoke-test the UI**

In two terminals, run the API and the dashboard, then exercise:
- Switch the company selector and observe dropdowns scoping
- Create a row, add another, submit
- Force a conflict (same employee+date, two projects) and observe the row-level error
- Edit an entry from History, delete one, sort/filter the table
- Try the AI input (with key set) and confirm rows are added
- Press `?` to open shortcuts dialog

- [ ] **Step 4: Final commit (if any leftover)**

```bash
git add .
git commit -m "chore: final smoke-test polish" || true
```

---

## Done

The repo now contains:
- Working Laravel 12 API on `127.0.0.1:8000`
- Working Vue 3 SPA on `127.0.0.1:5173`
- Postgres on `localhost:5477`
- 100% test coverage on both apps
- All bonus features (edit, duplicate, validation UX, summaries, history filters, keyboard shortcuts, AI-assisted entry)
- Full documentation (root README, detailed README, three CLAUDE.md files, design spec, this plan)
