# Website CHAI Dessert und Kaffee

Statische Website, fertig zum Hochladen. Keine Build-Schritte, keine Abhängigkeiten,
kein Framework. Einfach den Ordner `site/` auf den Webspace kopieren.

```
site/
  index.html          Startseite, kurz: Hero, Ube, Farbblock, Karte und Standort
  speisekarte.html    Die ganze Karte, 52 Positionen mit Filter
  impressum.html      Impressum (Platzhalter, siehe unten)
  datenschutz.html    Datenschutzerklärung (Platzhalter, siehe unten)
  styles.css          Gesamtes Design, ein einziges Token-System
  main.js             Navigation, Kartenfilter, Einblendungen, Rezensionen-Linie
  assets/img/         16 Bilder plus Logo und Favicons, auf Webgröße gerechnet
  assets/fonts/       Marcellus und Karla, selbst gehostet (180 KB)
```

Lokal ansehen:

```bash
python -m http.server 4173 --directory site
```

---

## Was drin steckt

**Design.** Aufbau, Proportionen und Navigation folgen blankstreet.com. Nachgebaut wurden:
feste Navigation mit Status und Telefon links, Wortmarke zentriert und Seitenlinks rechts,
transparent ueber dem Vollbild und ab dem Scrollen cremefarben; Ueberschriften 60 px im Hero
und 55 px in den Bloecken mit Zeilenhoehe 0,95; Fliesstext 20 px; Kanten durchgehend ohne
Rundung.

**Abschnittsfolge der Startseite**, genau wie im Vorbild:

| # | Abschnitt | Grund | Bilder |
|---|---|---|---|
| 1 | Hero | Foto, ganzer Bildschirm, Text darauf | 1 |
| 2 | Ube | leere Flaeche, ein Foto daneben | 1 |
| 3 | Spendenaktion | Farbblock in Chai-Rot, ohne Bild | 0 |
| 4 | Karte und Standort | leere Flaeche, zwei Fotos | 2 |
| 5 | Google-Bewertungen | Navy, Rating und endlose Rezensionen-Linie | 0 |
| 6 | Fusszeile | Navy mit Adresse, Zeiten, Kontakt | 0 |

Die Startseite ist damit kurz, so wie beim Vorbild. Die volle Karte mit 52 Positionen und
Filter liegt auf einer eigenen Seite `speisekarte.html`, so wie dort /shop und /locations
eigene Seiten sind.

**Farben.** Ausschliesslich aus dem Logo: Creme vom Aufkleber traegt die Seite, Navy vom
Teeglas traegt Schrift und Fusszeile, Chai-Rot vom Tee ist Akzent und der eine Farbblock.

**Inhalt.** Alle Angaben stammen aus echten Quellen, nichts ist erfunden:

| Inhalt | Quelle |
|---|---|
| Preise Ube, Frucht-Mix, Dirty Soda, Crêpes | Menütafeln aus den Facebook-Beiträgen |
| Caramel Iced Latte 4,95 €, Pistazien Eis Latte 5,10 € | Aushänge auf Fotos |
| Markenphilosophie | Facebook-Beitrag vom 09.11.2025 |
| „Kostenlos für Menschen in Not" | Facebook-Beitrag vom 09.11.2025 |
| „Sei anders. Sei besonders. Sei CHAI." | Facebook-Beitrag vom 17.12.2025 |
| 4,9 Sterne bei 191 Bewertungen | Google Maps, Stand 08.09.2026 |
| Öffnungszeiten, Adresse, Etage | Schlosshöfe-Website und Google |
| Telefon, E-Mail | Facebook-Seite |
| Rezensionen | Google Maps, kurze sinngemäße Auszüge mit Autor und Datum |

**Fotos.** Der Hero nutzt zwei Motive: auf Bildschirmen bis 820 Pixel Breite das Matcha-Ube-Foto
aus dem Facebook-Beitrag vom 19.08.2026 (1440 x 1630 Pixel), auf größeren Bildschirmen die
Kaffee-Aufnahme bei Google vom 10.01.2026 (im Original 3024 x 4032 Pixel). Das mobile Foto liegt
ohne erneute Komprimierung vor; die drei Desktop-Größen wurden ausschließlich heruntergerechnet,
nichts wurde hochskaliert. Es werden nur Bilder verwendet, die das Café selbst veröffentlicht hat,
also Facebook-Beiträge und die vom Inhaber bei Google hochgeladenen Fotos. Gästefotos aus Google
sind bewusst nicht dabei, weil die Rechte daran bei den Gästen liegen. KI-generierte Motive wurden
ebenfalls aussortiert.

**Technik.**

- Ein Farbklima für die ganze Seite, kein Wechsel mitten im Scrollen
- Helle Flächen bleiben bewusst einfarbig: keine Rasterlinien, Verläufe, Körnung oder
  Wasserzeichen im leeren Hintergrund
- Die Tassenmarke liegt ohne farbige Bildfläche auf der Navigation und in der Fusszeile;
  die größere Variante in der Navigation macht die drei animierten Dampflinien klar erkennbar;
  bei reduzierter Bewegung bleiben sie statisch
- Im Ube-Abschnitt kommen Text und Produktfoto beim Scrollen von links und rechts zusammen;
  auf schmalen Bildschirmen bleiben die Richtungen trotz einspaltiger Anordnung erhalten
- Die Google-Rezensionen laufen als nahtlose, ziehbare Linie; Hover, Fokus und eine sichtbare
  Schaltfläche pausieren sie, Pfeiltasten bewegen sie und reduzierte Bewegung schaltet den Lauf ab
- Vollbild-Hero mit art-directed `<picture>`: Matcha-Ube auf schmalen Bildschirmen bis 820 Pixel,
  Kaffee auf größeren Bildschirmen mit drei Größen über `srcset`
- Kein Cookie, kein Tracking, kein eingebundener Dienst von Dritten
- Schriften liegen auf dem eigenen Server, es geht keine IP an Google Fonts
- Google Maps ist nur verlinkt, nicht eingebettet, also kein Consent-Banner nötig
- Strukturierte Daten (Schema.org CafeOrCoffeeShop) für die Google-Suche
- Bedienbar per Tastatur, sichtbarer Fokus, Sprungmarke zum Inhalt
- Kontraste geprüft, alle Textfarben über WCAG AA
- Bewegungen respektieren `prefers-reduced-motion`
- Bilder unterhalb des ersten Bildschirms laden verzögert

---

## Was noch fehlt

### 1. Impressum und Datenschutz vervollständigen (Pflicht)

In beiden Dateien sind die offenen Stellen als hervorgehobene Kästen markiert. Gebraucht werden:

- vollständiger Vor- und Nachname der Inhaberin oder des Inhabers
- Rechtsform, zum Beispiel Einzelunternehmen
- Umsatzsteuer-Identifikationsnummer oder Steuernummer
- verantwortliche Person nach § 18 Abs. 2 MStV
- Name und Anschrift des Hosting-Anbieters, Speicherdauer der Logfiles

Ohne diese Angaben darf die Seite in Deutschland nicht online gehen.

### 2. Fehlende Preise

Vollständig vorhanden sind Ube, Frucht-Mix, Dirty Soda und Crêpes. Es fehlen die Preise für
Kaffee, Tee, Matcha, Croffles, Kuchen und türkische Süßigkeiten. In der Karte steht dort aktuell
ein Hinweis auf die Tafel im Laden. Sobald die Preise da sind, in `speisekarte.html` ergänzen:

```html
<div class="item-top"><h3>Cappuccino</h3><span class="price">3,20 €</span></div>
```

### 3. Eigene Fotos

Die vorhandenen Bilder sind Handyfotos aus Social Media. Für die Seite fehlen noch:
Ladenfront in den Schlosshöfen, Innenraum mit Sitzplätzen, Theke und Vitrine, das Team.

### 4. Domain

Nach der Registrierung in `index.html` ergänzen: `<link rel="canonical">`, `og:url`
und im Schema.org-Block das Feld `url`.
