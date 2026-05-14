# Setup Plan: OpenAPI Code Generation

This plan outlines the steps to implement automated code generation for both Java (Spring Boot) and TypeScript (Angular) based on an `openapi.yml` definition.

## 1. OpenAPI Specification Definition
- **File Creation:** Create `api-spec/openapi.yml` to define the API contracts (Lobby, Games, Players).
- **Initial Endpoints:**
    - `POST /lobby/create`: Initialize a game.
    - `POST /lobby/join`: Join a game via PIN.
    - `GET /lobby/{pin}`: Get lobby status.

## 2. Java (Spring Boot) Generation
- **Plugin Integration:** Add `openapi-generator-maven-plugin` (or Gradle equivalent) to `app/build.gradle`.
- **Configuration:**
    - **Generator:** `spring`
    - **Interface-only:** Set to `true` to generate only interfaces and models (delegating implementation).
    - **Library:** `spring-boot`
    - **Output Directory:** `app/build/generated/openapi`
- **Build Integration:** Ensure the generation runs during the `./gradlew build` or `./gradlew compileJava` task.

## 3. Angular (TypeScript) Generation
- **Library Selection:** Use `@openapitools/openapi-generator-cli`.
- **NPM Integration:** Add a script to `package.json`:
    - `"api:generate": "openapi-generator-cli generate -i api-spec/openapi.yml -g typescript-angular -o src/app/api"`
- **Angular Integration:** 
    - Configure the generated `ApiModule` in `app.config.ts`.
    - Inject generated services into Angular components.

## 4. Automation & CI/CD
- **Consistency Check:** Ensure that changes to `openapi.yml` trigger both generation paths.
- **Git Strategy:** Decide whether to commit generated code or generate on-the-fly (Recommended: ignore generated code in `.gitignore` and generate during build).

## 5. Verification
- **Compilation:** Ensure Spring Boot compiles with the new generated interfaces.
- **Service Mocking:** Verify Angular can call the generated services (using dummy data initially).
