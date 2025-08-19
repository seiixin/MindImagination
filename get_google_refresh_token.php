<?php
require __DIR__ . '/vendor/autoload.php';

$client = new Google_Client();
$client->setClientId('39028582227-jkd98scp1qmvg6kgil0qbrf41u4u0uic.apps.googleusercontent.com');
$client->setClientSecret('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');
$client->setRedirectUri('urn:ietf:wg:oauth:2.0:oob');
$client->setAccessType('offline');
$client->addScope(Google_Service_Drive::DRIVE_FILE);

// 1) Generate auth URL
$authUrl = $client->createAuthUrl();
echo "Open this URL in your browser and authorize the app:\n$authUrl\n\n";

// 2) Enter the code from Google
echo "Enter the authorization code: ";
$authCode = trim(fgets(STDIN));

// 3) Exchange code for refresh token
$token = $client->fetchAccessTokenWithAuthCode($authCode);
echo "REFRESH TOKEN = " . $token['refresh_token'] . PHP_EOL;
