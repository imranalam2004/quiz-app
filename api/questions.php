

&lt;?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

// Question bank
$questions = [
    [
        'id' => 1,
        'category' => 'math',
        'difficulty' => 'easy',
        'text' => 'What is 1 + 2?',
        'options' => ['1', '2', '3', '4'],
        'correctIndex' => 2,
    ],
    [
        'id' => 2,
        'category' => 'math',
        'difficulty' => 'medium',
        'text' => 'What is 12 / 3?',
        'options' => ['2', '3', '4', '5'],
        'correctIndex' => 2,
    ],
    [
        'id' => 3,
        'category' => 'math',
        'difficulty' => 'hard',
        'text' => 'What is 15 * 3?',
        'options' => ['30', '35', '40', '45'],
        'correctIndex' => 3,
    ],
    [
        'id' => 4,
        'category' => 'science',
        'difficulty' => 'easy',
        'text' => 'Water freezes at what temperature (°C)?',
        'options' => ['0', '25', '50', '100'],
        'correctIndex' => 0,
    ],
    [
        'id' => 5,
        'category' => 'science',
        'difficulty' => 'medium',
        'text' => 'Which gas do plants absorb from the atmosphere?',
        'options' => ['Oxygen', 'Nitrogen', 'Carbon Dioxide', 'Helium'],
        'correctIndex' => 2,
    ],
    [
        'id' => 6,
        'category' => 'science',
        'difficulty' => 'hard',
        'text' => 'What is the chemical symbol for Gold?',
        'options' => ['Ag', 'Au', 'Gd', 'Go'],
        'correctIndex' => 1,
    ],
    [
        'id' => 7,
        'category' => 'general',
        'difficulty' => 'easy',
        'text' => 'How many days are there in a leap year?',
        'options' => ['365', '366', '364', '360'],
        'correctIndex' => 1,
    ],
    [
        'id' => 8,
        'category' => 'general',
        'difficulty' => 'medium',
        'text' => 'Which is the largest continent?',
        'options' => ['Africa', 'Asia', 'Europe', 'North America'],
        'correctIndex' => 1,
    ],
    [
        'id' => 9,
        'category' => 'general',
        'difficulty' => 'hard',
        'text' => 'Which year did World War II end?',
        'options' => ['1940', '1942', '1945', '1950'],
        'correctIndex' => 2,
    ],
];

// Get filter parameters
$category = isset($_GET['category']) ? $_GET['category'] : null;
$difficulty = isset($_GET['difficulty']) ? $_GET['difficulty'] : null;

// Filter questions
$filteredQuestions = $questions;

if ($category && $difficulty) {
    $filteredQuestions = array_filter($questions, function($q) use ($category, $difficulty) {
        return $q['category'] === $category && $q['difficulty'] === $difficulty;
    });
    
    // Fallback: if no questions match both, try category only
    if (empty($filteredQuestions)) {
        $filteredQuestions = array_filter($questions, function($q) use ($category) {
            return $q['category'] === $category;
        });
    }
    
    // If still empty, return all questions
    if (empty($filteredQuestions)) {
        $filteredQuestions = $questions;
    }
}

// Re-index array to ensure proper JSON encoding
$filteredQuestions = array_values($filteredQuestions);

echo json_encode([
    'success' => true,
    'count' => count($filteredQuestions),
    'questions' => $filteredQuestions
]);
?&gt;
