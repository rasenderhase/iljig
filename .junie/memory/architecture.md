# Architecture Decisions: Card Game

## API: RESTful API defined in openapi.yml
- Reason: OpenAPI specification allows for a more consistent and standardized API design. Client and server interface code can be generated automatically. The Rest API uses path /api.

## Frontend: Zoneless Angular Application
- Reason: Zoneless architecture allows for a more flexible and modular design, enabling better separation of concerns and easier maintenance and better performance

## Frontend State Management: NgRx signal store
- Reason: NgRx signal store provides a powerful and scalable state management solution for Angular applications. It allows for better organization of application state, improved performance, and easier debugging compared to traditional NgRx store.

## Testing: Jest instead of Jasmine/Karma
- Reason: Jest is faster, has a better developer experience, and is the industry standard for modern JavaScript/TypeScript projects.
- Advantage: Snapshot testing, faster execution, and easier mocking compared to Jasmine.
