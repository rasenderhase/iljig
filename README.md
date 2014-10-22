Kartenspiel
===

### Rollen:
       * Admin
       * Teilnehmer
       * Zuschauer

### Ablauf der Spiel-Anlage:

       * Startseite (alle)                  get   /
       * Spiel anlegen (Admin)              post  /spiel/:spiel_id adminGeheimnis="xyz"
       * Teilnehmer einladen (Admin)        email
       * teilnehmen  (Admin, Teilnehmer)    post  /spiel/:spiel_id/spieler/:spieler_id
       * Spiel starten (Admin)              post  /spiel/:spiel_id status="Gestartet"
       * Spielstatus anzeigen (alle)        get   /spiel/:spiel_id