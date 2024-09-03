'use strict';


const addCube = () => {
  const scene = document.querySelector('#scene');

  const cube = document.createElement('div');
  cube.classList.add('cube');

  for (let i = 0; i < 6; i++) {
    const side = document.createElement('div');
    side.classList.add('side');

    for (let j = 0; j < 9; j++) {
      const square = document.createElement('div');
      square.classList.add('square');
      side.appendChild(square);
    }

    cube.appendChild(side);
  }

  scene.appendChild(cube);
};

const addPlane = () => {
  const scene = document.querySelector('#scene');

  const plane = document.createElement('div');
  plane.classList.add('plane');

  for (let i = 0; i < 9*18; i++) {
    const rect = document.createElement('div');
    rect.classList.add('rect');

    rect.textContent = i;

    plane.appendChild(rect);
  }

  scene.appendChild(plane);
};



// rot handler
document.addEventListener('DOMContentLoaded', ()=>{
  const scene = document.querySelector('#scene');

  let isKeyDown = false;
  let isMouseDown = false;
  let startX = 0;
  let startY = 0;
  let clientX = 0;
  let clientY = 0;

  const style = window.getComputedStyle(scene)
  let matrix = new DOMMatrixReadOnly(style.transform)

  document.body.addEventListener('mousedown', (event) => {
    event.stopPropagation();
    event.preventDefault();

    clientX = event.clientX;
    clientY = event.clientY;

    isMouseDown = true;
    startX = clientX;
    startY = clientY;
  })

  document.body.addEventListener('mouseup', (event) => {
    event.stopPropagation();
    event.preventDefault();

    isMouseDown = false;

    const style = window.getComputedStyle(scene)
    matrix = new DOMMatrixReadOnly(style.transform)
  })

  document.addEventListener('keydown', (event) => {
    if (!isKeyDown && event.key === 'Meta' || event.key === 'Shift') {
      if (event.key === 'Meta') {
        isKeyDown = true;
      }

      startX = clientX;
      startY = clientY;
      const style = window.getComputedStyle(scene)
      matrix = new DOMMatrixReadOnly(style.transform)
    }
  })

  document.addEventListener('keyup', (event) => {
    if (isKeyDown && event.key === 'Meta' || event.key === 'Shift') {
      if (event.key === 'Meta') {
        isKeyDown = false;
      }

      startX = clientX;
      startY = clientY;
      const style = window.getComputedStyle(scene)
      matrix = new DOMMatrixReadOnly(style.transform)
    }
  })

  document.body.addEventListener('mousemove', (event) => {
    event.stopPropagation();
    event.preventDefault();

    clientX = event.clientX;
    clientY = event.clientY;

    if (!isMouseDown) {
      return
    }

    const dx = clientX - startX;
    const dy = clientY - startY;

    if (isKeyDown) {
      scene.style.transform = matrix
        .rotate(-dy, event.shiftKey ? dx : 0, event.shiftKey ? -0 : dx)
        .toString()
    } else {
      scene.style.transform = matrix
        .translate(dx, event.shiftKey ? 0 : dy, event.shiftKey ? dy : 0)
        .toString()
    }
  })

  document.body.addEventListener("wheel", (event) => {
    event.preventDefault();
    event.stopPropagation();

    const style = window.getComputedStyle(scene)
    matrix = new DOMMatrixReadOnly(style.transform)
      .translate(event.deltaX,0, event.deltaY)

    scene.style.transform = matrix
      .toString()

  }, { passive: false});
});

document.addEventListener('DOMContentLoaded', ()=>{
  addPlane();
  addCube();
});