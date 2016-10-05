const canvas = document.getElementById('tetris');              
const context = canvas.getContext("2d");

context.scale(20, 20);                                         //задаём масштаб 

function arenaSweep() {
    let rowCount = 1;
    outer: for (let y = arena.length - 1; y > 0; --y) {
        for (let x = 0; x < arena[y].length; ++x) {
            if (arena[y][x] === 0) {
                continue outer;
            }
        }

        const row = arena.splice(y, 1)[0].fill(0);
        arena.unshift(row);
        ++y;

        player.score += rowCount * 10;
        rowCount *= 2;
    }
}

function collide(arena, player) {                                //функция, описывающая поведение объектов при столкновании
    const [m, o] = [player.matrix, player.pos];
    for(let y = 0; y < m.length; ++y) {
        for(let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 &&
                (arena[y + o.y] &&
                arena[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

function createMatrix(w, h) {                                      //функция, обеспечивающая создание матрицы объекта
    const matrix = [];
    while (h--) {
        matrix.push(new Array(w).fill(0));
    }
    return matrix;
}

function createPiece(type) {
    if (type === "T") {
        return [
            [0, 0, 0],
            [1, 1, 1],
            [0, 1, 0],
        ];
    } else if (type === "O") {
        return [
            [2, 2],
            [2, 2],
        ];
    } else if (type === "L") {
        return [
            [0, 3, 0],
            [0, 3, 0],
            [0, 3, 3],
        ];
    } else if (type === "I") {
        return [
            [0, 4, 0, 0],
            [0, 4, 0, 0],
            [0, 4, 0, 0],
            [0, 4, 0, 0],
        ];
    } else if (type === "S") {
        return [
            [0, 5, 5],
            [5, 5, 0],
            [0, 0, 0],
        ];
    } else if (type === "Z") {
        return [
            [6, 6, 0],
            [0, 6, 6],
            [0, 0, 0],
        ];
    } else if (type === "J") {
        return [
            [0, 7, 0],
            [0, 7, 0],
            [7, 7, 0],
        ];
    }
}

function draw() {                                                    //отрисовываем область игры
    context.fillStyle = "#000"; 
    context.fillRect(0, 0, canvas.width, canvas.height);             //делим область на квадратные участки

    drawMatrix(arena, {x: 0, y: 0});                                 //отрисовываем игровую арену
    drawMatrix(player.matrix, player.pos);                           //отрисовываем модели фигур
}

function drawMatrix(matrix, offset) {                                //определяем функцию для прорисовки объектов игры
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if(value !== 0) {
                context.fillStyle = colors[value];
                context.fillRect(x + offset.x, y + offset.y, 1, 1);
            }
        });
    });
}

function merge(arena, player) {                                      //функция, определяющая модель взаимодействия между полем игры и фигурами
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

function playerDrop() {                                              //функция, задающая движение фигуры вниз
    player.pos.y++;
    if(collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);
        playerReset();
        arenaSweep();
        updateScore();
    }
    dropCounter = 0;
}

function playerMove(dir) {                                           //функция, обеспечивающая передвижение фигуры по оси X влево/вправо
    player.pos.x += dir;
    if (collide(arena, player)) {
        player.pos.x -= dir;
    }
}

function playerReset() {
    const pieces = "ILJOTSZ";
    player.matrix = createPiece(pieces[pieces.length * Math.random() | 0]);
    player.pos.y = 0;
    player.pos.x = (arena[0].length / 2 | 0) - 
                   (player.matrix[0].length / 2 | 0);
    if (collide(arena, player)) {
        arena.forEach(row => row.fill(0));
        player.score = 0;
        updateScore();
    }
}

function playerRotate(dir) {                                         //функция, задающая модель взаимодействия фигуры при вращении с
    const pos = player.pos.x;                                        //вертикальными границами игры
    let offset = 1;                                              
    rotate(player.matrix, dir);
    while(collide(arena, player)) {
        player.pos.x += offset;
        offset = -(offset > 0 ? 1 : -1);
        if(offset > player.matrix[0].length) {
            rotate(player.matrix, -dir);
            player.pos.x = pos;
            return;
        }
    }
}

function rotate(matrix, dir) {                                       //функция, задающая модель вращения фигур
    for(let y = 0; y < matrix.length; ++y) {
        for(let x = 0; x < y; ++x) {
            [
                matrix[x][y],
                matrix[y][x],
            ] = [
                matrix[y][x],
                matrix[x][y],
            ];
        }
    }

    if(dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}

let dropCounter = 0,
    dropInterval = 1000;

let lastTime = 0;
function update(time = 0) {                         //функция-счетчит времени, которая задаёт временной интервал, по окончанию которого
    const deltaTime = time - lastTime;              //происходит падение фигуры на одну единицу длины.
    lastTime = time;

    dropCounter += deltaTime;
    if(dropCounter > dropInterval) {
        playerDrop();
    }

    draw();
    requestAnimationFrame(update);
}

function updateScore() {
    document.getElementById('score').innerText = player.score;
}

const colors = [
    null,
    "#51FF00",
    "#00FF99",
    "#00CCFF",
    "#0033FF",
    "#B989D9",
    "#FFFF99",
    "#FFCCCC",
];

const arena = createMatrix(12, 20);

// Задаём начальные параметры фигуры при появлении

const player = {
    pos: {x: 0, y: 0},
    matrix: null,
    score: 0,
}

// Добавляем обрабатчик событий по нажатию на определённые клавиши клавиатуры и выполняем соответствующую функцию

document.addEventListener("keydown", event => {
    if (event.keyCode === 37) {
        playerMove(-1);
    } else if (event.keyCode === 39) {
        playerMove(1);
    } else if (event.keyCode === 40) {
        playerDrop();
    } else if(event.keyCode === 81) {
        playerRotate(-1);
    } else if(event.keyCode === 87) {
        playerRotate(1);
    }
});

playerReset();
updateScore();
update();


