<?php
// Spoločné utility pre weather PHP endpointy (náhrada za Next.js API routes).

declare(strict_types=1);

/** Jednoduchý GET → dekódovaný JSON cez cURL. Vráti null pri chybe. */
function http_get_json(string $url, array $headers = []): ?array
{
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 8,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_FOLLOWLOCATION => true,
    ]);
    $body = curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($body === false || $code < 200 || $code >= 300) {
        return null;
    }
    $data = json_decode($body, true);
    return is_array($data) ? $data : null;
}

/** POST JSON telo → dekódovaná JSON odpoveď. $err naplní chybovú hlášku. */
function http_post_json(string $url, array $payload, ?string &$err = null): ?array
{
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 25,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE),
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
    ]);
    $body = curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($body === false) {
        $err = 'Network error';
        return null;
    }
    $data = json_decode($body, true);
    if ($code < 200 || $code >= 300) {
        $err = is_array($data) ? ($data['error']['message'] ?? "HTTP $code") : "HTTP $code";
        return null;
    }
    return is_array($data) ? $data : null;
}

/** GEMINI_API_KEY z env premennej alebo z /etc/weather/env (rovnaký zdroj ako node verzia). */
function gemini_key(): ?string
{
    $k = getenv('GEMINI_API_KEY');
    if ($k) {
        return $k;
    }
    foreach (@file('/etc/weather/env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [] as $line) {
        if (str_starts_with($line, 'GEMINI_API_KEY=')) {
            return substr($line, strlen('GEMINI_API_KEY='));
        }
    }
    return null;
}

/** Lokalizovaný popis weather kódu (port z lib/weather.ts). */
function weather_description(int $code, string $lang = 'sk'): string
{
    static $t = [
        'sk' => [0 => 'Jasno', 1 => 'Prevažne jasno', 2 => 'Polooblačno', 3 => 'Zamračené', 45 => 'Hmla', 61 => 'Slabý dážď', 95 => 'Búrka'],
        'cs' => [0 => 'Jasno', 1 => 'Převážně jasno', 2 => 'Polojasno', 3 => 'Zataženo', 45 => 'Mlha', 61 => 'Slabý déšť', 95 => 'Bouřka'],
        'en' => [0 => 'Clear sky', 1 => 'Mainly clear', 2 => 'Partly cloudy', 3 => 'Overcast', 45 => 'Fog', 61 => 'Slight rain', 95 => 'Thunderstorm'],
        'de' => [0 => 'Klarer Himmel', 1 => 'Überwiegend klar', 2 => 'Teilweise bewölkt', 3 => 'Bedeckt', 45 => 'Nebel', 61 => 'Leichter Regen', 95 => 'Gewitter'],
        'es' => [0 => 'Cielo despejado', 1 => 'Mayormente despejado', 2 => 'Parcialmente nublado', 3 => 'Nublado', 45 => 'Niebla', 61 => 'Lluvia ligera', 95 => 'Tormenta'],
        'fr' => [0 => 'Ciel dégagé', 1 => 'Principalement dégagé', 2 => 'Partiellement nuageux', 3 => 'Couvert', 45 => 'Brouillard', 61 => 'Pluie légère', 95 => 'Orage'],
    ];
    $l = $t[$lang] ?? $t['en'];
    return $l[$code] ?? ($t['en'][$code] ?? 'Unknown');
}
