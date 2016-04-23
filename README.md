Kartenspiel
===

[![Build Status](https://img.shields.io/travis/rasenderhase/iljig.svg)](https://travis-ci.org/rasenderhase/iljig)
[![Code Climate](https://img.shields.io/codeclimate/github/rasenderhase/iljig.svg)](https://codeclimate.com/github/rasenderhase/iljig)
[![Codacy Badge](https://api.codacy.com/project/badge/grade/b0f1bbb63acc4672a2870e203df4c232)](https://www.codacy.com/app/andreas-knees/iljig)
[![Codacy Badge](https://api.codacy.com/project/badge/coverage/b0f1bbb63acc4672a2870e203df4c232)](https://www.codacy.com/app/andreas-knees/iljig)
[![Issue Count](https://codeclimate.com/github/rasenderhase/iljig/badges/issue_count.svg)](https://codeclimate.com/github/rasenderhase/iljig/issues)

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
