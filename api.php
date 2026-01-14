<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Get server ID from query parameter
$serverID = isset($_GET['id']) ? $_GET['id'] : '';

if (empty($serverID)) {
    http_response_code(400);
    echo json_encode(['error' => 'Server ID is required']);
    exit;
}

// Validate server ID (alphanumeric only)
if (!preg_match('/^[a-zA-Z0-9]+$/', $serverID)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid server ID format']);
    exit;
}

// Fetch data from FiveM API
$apiUrl = "https://servers-frontend.fivem.net/api/servers/single/" . $serverID;

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $apiUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
curl_setopt($ch, CURLOPT_USERAGENT, 'FiveM-IP-Finder/1.0');

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

if ($error) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to fetch server data: ' . $error]);
    exit;
}

if ($httpCode !== 200) {
    http_response_code($httpCode);
    echo json_encode(['error' => 'Server not found or API error']);
    exit;
}

// Return the response
echo $response;
?>
