<?php
header('Content-Type: application/json; charset=utf-8');

try {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true) ?: [];
    $transcript = isset($data['transcript']) ? trim((string)$data['transcript']) : '';
    $lang = isset($data['language']) ? strtolower(trim((string)$data['language'])) : 'en';

    $apiKey = getenv('GEMINI_API_KEY');
    if (!$apiKey) {
        $localKeyPath = __DIR__ . DIRECTORY_SEPARATOR . 'gemini_key.php';
        if (is_file($localKeyPath)) {
            include $localKeyPath;
            if (defined('GEMINI_API_KEY')) {
                $apiKey = constant('GEMINI_API_KEY');
            } elseif (isset($GEMINI_API_KEY)) {
                $apiKey = (string)$GEMINI_API_KEY;
            }
        }
    }
    if (!$apiKey) {
        http_response_code(500);
        echo json_encode(['error' => 'Missing GEMINI_API_KEY on server']);
        exit;
    }

    $languageName = ($lang === 'bn') ? 'Bengali (bn-IN)' : 'English (en-US)';
    $instruction = "You are Jarvis, a concise voice assistant.\n" .
                   "Return only one short sentence for text-to-speech without quotes.\n" .
                   "Keep under 12 words.\n" .
                   "Language: {$languageName}.\n" .
                   "Context: The user opened the dashboard and said: {$transcript}.\n" .
                   "Goal: Politely ask which invoice type they want: Cash or EMI.";

    $payload = [
        'contents' => [
            [
                'parts' => [ ['text' => $instruction] ]
            ]
        ],
        'generationConfig' => [
            'temperature' => 0.5,
            'maxOutputTokens' => 50
        ]
    ];

    $url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=' . urlencode($apiKey);

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_TIMEOUT, 8);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 4);

    $resp = curl_exec($ch);
    if ($resp === false) {
        http_response_code(502);
        echo json_encode(['error' => 'Upstream request failed']);
        exit;
    }
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $respJson = json_decode($resp, true);
    if ($status < 200 || $status >= 300 || !$respJson) {
        http_response_code(502);
        echo json_encode(['error' => 'Invalid upstream response']);
        exit;
    }

    $text = '';
    if (isset($respJson['candidates'][0]['content']['parts'][0]['text'])) {
        $text = (string)$respJson['candidates'][0]['content']['parts'][0]['text'];
    } elseif (isset($respJson['candidates'][0]['content']['parts']) && is_array($respJson['candidates'][0]['content']['parts'])) {
        foreach ($respJson['candidates'][0]['content']['parts'] as $p) {
            if (isset($p['text'])) { $text .= (string)$p['text']; }
        }
    }

    $text = trim($text);
    $text = trim($text, " \t\n\r\0\x0B\"");

    if ($text === '') {
        $text = ($lang === 'bn') ? 'কোন ইনভয়েস ক্যাশ নাকি ই এম আই' : 'Which invoice cash or emi';
    }

    echo json_encode(['speech' => $text]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error']);
}
