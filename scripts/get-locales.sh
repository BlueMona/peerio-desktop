#!/usr/bin/env bash
cp node_modules/peerio-copy/icebear_en.json src/static/locales/en.json
cp -R node_modules/peerio-copy/phrase/dict src/static/locales
tx pull -af
