// 식물을 맨 앞으로 가져오는 함수(선택한 식물의 z-index를 3, 나머지를 2로 변경).
function plantToFront(e) {
    const allPlants = document.querySelectorAll('.plant');
    
    allPlants.forEach(plant => {
        plant.style.zIndex = '2';
    });

    e.style.zIndex = '3';
}

const plants = document.querySelectorAll('.plant');


// Drag and Drop API 사용
plants.forEach(plant => {
    plant.setAttribute('draggable', true);

    plant.addEventListener('dblclick', function(event) {
        plantToFront(this);
    });  

    // 드래그 시작
    plant.addEventListener('dragstart', function(event) {
        plantToFront(event.target);
        
        // 드래그할 데이터 설정
        event.dataTransfer.setData('text/plain', event.target.id);

        // 식물 이미지 내에서 마우스 클릭 위치 저장
        const rect = event.target.getBoundingClientRect();
        const offsetX = event.clientX - rect.left;
        const offsetY = event.clientY - rect.top;
        
        event.dataTransfer.setData('text/offset-x', offsetX);
        event.dataTransfer.setData('text/offset-y', offsetY);

        // 드래그하는 동안 식물의 위치를 absolute로 변경
        event.target.style.position = 'absolute';
    });
});

// 드롭 영역 설정
document.body.addEventListener('dragover', function(event) {
    event.preventDefault();
});

// 5. 드롭 이벤트
document.body.addEventListener('drop', function(event) {
    // 브라우저의 기본 동작 방지
    event.preventDefault();

    // dragstart에서 저장한 데이터 가져오기
    const plantId = event.dataTransfer.getData('text/plain');
    const offsetX = event.dataTransfer.getData('text/offset-x');
    const offsetY = event.dataTransfer.getData('text/offset-y');
    
    const plant = document.getElementById(plantId);

    if (plant) {
        document.body.appendChild(plant);

        plant.style.left = (event.clientX - offsetX) + 'px';
        plant.style.top = (event.clientY - offsetY) + 'px';
    }
});