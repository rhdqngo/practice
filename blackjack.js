let cardDeck = [4, 7, 10, 9, "A", 8, 5, 6, 2, 10, 10, 3];
let draw = 0;
let sum = 0;
let bankSum = 0;
let youTurn = true;

// 턴 바꾸기.
function turnChange(){
    youTurn = !youTurn;
}

// 카드 뽑기.
function getCard(drawCard){
    if (drawCard == "A"){
        if (youTurn){
            if (sum + 10 > 21){
                draw++;
                return 1;
            } else {
                draw++;
                return 10;
            }
        } else {
            if (bankSum + 10 > 21){
                draw++;
                return 1;
            } else {
                draw++;
                return 10;
            }
        } 
    } else {
        draw++;
        return drawCard;
    }
}

// 카드 두 장 뽑기.
let cardOne = getCard(cardDeck[draw]);
let cardTwo = getCard(cardDeck[draw]);
sum = cardOne + cardTwo;
turnChange();

// 딜러도 카드 두 장 뽑기.
let cardOneBank = getCard(cardDeck[draw]);
let cardTwoBank = getCard(cardDeck[draw]);
bankSum = cardOneBank + cardTwoBank;
turnChange();

// 세 번째 카드 뽑기.
let cardThree = getCard(cardDeck[draw]);
sum += cardThree;

// 조건 설정(21 이상: 패배, 21: 블랙잭 승리).
if (sum > 21) {
    console.log('You lost');
    process.exit();
} else if (sum === 21) {
    console.log('Blackjack! You win!');
    process.exit();
}
console.log(`You have ${sum} points`);
turnChange();

// 딜러 세 번째 카드 뽑기(카드의 합이 17 이하일 때).
if (bankSum < 17) {
    let cardThreeBank = getCard(cardDeck[draw]);
    bankSum += cardThreeBank;
}
console.log(`Bank have ${bankSum} points`);

// 승패 결정.
if (bankSum > 21 || (sum <= 21 && sum > bankSum)) {
    console.log('You win');
    process.exit();
} else if (sum === bankSum) {
    console.log('Draw');
    process.exit();
} else {
    console.log('Bank wins');
}