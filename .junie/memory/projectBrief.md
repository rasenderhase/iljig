# Project Brief: Serverless Card Game

## Core Idea
Ein serverloses Kartenspiel, das über eine Web-App (Angular) zugänglich ist. Spieler können über ihre eigenen Geräte (QR-Code/PIN) beitreten.

## Goals
- Multi-Device Support: Jeder Spieler nutzt sein eigenes Handy/Gerät.
- Serverless Architecture: Minimale Kosten, hohe Skalierbarkeit, keine Serververwaltung.
- Real-time Interaction: Spielzüge müssen sofort bei allen Spielern sichtbar sein.
- Easy Joining: Beitritt über QR-Code oder PIN (ähnlich Kahoot).

## Tech Stack
- **Frontend:** Angular
- **Hosting:** AWS Amplify / S3 + CloudFront
- **Real-time/API:** AWS AppSync (GraphQL Subscriptions)
- **Database:** Amazon DynamoDB
- **Business Logic:** AWS Lambda (TypeScript/Node.js)
- **Authentication:** Amazon Cognito (optional für Profile)
