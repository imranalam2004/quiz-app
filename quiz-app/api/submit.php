&lt;?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

// Get POST data
$data = json_decode(file_get_contents('php://input'), true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid JSON data']);
    exit;
}

// Validate required fields
$requiredFields = ['category', 'difficulty', 'totalQuestions', 'correctAnswers', 'incorrectAnswers', 'totalTime', 'timePerQuestion'];
foreach ($requiredFields as $field) {
    if (!isset($data[$field])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => "Missing field: $field"]);
        exit;
    }
}

// Calculate statistics
$percentage = $data['totalQuestions'] > 0 
    ? round(($data['correctAnswers'] / $data['totalQuestions']) * 100, 2) 
    : 0;

$avgTime = $data['totalQuestions'] > 0 
    ? round($data['totalTime'] / $data['totalQuestions'], 2) 
    : 0;

// Prepare result data
$result = [
    'success' => true,
    'submission' => [
        'timestamp' => date('Y-m-d H:i:s'),
        'category' => $data['category'],
        'difficulty' => $data['difficulty'],
        'totalQuestions' => $data['totalQuestions'],
        'correctAnswers' => $data['correctAnswers'],
        'incorrectAnswers' => $data['incorrectAnswers'],
        'score' => $percentage,
        'totalTime' => $data['totalTime'],
        'averageTime' => $avgTime,
        'timePerQuestion' => $data['timePerQuestion'],
    ],
    'performance' => [
        'grade' => $percentage >= 80 ? 'Excellent' : ($percentage >= 60 ? 'Good' : ($percentage >= 40 ? 'Fair' : 'Needs Improvement')),
        'passed' => $percentage >= 50,
    ]
];

// Optional: Save to file (you can also save to database)
$logFile = __DIR__ . '/../logs/quiz_results.json';
$logDir = dirname($logFile);

if (!is_dir($logDir)) {
    mkdir($logDir, 0777, true);
}

// Read existing results
$existingResults = [];
if (file_exists($logFile)) {
    $existingResults = json_decode(file_get_contents($logFile), true) ?? [];
}

// Add new result
$existingResults[] = $result['submission'];

// Save back to file
file_put_contents($logFile, json_encode($existingResults, JSON_PRETTY_PRINT));

echo json_encode($result);
?&gt;
