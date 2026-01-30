package com.example;

import io.github.bonigarcia.wdm.WebDriverManager;
import org.apache.commons.io.FileUtils;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.*;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.io.PrintWriter;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public class QuizAutomationTest {

    private static WebDriver driver;
    private static WebDriverWait wait;
    private static PrintWriter logWriter;
    private static final DateTimeFormatter LOG_TIME_FORMAT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    // Adjust this path if your quiz-app folder is in a different location
    private static final String QUIZ_URL = "file:///C:/Users/OS/Desktop/TestingAPpp/quiz-app/index.html";

    @BeforeAll
    public static void setUp() throws IOException {
        // set up log file
        File logDir = new File("logs");
        if (!logDir.exists()) {
            logDir.mkdirs();
        }
        File logFile = new File(logDir, "quiz-automation.log");
        logWriter = new PrintWriter(new FileWriter(logFile, true));
        log("=== New test run ===");

        WebDriverManager.chromedriver().setup();
        driver = new ChromeDriver();
        driver.manage().window().maximize();
        wait = new WebDriverWait(driver, Duration.ofSeconds(10));
        log("WebDriver initialized");
    }

    @AfterAll
    public static void tearDown() {
        if (driver != null) {
            log("Closing browser");
            driver.quit();
        }
        if (logWriter != null) {
            log("Closing log writer");
            logWriter.close();
        }
    }

    private void takeScreenshot(String name) throws IOException {
        File src = ((TakesScreenshot) driver).getScreenshotAs(OutputType.FILE);
        File destDir = new File("screenshots");
        if (!destDir.exists()) {
            destDir.mkdirs();
        }
        File dest = new File(destDir, name + ".png");
        FileUtils.copyFile(src, dest);
        log("Saved screenshot: " + dest.getAbsolutePath());
    }

    @Test
    public void automateQuizFlow() throws IOException, InterruptedException {
        // 1. Verify Landing Page
        driver.get(QUIZ_URL);
        log("Landing Page URL: " + driver.getCurrentUrl());
        log("Landing Page Title: " + driver.getTitle());
        waitFiveSeconds("capture landing page screenshot");
        takeScreenshot("01_landing_page");

        // 2. Start Quiz: select category/difficulty and click Start
        WebElement startButton = wait.until(
                ExpectedConditions.elementToBeClickable(By.id("start-quiz-btn"))
        );
        // You can change these selections if you want a different quiz
        WebElement categorySelect = driver.findElement(By.id("category-select"));
        categorySelect.sendKeys("Math");
        WebElement difficultySelect = driver.findElement(By.id("difficulty-select"));
        difficultySelect.sendKeys("Easy");

        waitFiveSeconds("start quiz");
        startButton.click();

        // Verify first question is displayed
        WebElement questionText = wait.until(
                ExpectedConditions.visibilityOfElementLocated(By.id("question-text"))
        );
        log("First Question: " + questionText.getText());

        // Disable per-question countdown timer to avoid auto-submit during 5-second waits
        disableQuizTimer();

        waitFiveSeconds("capture first question screenshot");
        takeScreenshot("02_first_question");

        // 3. Question Navigation & Answer Selection
        // For simplicity, always select the first available option.
        // You can customise logic to select specific answers per question.
        while (true) {
            // Wait for options to be present
            wait.until(ExpectedConditions.presenceOfElementLocated(By.cssSelector(".option-row label")));

            // Select first option by clicking the visible label (radio is visually hidden)
            WebElement firstOptionLabel = driver.findElement(By.cssSelector(".option-row label"));
            ((JavascriptExecutor) driver).executeScript("arguments[0].scrollIntoView(true);", firstOptionLabel);
            waitFiveSeconds("answer current question");
            firstOptionLabel.click();
            takeScreenshot("question_" + getQuestionCounterText());

            // Check if Next is enabled, else break and submit
            WebElement nextBtn = driver.findElement(By.id("next-btn"));
            if (nextBtn.isEnabled()) {
                nextBtn.click();
            } else {
                break;
            }
        }

        // 4. Submit Quiz
        WebElement submitBtn = driver.findElement(By.id("submit-btn"));
        // Ensure last question has a selected answer
        WebElement lastQuestionFirstInput = driver.findElement(By.cssSelector(".option-input"));
        if (!lastQuestionFirstInput.isSelected()) {
            WebElement lastQuestionFirstLabel = driver.findElement(By.cssSelector(".option-row label"));
            lastQuestionFirstLabel.click();
        }
        waitFiveSeconds("submit quiz");
        submitBtn.click();
        takeScreenshot("03_after_submit");

        // 5. Score Calculation and Result Analysis Page
        WebElement resultSummary = wait.until(
                ExpectedConditions.visibilityOfElementLocated(By.id("result-summary"))
        );
        log("Result Summary Text: \n" + resultSummary.getText());
        waitFiveSeconds("capture result analysis screenshot");
        takeScreenshot("04_result_analysis");

        // Basic checks: correct/incorrect labels and score present
        String summaryText = resultSummary.getText();
        assert summaryText.contains("Correct Answers") : "Correct Answers not shown";
        assert summaryText.contains("Incorrect Answers") : "Incorrect Answers not shown";
        assert summaryText.contains("Score:") : "Score not shown";

        // Timer and charts should also be visible
        WebElement accuracyChart = driver.findElement(By.id("accuracyChart"));
        WebElement timeChart = driver.findElement(By.id("timeChart"));
        assert accuracyChart.isDisplayed();
        assert timeChart.isDisplayed();

        log("Quiz automation test completed successfully.");
    }

    private String getQuestionCounterText() {
        try {
            WebElement counter = driver.findElement(By.id("question-counter"));
            return counter.getText().replace(" ", "_");
        } catch (NoSuchElementException e) {
            return "unknown_question";
        }
    }

    private void waitFiveSeconds(String action) throws InterruptedException {
        log("Waiting 5 seconds before: " + action);
        Thread.sleep(5000);
    }

    private void disableQuizTimer() {
        try {
            ((JavascriptExecutor) driver).executeScript(
                    "if (typeof timerInterval !== 'undefined' && timerInterval) { clearInterval(timerInterval); timerInterval = null; }"
            );
            log("Quiz per-question timer disabled for testing.");
        } catch (Exception e) {
            log("Failed to disable quiz timer: " + e.getMessage());
        }
    }

    private static void log(String message) {
        String line = String.format("[%s] %s",
                LocalDateTime.now().format(LOG_TIME_FORMAT), message);
        System.out.println(line);
        if (logWriter != null) {
            logWriter.println(line);
            logWriter.flush();
        }
    }
}
