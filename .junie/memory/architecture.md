# Architecture Decisions: Serverless Card Game

## Choice: AWS over Firebase
- Grund: Der Benutzer hat bereits einen AWS Account und bestehende Projekte auf AWS.
- Vorteil: Konsistenz in der Cloud-Infrastruktur.

## API & Real-time: AWS AppSync (GraphQL)
- Grund: AppSync bietet native Unterstützung für WebSockets via "Subscriptions". 
- Vorteil: Synchronisierung des Spielzustands in Echtzeit ohne Polling.

## Database: Amazon DynamoDB
- Grund: Schnelle, serverlose NoSQL-Datenbank.
- Vorteil: Kosteneffizient bei geringem Traffic, skalierbar bei Bedarf.

## Logic: AWS Lambda
- Grund: Serverlose Funktionen zum Ausführen kritischer Spielregeln (z.B. Karten mischen).
- Vorteil: Sicherheit (Regeln werden auf dem "Server" validiert, nicht nur im Client) und geringe Kosten.

## Infrastructure Management: AWS Amplify CLI (Empfehlung)
- Grund: Vereinfacht die Verknüpfung von Angular mit AWS Services wie AppSync und DynamoDB erheblich.
- Vorteil: Schnelles Prototyping und einfachere CI/CD-Integration.
