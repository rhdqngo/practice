function dragElement(terrariumElement) {
    let pos1 = 0,
        pos2 = 0,
        pos3 = 0,
        pos4 = 0;
    terrariumElement.onpointerdown = pointerDrag;

    // 더블 클릭 시 맨 앞으로.
    terrariumElement.addEventListener('dblclick', function(event) {
            plantToFront(this);
    });  

    // 식물을 맨 앞으로 가져오는 함수(선택한 식물의 z-index를 3, 나머지를 2로 변경).
    function plantToFront(e) {
        const allPlants = document.querySelectorAll('.plant');
        
        allPlants.forEach(plant => {
            plant.style.zIndex = '2';
        });

        e.style.zIndex = '3';
    }

    function pointerDrag(e) {
        e.preventDefault();
        console.log(e);
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onpointermove = elementDrag;
        document.onpointerup = stopElementDrag;

        // 드래그 시 맨 앞으로.
        plantToFront(terrariumElement);
    }

    function elementDrag(e) {
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        console.log(pos1, pos2, pos3, pos4);
        terrariumElement.style.top = terrariumElement.offsetTop - pos2 + 'px';
        terrariumElement.style.left = terrariumElement.offsetLeft - pos1 + 'px';
    }

    function stopElementDrag() {
        document.onpointerup = null;
        document.onpointermove = null;
    }
}

const plants = document.querySelectorAll('.plant');
plants.forEach(dragElement);