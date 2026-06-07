<?php
// POST /api/commentary  body: {weatherData, lang}  → {commentaries: {persona: {text, outfit}}}
// Náhrada za src/app/api/commentary/route.ts + lib/gemini.ts. Gemini 2.5 Flash cez REST.

declare(strict_types=1);
require __DIR__ . '/lib.php';

header('Content-Type: application/json; charset=utf-8');

// Persona inštrukcie (port z lib/gemini.ts).
$personas = [
    'cynic' => 'Si extrémne sarkastický cynik. Tvoj tón je drsný a vtipne urážlivý.',
    'theory' => 'Si paranoidný konšpiračný teoretik. Veríš na HAARP a chemtrails.',
    'coach' => 'Si agresívny fitness tréner. Žiadne výhovorky, len motivácia krikom.',
    'optimist' => 'Si neznesiteľne pozitívny človek. V každom počasí vidíš dar.',
];

$body = json_decode(file_get_contents('php://input') ?: '', true);
$w = $body['weatherData'] ?? null;
$lang = $body['lang'] ?? 'sk';

if (!is_array($w)) {
    http_response_code(400);
    echo json_encode(['error' => 'Chýbajú dáta o počasí'], JSON_UNESCAPED_UNICODE);
    exit;
}

$key = gemini_key();
if (!$key) {
    http_response_code(500);
    echo json_encode(['error' => 'Chýba GEMINI_API_KEY'], JSON_UNESCAPED_UNICODE);
    exit;
}

$timelineStr = '';
foreach ($w['timeline'] ?? [] as $t) {
    $timelineStr .= ($timelineStr ? ', ' : '') . ($t['label'] ?? '') . ': ' . ($t['temperature'] ?? '') . '°C';
}
$tom = $w['tomorrow'] ?? [];
$aft = $w['afterTomorrow'] ?? [];

$prompt = <<<PROMPT
    Vži sa do štyroch osobností a napíš vtipný komentár k počasiu a stručnú radu, čo si obliecť (outfit).
    Dôležité: Komentár by mal brať do úvahy nielen aktuálne počasie, ale aj trend na najbližšie dni (či sa ochladí, oteplí alebo začne pršať).

    JAZYK: "{$lang}"
    KONTEXT:
    Dnešný priebeh: {$timelineStr}.
    Aktuálne: {$w['description']}, {$w['temperature']}°C (pocitovo {$w['apparentTemperature']}°C), vlhkosť {$w['humidity']}%, vietor {$w['windSpeed']} km/h.
    Zajtra: {$tom['description']}, {$tom['minTemp']}°C až {$tom['maxTemp']}°C.
    Pozajtra: {$aft['description']}, {$aft['minTemp']}°C až {$aft['maxTemp']}°C.

    OSOBNOSTI:
    1. cynic: {$personas['cynic']}
    2. theory: {$personas['theory']}
    3. coach: {$personas['coach']}
    4. optimist: {$personas['optimist']}

    STRIKTNÉ PRAVIDLO:
    - Vráť LEN čistý JSON bez markdown značiek.
    - Formát: {
        "cynic": {"text": "...", "outfit": "..."},
        "theory": {"text": "...", "outfit": "..."},
        "coach": {"text": "...", "outfit": "..."},
        "optimist": {"text": "...", "outfit": "..."}
      }
    - "text" má byť vtipný komentár (3-5 viet).
    - "outfit" má byť stručná rada čo na seba (1 veta).
    PROMPT;

$endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' . rawurlencode($key);

$err = null;
// Pozn.: gemini-2.5-flash vracia 503 "high demand" pri responseMimeType=application/json
// (a obzvlášť v kombinácii s thinkingBudget=0). Posielame preto holý request ako pôvodná
// node verzia a JSON si vystrihneme z markdownu nižšie.
$resp = http_post_json($endpoint, [
    'contents' => [['parts' => [['text' => $prompt]]]],
], $err);

if ($resp === null) {
    http_response_code(500);
    echo json_encode(['error' => $err ?: 'AI error'], JSON_UNESCAPED_UNICODE);
    exit;
}

$text = $resp['candidates'][0]['content']['parts'][0]['text'] ?? '';
$text = trim(str_replace(['```json', '```'], '', $text));
$commentaries = json_decode($text, true);

if (!is_array($commentaries)) {
    http_response_code(500);
    echo json_encode(['error' => 'AI vrátilo neplatný formát dát.'], JSON_UNESCAPED_UNICODE);
    exit;
}

echo json_encode(['commentaries' => $commentaries], JSON_UNESCAPED_UNICODE);
