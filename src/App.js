import React, { useState, useEffect, useCallback } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

const initialImagesData = [
  { id: 1, src: "466442101012201.jpg", alt: "Boy", category: "Who" },  // What
  { id: 2, src: "girl.jpg", alt: "Girl", category: "Who" },         // Who
  { id: 3, src: "sun.jpg", alt: "Sun", category: "What" },         // When
  { id: 4, src: "bread.jpeg", alt: "Bread", category: "What" },       // What
  { id: 5, src: "kano.jpeg", alt: "Kano State", category: "Where" },      // Where
  { id: 6, src: "/book.jpg", alt: "Book", category: "What" },        // What
  { id: 7, src: "car.jpg", alt: "Car", category: "What" },         // What
  { id: 8, src: "Why-me-lg.png", alt: "Why Me", category: "Why" },       // When
  { id: 9, src: "teacher.jpg", alt: "Teacher", category: "Who" },      // Who
  { id: 10, src: "laptop.jpg", alt: "Laptop", category: "What" },      // What
  { id: 11, src: "garden.jpg", alt: "Garden", category: "Where" },     // Where
  { id: 12, src: "monday.jpeg", alt: "Monday", category: "When" },      // When
  { id: 13, src: "doctor.jpg", alt: "Doctor", category: "Who" },       // Who
  { id: 14, src: "whywhy.jpeg", alt: "Pizza", category: "Why" },       // What
  { id: 15, src: "library.jpeg", alt: "Library", category: "Where" },     // Where
  { id: 16, src: "luly.jpg", alt: "July", category: "When" },      // When
  { id: 17, src: "Bob Ross.jpeg", alt: "Artist", category: "Who" },       // Who
  { id: 18, src: "guitar.jpg", alt: "Guitar", category: "What" },       // What
  { id: 19, src: "Lagos Beach.jpg", alt: "Beach", category: "Where" },       // Where
  { id: 20, src: "summer.jpg", alt: "Summer", category: "When" },      // When
];


const shuffleArray = (array) => [...array].sort(() => Math.random() - 0.5);

const selectRandomItems = (array, num) => shuffleArray(array).slice(0, num);

const categories = ["Who", "What", "Where", "When", "Why"];

const Tray = React.memo(({ category, correctItems, onDrop }) => {
  const [{ isOver }, drop] = useDrop({
    accept: "image",
    drop: (item) => onDrop(item, category),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  });

  return (
    <div ref={drop} className={`tray ${isOver ? "tray-over" : ""}`}>
      <h4>{category}</h4>
      <div className="tray-items">
        {correctItems && correctItems.map((item) => (
          <img key={item.id} src={item.src} alt={item.alt} className="tray-item" />
        ))}
      </div>
    </div>
  );
});

const ImageItem = React.memo(({ item, isDisabled }) => {
  const [{ isDragging }, drag] = useDrag({
    type: "image",
    item: { id: item.id, category: item.category },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
    canDrag: !isDisabled,
  });

  return (
    <img
      ref={drag}
      src={item.src}
      alt={item.alt}
      className={`image-item ${isDragging ? "dragging" : ""} ${isDisabled ? "disabled" : ""}`}
    />
  );
});

const Game = ({ onGameEnd, difficulty }) => {
  const [correctItems, setCorrectItems] = useState(() => 
    categories.reduce((acc, category) => ({ ...acc, [category]: [] }), {})
  );
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [points, setPoints] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [timer, setTimer] = useState(30);
  const [round, setRound] = useState(1);
  const [gameImages, setGameImages] = useState([]);
  const [isRoundComplete, setIsRoundComplete] = useState(false);

  const initializeRound = useCallback(() => {
    const numImages = difficulty === "easy" ? 3 : difficulty === "medium" ? 4 : 5;
    const newImages = selectRandomItems(initialImagesData, numImages);
    setGameImages(newImages);
    setCorrectItems(categories.reduce((acc, category) => ({ ...acc, [category]: [] }), {}));
    setProgress(0);
    setMessage({ text: "", type: "" });
    setTimer(30);
    setIsRoundComplete(false);
    setHintsUsed(0);
  }, [difficulty]);

  useEffect(() => {
    initializeRound();
  }, [initializeRound, round]);

  useEffect(() => {
    let interval;
    if (!isRoundComplete && timer > 0) {
      interval = setInterval(() => setTimer((prevTimer) => prevTimer - 1), 1000);
    } else if (timer === 0) {
      setIsRoundComplete(true);
      setMessage({ text: "Time's up! Round complete.", type: "warning" });
    }
    return () => clearInterval(interval);
  }, [timer, isRoundComplete]);

const handleDrop = useCallback((item, category) => {
    if (isRoundComplete) return;

    if (item.category === category) {
        setCorrectItems((prev) => ({
            ...prev,
            [category]: [...(prev[category] || []), item],
        }));
        setProgress((prevProgress) => {
            const newProgress = prevProgress + (100 / gameImages.length);
            if (newProgress >= 100) {
                setIsRoundComplete(true);
                setMessage({ text: "Round complete!", type: "success" });
            }
            return newProgress;
        });
        setPoints((prevPoints) => prevPoints + 10 - hintsUsed);
        setMessage({ text: "Correct!", type: "success" });
    } else {
        setMessage({ text: "Incorrect, try again.", type: "error" });
        setPoints((prevPoints) => Math.max(prevPoints - 3, 0)); // Subtract 3 points for incorrect guess
    }
}, [gameImages.length, hintsUsed, isRoundComplete]);


  const nextRound = useCallback(() => {
    setRound((prevRound) => prevRound + 1);
  }, []);

  const useHint = useCallback(() => {
    if (isRoundComplete) return;
    setHintsUsed((prev) => prev + 1);
    const unplacedItem = gameImages.find((item) => 
      !(correctItems[item.category] || []).some(placedItem => placedItem.id === item.id)
    );
    if (unplacedItem) {
      setMessage({ text: `Hint: Try placing ${unplacedItem.alt} in the ${unplacedItem.category} tray.`, type: "info" });
    }
  }, [gameImages, correctItems, isRoundComplete]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="game-container">
        <h1>Wh- Questions Game</h1>
        <div className="game-info">
          <div className="progress-bar">
            <div className="progress" style={{ width: `${progress}%` }}></div>
          </div>
          <div className="timer">Time left: {timer}s</div>
          <div className="points">Points: {points}</div>
          <div className="round">Round: {round}</div>
        </div>
        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}
        <div className="images-tray">
          {gameImages.map((item) => (
            <ImageItem 
              key={item.id} 
              item={item} 
              isDisabled={isRoundComplete || (correctItems[item.category] || []).some(placedItem => placedItem.id === item.id)}
            />
          ))}
        </div>
        <div className="trays">
          {categories.map((category) => (
            <Tray
              key={category}
              category={category}
              correctItems={correctItems[category] || []}
              onDrop={handleDrop}
            />
          ))}
        </div>
        <div className="game-controls">
          <button onClick={useHint} disabled={isRoundComplete}>Hint</button>
          {isRoundComplete && <button onClick={nextRound}>Next Round</button>}
          <button onClick={onGameEnd}>End Game</button>
        </div>
      </div>
    </DndProvider>
  );
};

const StartPage = ({ onStart }) => {
  const [difficulty, setDifficulty] = useState("easy");

  const handleStart = () => {
    onStart(difficulty);
  };

  return (
    <div className="start-page">
      <h1>Welcome to the Wh- Questions Game!</h1>
      <div className="difficulty-select">
        <label>
          Select Difficulty:
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </label>
      </div>
      <button onClick={handleStart}>Start Game</button>
    </div>
  );
};

const MainApp = () => {
  const [gameStarted, setGameStarted] = useState(false);
  const [difficulty, setDifficulty] = useState("easy");

  const startGame = useCallback((selectedDifficulty) => {
    setDifficulty(selectedDifficulty);
    setGameStarted(true);
  }, []);

  const endGame = useCallback(() => setGameStarted(false), []);

  return (
    <div className="app-container">
      {gameStarted ? <Game onGameEnd={endGame} difficulty={difficulty} /> : <StartPage onStart={startGame} />}
    </div>
  );
};

export default MainApp;