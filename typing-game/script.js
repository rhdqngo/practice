const quotes = [
    '나는 내가 아는 것만을 믿는다. 그것이 명백한 사실일지라도.',
    '오랜 추론의 결과와 상반되는 사실이 나타날 때면, 그 사실은 언제나 다른 해석이 가능하다는 것을 나는 이제 알게 되었다.',
    '나는 예외를 만들지 않는다. 예외는 규칙을 무너뜨린다.',
    '진실은 언제나 단순하다. 복잡한 것은 모두 거짓이다.',
    '관찰하지 않는 한, 아무것도 알 수 없다.',
    '사람들은 자신이 보고 싶은 것만 본다. 그들은 진실을 보지 못한다.',
    '논리는 감정을 이길 수 없다. 사람들은 마음이 원하는 대로 행동한다.',
    '가장 단순한 설명이 가장 그럴듯한 설명이다.',
    '나는 증거에 따라 움직인다. 감정이나 편견에 따라 움직이지 않는다.',
    '진실은 언제나 우리 곁에 있다. 우리는 그것을 찾기만 하면 된다.'
];

let words = [];
let wordIndex = 0;
let startTime = Date.now();

const quoteElement = document.getElementById('quote');
const messageElement = document.getElementById('message');
const typedValueElement = document.getElementById('typed-value');

const modalOverlay = document.getElementById('modal-overlay');
const modalMessage = document.getElementById('modal-message');
const modalHighScoreMessage = document.getElementById('modal-highscore-message');
const modalCloseBtn = document.getElementById('modal-close-btn');
const highScoreValueElement = document.getElementById('high-score-value');

const HIGH_SCORE_KEY = 'typingGameHighScore';

// 최고 점수 표시
function displayHighScore() {
    const highScore = localStorage.getItem(HIGH_SCORE_KEY);
    if (highScore) {
        highScoreValueElement.innerText = (parseFloat(highScore) / 1000).toFixed(2);
    } else {
        highScoreValueElement.innerText = 'N/A';
    }
}

// 페이지 로드 시 최고 점수 표시
document.addEventListener('DOMContentLoaded', displayHighScore);

// 모달 닫기 버튼 이벤트
modalCloseBtn.addEventListener('click', () => {
    modalOverlay.style.display = 'none';
});

document.getElementById('start').addEventListener('click',() => {
    const quoteIndex = Math.floor(Math.random() * quotes.length); // 무작위 인덱스 생성
    const quote = quotes[quoteIndex]; // 무작위 인덱스 값으로 인용문 선택
    words = quote.split(' '); // 공백 문자를 기준으로 words 배열에 저장
    wordIndex = 0; // 초기화
    const spanWords = words.map(function(word) { return `<span>${word} </span>`}); // span 태그로 감싼 후 배열에 저장
    quoteElement.innerHTML = spanWords.join(''); // 하나의 문자열로 결합 및 설정
    quoteElement.childNodes[0].className = 'highlight'; // 첫번째 단어 강조
    messageElement.innerText = ''; // 메시지 요소 초기화
    typedValueElement.value = ''; //입력 필드 초기화

    // 입력 필드 활성화 추가 
    typedValueElement.disabled = false; 

    typedValueElement.focus(); // 포커스 설정
    startTime = new Date().getTime(); // 타이핑 시작 시간 기록
    
    // 모달 숨기기 추가
    modalOverlay.style.display = 'none'; 

    // 게임 시작시 버튼 비활성화
    document.getElementById('start').disabled = true;
});

typedValueElement .addEventListener('input', () => {
    const currentWord = words[wordIndex]; // 현재 타이핑할 단어를 currentWord 에 저장
    const typedValue = typedValueElement.value; // 입력한 값을 typedValue에 저장
    
    if (typedValue === currentWord && wordIndex === words.length - 1) { // 마지막 단어까지 정확히 입력했는 지 체크
        const elapsedTime = new Date().getTime() - startTime ; // 타이핑에 소요된 시간 계산
        const elapsedTimeSeconds = elapsedTime / 1000; // 초 단위로 변환
        
        // 점수 표시
        modalMessage.innerText = `You finished in ${elapsedTimeSeconds.toFixed(2)} seconds!`;

        const storedHighScore = parseFloat(localStorage.getItem(HIGH_SCORE_KEY)); // 저장된 최고 점수 (ms)
        
        // 최고 점수 갱신
        if (!storedHighScore || elapsedTime < storedHighScore) {
            localStorage.setItem(HIGH_SCORE_KEY, elapsedTime);
            modalHighScoreMessage.innerText = 'New High Score!';
            
            // 메인 페이지의 최고 점수 업데이트
            displayHighScore(); 
        } else {
            // 기존 최고 점수 표시
            modalHighScoreMessage.innerText = `Best: ${(storedHighScore / 1000).toFixed(2)}s`;
        }

         // 모달창 표시
        modalOverlay.style.display = 'flex';

        // 게임 종료시 텍스트 상자 비활성화(+ 버튼 활성화)
        typedValueElement.value = '';
        typedValueElement.disabled = true;
        document.getElementById('start').disabled = false;
    
    } else if (typedValue.endsWith(' ') && typedValue.trim() === currentWord ) { // 입력된 값이 공백으로 끝났는지와 공백을 제거한 값이 현재 단어와 일치하는 지 확인
        typedValueElement.value = ''; // 입력 필드 초기화하여 다음 단어 입력 준비
        wordIndex ++; // 다음 단어로 이동
 
        for (const wordElement of quoteElement .childNodes ) { // 모든 강조 표시 제거
            wordElement.className = ''; // 클래스 제거
        }
        quoteElement.childNodes [wordIndex].className = 'highlight'; // 다음으로 타이핑할 단어에 클래스 추가
    } else if (currentWord.startsWith( typedValue )) { //현재 단어의 일부를 맞게 입력하고 있는 지 확인
        typedValueElement.className = ''; // 올바르면 클래스 제거
    } else {
        typedValueElement.className = 'error'; // 틀리면 error 클래스 추가
    }
});