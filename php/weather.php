<?php
// GET /api/weather?lat=&lon=&lang=  → aktuálne počasie + 2 dni dopredu + reverse geocoding.
// Náhrada za src/app/api/weather/route.ts.

declare(strict_types=1);
require __DIR__ . '/lib.php';

header('Content-Type: application/json; charset=utf-8');

$latRaw = $_GET['lat'] ?? '';
$lonRaw = $_GET['lon'] ?? '';
$lang = preg_replace('/[^a-z]/', '', substr((string) ($_GET['lang'] ?? 'sk'), 0, 5)) ?: 'sk';

if (!is_numeric($latRaw) || !is_numeric($lonRaw)) {
    http_response_code(400);
    echo json_encode(['error' => 'Chýbajú súradnice'], JSON_UNESCAPED_UNICODE);
    exit;
}
$lat = (float) $latRaw;
$lon = (float) $lonRaw;

$url = 'https://api.open-meteo.com/v1/forecast?latitude=' . rawurlencode((string) $lat)
    . '&longitude=' . rawurlencode((string) $lon)
    . '&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,is_day,weather_code'
    . '&hourly=temperature_2m,weather_code'
    . '&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto';

$data = http_get_json($url);
if ($data === null || !isset($data['current'], $data['hourly'], $data['daily'])) {
    http_response_code(500);
    echo json_encode(['error' => 'Nepodarilo sa získať dáta o počasí'], JSON_UNESCAPED_UNICODE);
    exit;
}

$timelineIndices = [8, 12, 20];
$timelineLabels = ['Ráno', 'Obed', 'Večer'];
$timeline = [];
foreach ($timelineIndices as $i => $hour) {
    $timeline[] = [
        'time' => $data['hourly']['time'][$hour] ?? null,
        'temperature' => $data['hourly']['temperature_2m'][$hour] ?? null,
        'weatherCode' => $data['hourly']['weather_code'][$hour] ?? null,
        'label' => $timelineLabels[$i],
    ];
}

$cur = $data['current'];
$daily = $data['daily'];

$tomorrowCode = (int) ($daily['weather_code'][1] ?? 0);
$afterCode = (int) ($daily['weather_code'][2] ?? 0);

// Reverse geocoding (Nominatim) — best effort, ako v node verzii.
$locationName = 'Neznáma lokalita';
$geo = http_get_json(
    "https://nominatim.openstreetmap.org/reverse?format=json&lat={$lat}&lon={$lon}&zoom=12&accept-language={$lang}",
    ['User-Agent: WeatherAI-MVP/1.0']
);
if ($geo !== null) {
    $addr = $geo['address'] ?? [];
    $locationName = $addr['city'] ?? $addr['town'] ?? $addr['village'] ?? $addr['hamlet']
        ?? $addr['suburb'] ?? $addr['municipality'] ?? $addr['county'] ?? null;
    if (!$locationName && !empty($geo['display_name'])) {
        $locationName = explode(',', $geo['display_name'])[0];
    }
    if (!$locationName) {
        $locationName = 'Neznáma lokalita';
    }
}

echo json_encode([
    'temperature' => $cur['temperature_2m'],
    'apparentTemperature' => $cur['apparent_temperature'],
    'humidity' => $cur['relative_humidity_2m'],
    'windSpeed' => $cur['wind_speed_10m'],
    'weatherCode' => $cur['weather_code'],
    'isDay' => ((int) $cur['is_day']) === 1,
    'time' => $cur['time'],
    'description' => weather_description((int) $cur['weather_code'], $lang),
    'locationName' => $locationName,
    'timeline' => $timeline,
    'tomorrow' => [
        'maxTemp' => $daily['temperature_2m_max'][1] ?? null,
        'minTemp' => $daily['temperature_2m_min'][1] ?? null,
        'weatherCode' => $tomorrowCode,
        'description' => weather_description($tomorrowCode, $lang),
    ],
    'afterTomorrow' => [
        'maxTemp' => $daily['temperature_2m_max'][2] ?? null,
        'minTemp' => $daily['temperature_2m_min'][2] ?? null,
        'weatherCode' => $afterCode,
        'description' => weather_description($afterCode, $lang),
    ],
], JSON_UNESCAPED_UNICODE);
