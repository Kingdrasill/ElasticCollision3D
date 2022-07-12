"use strict";

// Variavais do html
let btStart = document.getElementById('start'); // Botao start
let joules = document.getElementById('energia'); // Div de energia cinética 
let counter = document.getElementById('count'); // Div contador das bolas
let canvas = document.getElementById('canvas'); // Div canvas onde fica o 3D
let menu_bolas = document.getElementById('bolas'); // Tabela com as bolas
let grafico = document.getElementById('graph'); // Checkbox para mostrar ou não gráfico
let graficoCanvas = document.getElementById('mycanvas'); // Div do gráfico

let width = canvas.offsetWidth - 10; // Width do cnvas
let height = canvas.offsetHeight - 10; // Height do canvas

// Varaibles for setting render inicial
var count = 3; // Número de bolas iniciais
var radius = 0.5; // Raio das bolas
var range = 5;  // Tamanho da caixa
let maxpos = range - radius; // Posição máxima possível de uma bola
let maxvel = 10; // Velocidade 

let balls = []; // Vetor que guarda as bolas e suas massas
let positionsInitials = []; // Vetor das posições iniciais das bolas
let velocitiesInitials = []; // Vetor das velocidades iniciais das bolas
let arrows = []; // Vetor com o vetor das velocidades de cada bola

let t = 0; // Tempo passado
let dt = 1/ 60; // Instante de tempo

let energia = 0; // Energia cinética do sistema

let run = false; // Mover ou não

// Variaveis usadas na hora de mover as bolas
var plus = new THREE.Vector3(); // Posição do centro mais o raio
var minus = new THREE.Vector3(); // Posição do centro menos o raio
var separation = new THREE.Vector3(); // Sepração de duas bolas
var p1 = new THREE.Vector3(); // Posição bola 1
var p2 = new THREE.Vector3(); // Posilçao bola 2
var v1 = new THREE.Vector3(); // Velocidade bola 1
var v2 = new THREE.Vector3(); // Velocidade bola 2
var m1 = 0; // Massa bola 1 
var m2 = 0; // Massa bola 2

// Setting html from javascript
counter.innerHTML = count; // Imprimindo contador de bolas
document.form_main.start.onclick = () => start(); // Dando start onclick() uma função
document.form_main.reset.onclick = () => reset(); // Dando reset onclick() uma função

// Cria uma cena para renderizar
var scene = new THREE.Scene();

// Cria os eixos cartesianos
const axesHelper = new THREE.AxesHelper( range );
scene.add( axesHelper );

// Cria o que vai renderizar a tela
var renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(width, height);
renderer.setClearColor(0x000000, 1);
canvas.appendChild(renderer.domElement);

// Cria a camera da cena
var camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
camera.up.set(0, 0, 1);
camera.position.set(2 * range, 1.5 * range, 1.5 * range);
window.addEventListener('resize', function () {
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
});

// Cria os controles de orbita
var controls = new THREE.OrbitControls(camera, renderer.domElement);

// Cria a caixa onde as bolas estão dentro
var box = new THREE.Geometry();
box.vertices.push(new THREE.Vector3(-range, -range, -range));
box.vertices.push(new THREE.Vector3(range, range, range));

// Cria a malha da caixa
var boxMesh = new THREE.Line(box);
scene.add(new THREE.BoxHelper(boxMesh, 'white'));

// Cria um fonte de luz na camera
var light = new THREE.DirectionalLight(0xffffff, .8);
light.position.set(-range, range, 0);
camera.add(light);

// Cria uma luz ambiente
var ambient = new THREE.AmbientLight(0x555555);
scene.add(camera);
scene.add(ambient);

// Cria as bolas iniciais
for (var i = 0; i < count; i++) {

    // Cria uma esfera
    var geometry = new THREE.SphereGeometry(radius, 20, 20);

    // Cria o material da esfera
    var material = new THREE.MeshPhongMaterial();
    material.color = new THREE.Color().setHSL(Math.random(), 1, .5);

    // Cria a bola
    var ball = new THREE.Mesh(geometry, material);

    // Consede uma posição aleatória para bola
    ball.position.set( parseFloat((maxpos * (2 * Math.random() - 1)).toFixed(3)),
        parseFloat((maxpos * (2 * Math.random() - 1)).toFixed(3)),
        parseFloat((maxpos * (2 * Math.random() - 1)).toFixed(3)) );
    positionsInitials.push(ball.position.clone());

    // Consede uma velocidade aleatória para bola
    var speed = maxvel;
    ball.v = new THREE.Vector3( parseFloat((speed * (2 * Math.random() - 1)).toFixed(3)),
        parseFloat((speed * (2 * Math.random() - 1)).toFixed(3)),
        parseFloat((speed * (2 * Math.random() - 1)).toFixed(3)) );
    velocitiesInitials.push(ball.v.clone());

    // Consede um nome para bola 
    ball.name = 'ball' + i;

    // Consede um massa para bola
    var mass = radius * 10;
    
    var ball2 = [ball, mass];
    
    // Atualiza a energia cinética
    energia += Math.pow(ball.v.clone().length(), 2) * mass / 2;
    joules.innerHTML = energia.toFixed(3) + 'J';
    
    balls.push(ball2);
    scene.add(ball);
    
    createArrowHelpers(ball2);
    createBallInputs(ball2);
}

// Cria setas que mostram vetor velocidade da bola
function createArrowHelpers( ball ) {
    const dir = ball[0].v.clone().normalize(); // Vetor unitário da velocidade
    const origin = ball[0].position.clone(); // Origem do vetor
    const length = ball[0].v.clone().length(); // Tamanho do vetor velocidade
    const hex = 0xffffff;

    const arrowHelper = new THREE.ArrowHelper( dir, origin, length, hex );
    arrows.push(arrowHelper);
    if(!run)
        scene.add( arrowHelper );
}

// Cria os inputs de cada bola
function createBallInputs( ball ) {
    let tag = document.createElement("tr"); // Linha da tabela
    tag.setAttribute('class' , 'row'); // CSS
    tag.id = ball[0].name; // Id da linha

    // Input cor da bola
    let tdCor = document.createElement("td");
    tdCor.innerHTML = '<input type="color" name="color" id="color-' + ball[0].name + '" value="#' + ball[0].material.color.getHexString() + '" onChange="changeColor(`color-' + ball[0].name + '`)" />';
    tag.appendChild(tdCor);

    // Input massa da bola
    let tdMassa = document.createElement("td");
    tdMassa.innerHTML = '<input type="number" id="mass-' + ball[0].name + '" max="10" min="1" value="' + ball[1] + '" step="0.01" onChange="changeMass(`mass-' + ball[0].name + '`)" />';
    tag.appendChild(tdMassa);

    // Input posição X da bola
    let tdPX = document.createElement("td");
    tdPX.innerHTML = '<input type="number" id="pos-x-' + ball[0].name + '" max="' + maxpos + '" min="' + (-maxpos) + '" value="' + ball[0].position.x.toFixed(3) + '" step="0.001" onChange="changePositon(`pos-x-' + ball[0].name + '`)" />';
    tag.appendChild(tdPX);

    // Input posição Y da bola
    let tdPY = document.createElement("td");
    tdPY.innerHTML = '<input type="number" id="pos-y-' + ball[0].name + '" max="' + maxpos + '" min="' + (-maxpos) + '" value="' + ball[0].position.y.toFixed(3) + '" step="0.001" onChange="changePositon(`pos-y-' + ball[0].name + '`)" />';
    tag.appendChild(tdPY);

    // Input posição Z da bola
    let tdPZ = document.createElement("td");
    tdPZ.innerHTML = '<input type="number" id="pos-z-' + ball[0].name + '" max="' + maxpos + '" min="' + (-maxpos) + '" value="' + ball[0].position.z.toFixed(3) + '" step="0.001" onChange="changePositon(`pos-z-' + ball[0].name + '`)" />';
    tag.appendChild(tdPZ);

    // Input velocidade X da bola
    let tdVX = document.createElement("td");
    tdVX.innerHTML = '<input type="number" id="vel-x-' + ball[0].name + '" max="' + maxvel + '" min="' + (-maxvel) + '" value="' + (ball[0].v.x).toFixed(3) + '" step="0.001" onChange="changeVelocity(`vel-x-' + ball[0].name + '`)" />';
    tag.appendChild(tdVX);

    // Input velocidade Y da bola
    let tdVY = document.createElement("td");
    tdVY.innerHTML = '<input type="number" id="vel-y-' + ball[0].name + '" max="' + maxvel + '" min="' + (-maxvel) + '" value="' + (ball[0].v.y).toFixed(3) + '" step="0.001" onChange="changeVelocity(`vel-y-' + ball[0].name + '`)" />';
    tag.appendChild(tdVY);
    let tdVZ = document.createElement("td");
    tdVZ.innerHTML = '<input type="number" id="vel-z-' + ball[0].name + '" max="' + maxvel + '" min="' + (-maxvel) + '" value="' + (ball[0].v.z).toFixed(3) + '" step="0.001" onChange="changeVelocity(`vel-z-' + ball[0].name + '`)" />';
    tag.appendChild(tdVZ);

    // Input modulo velocidade
    let tdV = document.createElement("td");
    tdV.innerHTML = '<input type="number" id="vel-' + ball[0].name + '"  value="' + (ball[0].v.length()).toFixed(3) + '" disabled/>';
    tag.appendChild(tdV);

    menu_bolas.appendChild(tag);
}

// Método para criar uma bola
function addBall() {

    // Cria uma esfera
    var geometry = new THREE.SphereGeometry(radius, 20, 20);

    // Cria o material da esfera
    var material = new THREE.MeshPhongMaterial();
    material.color = new THREE.Color().setHSL(Math.random(), 1, .5);
    
    // Cria a bola
    var ball = new THREE.Mesh(geometry, material);

    // Consede uma posição aleatória para bola
    ball.position.set( parseFloat((maxpos * (2 * Math.random() - 1)).toFixed(3)),
        parseFloat((maxpos * (2 * Math.random() - 1)).toFixed(3)),
        parseFloat((maxpos * (2 * Math.random() - 1)).toFixed(3)) );
    positionsInitials.push(ball.position.clone());

    // Consede uma velocidade aleatória para bola
    var speed = maxvel;
    ball.v = new THREE.Vector3( parseFloat((speed * (2 * Math.random() - 1)).toFixed(3)),
        parseFloat((speed * (2 * Math.random() - 1)).toFixed(3)),
        parseFloat((speed * (2 * Math.random() - 1)).toFixed(3)) );
    velocitiesInitials.push(ball.v.clone());

    // Consede um nome para bola 
    ball.name = 'ball' + count;

    // Consede um massa para bola
    var mass = radius * 10;
    var ball2 = [ball, mass];

    balls.push(ball2);
    scene.add(ball);

    createArrowHelpers(ball2);
    createBallInputs(ball2);
    addBalltoChart(myChart, ball);

    // Aumenta a quantidade de bolas 
    count++;
    counter.innerHTML = count;

    // Atualiza a energia cinética da bola
    energia += Math.pow(ball.v.clone().length(), 2) * mass / 2;
    joules.innerHTML = energia.toFixed(3) + 'J';

    // Mínimo de duas bolas
    if(count > 2) {
        let remove = document.getElementById('remove');
        remove.disabled = false;
    }

    // Máximo de dez bolas
    if(count >= 10) {
        let add = document.getElementById('add');
        add.disabled = true;
    }
}

// Método para remover a última bola criada
function removeBall() {

    // Atualiza o contador de bolas
    count--;
    counter.innerHTML = count;
    
    // Remove a bola da cena
    scene.remove(balls[count][0]);

    // Remove o input da bola
    var element = document.getElementById(balls[count][0].name);
    element.parentNode.removeChild(element);
    
    // Tira a bola da lista
    balls.pop();
    positionsInitials.pop();
    velocitiesInitials.pop();
    
    // Remove a seta da bola
    scene.remove(arrows[count]);
    arrows.pop();

    removeBallfromChart(myChart);

    // Máximo de dez bolas
    if(count < 10) {
        let add = document.getElementById('add');
        add.disabled = false;
    }

    // Mínimo de duas bolas
    if(count <= 2) {
        let remove = document.getElementById('remove');
        remove.disabled = true;
    }
}

// Método para mudar a massa da bola
function changeMass( id ) {
    
    const bola = id.split('-')
    let input = document.getElementById(id) 
    let value = input.value*1

    if(value >= 10)
        value = 10
    if(value <= 1)
        value = 1
    
    input.value = (value).toFixed(3);
    
    for (let i=0 ; i < count ; i++ ) {
        if(balls[i][0].name == bola[1]) {
            energia -= Math.pow(balls[i][0].v.clone().length(), 2) * balls[i][1] / 2;
            balls[i][1] = value
            energia += Math.pow(balls[i][0].v.clone().length(), 2) * balls[i][1] / 2;
            joules.innerHTML = energia.toFixed(3) + 'J'
            break;
        }
    }
}

// Método para mudar a velocidade da bola
function changeVelocity( id ) {
    const bola = id.split('-')
    let input = document.getElementById(id)
    let mv = document.getElementById('vel-'+bola[2])
    let value = input.value*1

    if(value >= maxvel)
        value = maxvel
    if(value <= (-maxvel))
        value = -maxvel

    input.value = (value).toFixed(3)
    
    for (let i=0; i<count; i++) {
        if(balls[i][0].name == bola[2]) {
            energia -= Math.pow(balls[i][0].v.clone().length(), 2) * balls[i][1] / 2;
            if (bola[1] == 'x') {
                balls[i][0].v.x = value
            } else if (bola[1] == 'y') {
                balls[i][0].v.y = value
            } else if (bola[1] == 'z') {
                balls[i][0].v.z = value
            }

            if(balls[i][0].v.x == 0 && balls[i][0].v.y == 0 && balls[i][0].v.z == 0) {
                balls[i][0].v.x = 0.00000000000000000000000000000000000000000000001;
            }

            mv.value = (balls[i][0].v.length()).toFixed(3)
            
            energia += Math.pow(balls[i][0].v.clone().length(), 2) * balls[i][1] / 2;
            joules.innerHTML = energia.toFixed(3) + 'J'

            scene.remove(arrows[i]);
            const dir = balls[i][0].v.clone().normalize();
            const origin = balls[i][0].position.clone();
            const length = balls[i][0].v.clone().length();
            const hex = 0xffffff;

            const arrowHelper = new THREE.ArrowHelper( dir, origin, length, hex );
            arrows[i] = arrowHelper;
            scene.add(arrowHelper);
            updateBallVelocity(myChart, balls[i][0])
            break;
        }
    }
}

// Método para mudar a posição da bola
function changePositon( id ) {
    const bola = id.split('-')
    let input = document.getElementById(id)
    let value = input.value*1

    if(value >= maxpos)
        value = maxpos
    if(value <= (-maxpos))
        value = -maxpos

    input.value = parseFloat(value).toFixed(3)

    for (let i=0; i<count; i++) {
        if(balls[i][0].name == bola[2]) {
            if (bola[1] == 'x') {
                balls[i][0].position.x = value
            } else if (bola[1] == 'y') {
                balls[i][0].position.y = value
            } else if (bola[1] == 'z') {
                balls[i][0].position.z = value
            }
            
            scene.remove(arrows[i]);
            const dir = balls[i][0].v.clone().normalize();
            const origin = balls[i][0].position.clone();
            const length = balls[i][0].v.clone().length();
            const hex = 0xffffff;

            const arrowHelper = new THREE.ArrowHelper( dir, origin, length, hex );
            arrows[i] = arrowHelper;
            scene.add(arrowHelper);
            break;
        }
    }
}

// Método para mudar a cor da bola
function changeColor( id ) {
    const bola = id.split('-')
    let input = document.getElementById(id) 
    let color = HexToHSL(input.value)
    
    for (let i=0 ; i < count ; i++ ) {
        if(balls[i][0].name == bola[1]) {
            balls[i][0].material.color.setHSL( color.h , color.s , color.l )
            updateBallColor(myChart, balls[i][0])
            break;
        }
    }
}

// Método que converte cor Hex para cor HSL
function HexToHSL(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

    var r = parseInt(result[1], 16);
    var g = parseInt(result[2], 16);
    var b = parseInt(result[3], 16);

    r /= 255, g /= 255, b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;

    if(max == min){
        h = s = 0; // achromatic
    } else {
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch(max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        
        h /= 6;
    }

    return {h, s, l};
}

// Mover e resolver colisões das bolas
function moveBalls(dt) {
    // Energia cinética 0
    energia = 0;
    
    for (var i = 0; i < count; i++) {
        // Pega uma bola
        var b1 = balls[i][0];

        // Verifica se a bola está dentro de uma parede
        plus.copy(b1.position).addScalar(radius);
        minus.copy(b1.position).subScalar(radius);
        if (plus.x > range || minus.x < -range) b1.v.x = -b1.v.x;
        if (plus.y > range || minus.y < -range) b1.v.y = -b1.v.y;
        if (plus.z > range || minus.z < -range) b1.v.z = -b1.v.z;

        for (var j = i + 1; j < count; j++) {
            // Pega outra bola
            var b2 = balls[j][0];

            // Verifica se as bolas estão colindindo
            separation.copy(b1.position).sub(b2.position);
            if (separation.length() < 2 * radius) {

                p1 = b1.position.clone();
                m1 = balls[i][1];
                v1 = b1.v.clone();

                p2 = b2.position.clone();
                m2 = balls[j][1];
                v2 = b2.v.clone();

                // Novas velocidades
                var newv1 = v1.clone().sub(p1.clone().sub(p2).multiplyScalar((2 * m2) / (m1 + m2) * ((v1.clone().sub(v2).dot(p1.clone().sub(p2))) / Math.pow((p1.clone().sub(p2).length()), 2))));
                var newv2 = v2.clone().sub(p2.clone().sub(p1).multiplyScalar((2 * m1) / (m1 + m2) * ((v2.clone().sub(v1).dot(p2.clone().sub(p1))) / Math.pow((p2.clone().sub(p1).length()), 2))));

                b1.v = newv1;
                b2.v = newv2;
            }

        }
        
        b1.position.add(b1.v.clone().multiplyScalar(dt));

        let px = document.getElementById('pos-x-'+b1.name);
        px.value = (b1.position.x).toFixed(3);
        let py = document.getElementById('pos-y-'+b1.name);
        py.value = (b1.position.y).toFixed(3);
        let pz = document.getElementById('pos-z-'+b1.name);
        pz.value = (b1.position.z).toFixed(3);

        let vx = document.getElementById('vel-x-'+b1.name);
        vx.value = (b1.v.x).toFixed(3);
        let vy = document.getElementById('vel-y-'+b1.name);
        vy.value = (b1.v.y).toFixed(3);
        let vz = document.getElementById('vel-z-'+b1.name);
        vz.value = (b1.v.z).toFixed(3);

        let mv = document.getElementById('vel-'+b1.name);
        mv.value = (b1.v.length()).toFixed(3);

        energia += Math.pow(balls[i][0].v.clone().length(), 2) * balls[i][1] / 2;
    }
}

let atualiza = 0
// Começa renderizar
function render() {
    // Setando fps para 60
    setTimeout( function() {requestAnimationFrame( render );}, 1000 / 60 );
    renderer.render(scene, camera);

    if (run) {
        t += dt
        updateClock(t);
        moveBalls(dt);
        atualiza += dt
        if(atualiza >= 0.5 && grafico.checked) {
            for(let i=0; i<count; i++) {
                addBallData(myChart,balls[i][0])
            }
            atualiza = 0
        }
        
        joules.innerHTML = energia.toFixed(3) + 'J';
    }
}

render();

// Método para atualizar o timer
function updateClock( t ) {
    let minute = document.getElementById('minute');
    let second = document.getElementById('second');
    let millisecond = document.getElementById('millisecond');

    minute.innerHTML = Math.floor(t/60) >= 10 ? Math.floor((t/60)) : `0${Math.floor((t/60))}`;
    second.innerHTML = Math.floor(t%60) >= 10 ? Math.floor(t%60) : `0${Math.floor(t%60)}`;
    millisecond.innerHTML = Math.floor((t*1000)%1000)-1 >= 100 ? Math.floor((t*1000)%1000)-1 : `0${Math.floor((t*1000)%1000)-1}`;
}

// Método para começar e pausar o tempo
function start() {
    pause();
    if (btStart.innerHTML == 'START') {
        btStart.innerHTML = 'STOP';
        btStart.setAttribute('style', 'background-color: red');
        run = true;
        scene.remove( axesHelper );
        removeArrows();
        
        let add = document.getElementById('add');
        add.disabled = true;
        let remove = document.getElementById('remove');
        remove.disabled = true;
        for(let i=0; i<count; i++) {
            let b1 = balls[i][0];

            let mass = document.getElementById('mass-'+b1.name);
            mass.disabled = true;
            let px = document.getElementById('pos-x-'+b1.name);
            px.disabled = true;
            let py = document.getElementById('pos-y-'+b1.name);
            py.disabled = true;
            let pz = document.getElementById('pos-z-'+b1.name);
            pz.disabled = true;
            let vx = document.getElementById('vel-x-'+b1.name);
            vx.disabled = true;
            let vy = document.getElementById('vel-y-'+b1.name);
            vy.disabled = true;
            let vz = document.getElementById('vel-z-'+b1.name);
            vz.disabled = true;
        }
    } else if (btStart.innerHTML == 'STOP') {
        btStart.innerHTML = 'START';
        btStart.setAttribute('style', 'background-color: green');
        scene.add( axesHelper );
        recreateArrows();
    }
}

function pause() {
    run = false;
    
    let add = document.getElementById('add');
    add.disabled = false;
    let remove = document.getElementById('remove');
    remove.disabled = false;
    for(let i=0; i<count; i++) {
        let b1 = balls[i][0];

        let mass = document.getElementById('mass-'+b1.name);
        mass.disabled = false;
        let px = document.getElementById('pos-x-'+b1.name);
        px.disabled = false;
        let py = document.getElementById('pos-y-'+b1.name);
        py.disabled = false;
        let pz = document.getElementById('pos-z-'+b1.name);
        pz.disabled = false;
        let vx = document.getElementById('vel-x-'+b1.name);
        vx.disabled = false;
        let vy = document.getElementById('vel-y-'+b1.name);
        vy.disabled = false;
        let vz = document.getElementById('vel-z-'+b1.name);
        vz.disabled = false;
    }
}

// Método para resetar a simulação
function reset() {
    pause();
    if (btStart.innerHTML == 'STOP') {
        btStart.innerHTML = 'START';
        btStart.setAttribute('style', 'background-color: green');
        scene.add( axesHelper );
    }
    t=0;
    document.getElementById('minute').innerText = '00';
    document.getElementById('second').innerText = '00';
    document.getElementById('millisecond').innerText = '000';
    restore();
    removeArrows();
    recreateArrows();
    resetChart();
}

// Remove todas setas na hora de mover as bolas
function removeArrows() {
    for (let i=0; i<count; i++) {
        scene.remove(arrows[i]);
    }
}

// Recria todas as setas na hora que pausar o tempo
function recreateArrows() {
    for (let i=0; i<count; i++) {
        const dir = balls[i][0].v.clone().normalize();
        const origin = balls[i][0].position.clone();
        const length = balls[i][0].v.clone().length();
        const hex = 0xffffff;

        const arrowHelper = new THREE.ArrowHelper( dir, origin, length, hex );
        arrows[i] = arrowHelper;
        scene.add(arrows[i]);
    }
}

// Chamado na hora que o botão reset é apertado para retornar os dos iniciais das bolas
function restore() {
    for(let i=0; i<count; i++) {
        var b1 = balls[i][0];
        
        balls[i][1] = radius*10;
        let mass = document.getElementById('mass-'+b1.name);
        mass.value = balls[i][1];

        b1.position.x = positionsInitials[i].x;
        b1.position.y = positionsInitials[i].y;
        b1.position.z = positionsInitials[i].z;
        b1.v.copy(velocitiesInitials[i]);

        let px = document.getElementById('pos-x-'+b1.name);
        px.value = (b1.position.x).toFixed(3);
        let py = document.getElementById('pos-y-'+b1.name);
        py.value = (b1.position.y).toFixed(3);
        let pz = document.getElementById('pos-z-'+b1.name);
        pz.value = (b1.position.z).toFixed(3);

        let vx = document.getElementById('vel-x-'+b1.name);
        vx.value = (b1.v.x).toFixed(3);
        let vy = document.getElementById('vel-y-'+b1.name);
        vy.value = (b1.v.y).toFixed(3);
        let vz = document.getElementById('vel-z-'+b1.name);
        vz.value = (b1.v.z).toFixed(3);
    }
}

/* ------------------------------------------------------------------------------------------------------------------ */

// Criação de gráficos

let mydata = [];
for(let i=0; i<count; i++) {
    let ball = {
        label: `${balls[i][0].name}`,
        data: [{
            x: t,
            y: balls[i][0].v.length()
        }],
        backgroundColor: balls[i][0].material.color.getStyle(),
        borderColor: balls[i][0].material.color.getStyle()
    };
    mydata.push(ball);
}

let data = {
    datasets: mydata,
};

let config = {
    type: 'line',
    data: data,
    options: {
        animation: {
            duration: 0,
        },
        responsive: true,
        scales: {
            x: {
                type: 'linear',
                position: 'bottom',
                title: {
                    display: true,
                    text: 'Tempo (s)',
                    color: '#444',
                    font: {
                        size: 20,
                        weight: 'bold',
                    },
                    padding: {top: 10, left: 0, right: 0, bottom: 0}
                }
            },
            y: {
                type: 'linear',
                position: 'left',
                title: {
                    display: true,
                    text: 'Módulo Velocidade (m/s)',
                    color: '#444',
                    font: {
                        size: 20,
                        weight: 'bold',
                    },
                    padding: {top: 0, left: 0, right: 0, bottom: 10}
                }
            }
        },
        plugins: {
            legend: {
            position: 'top',
            },
            title: {
            display: true,
            text: 'Módulo da velocidade das bolas em função do tempo'
            }
        }
    },
};

let myChart = new Chart(document.getElementById('myChart'),config);

function addBalltoChart( chart, ball ) {
    let data = {
        label: `${ball.name}`,
        data: [{
            x: t,
            y: ball.v.length()
        }],
        backgroundColor: ball.material.color.getStyle(),
        borderColor: ball.material.color.getStyle()
    };

    chart.data.datasets.push(data);
    chart.update();
    console.log(chart.data)
}

function removeBallfromChart( chart ) {
    chart.data.datasets.pop();
    chart.update();
} 

function addBallData( chart, ball ) {
    let data = {
        x: t,
        y: ball.v.length()
    };
    chart.data.datasets.forEach(element => {
        if(element.label == ball.name) 
            element.data.push(data);
    });
    chart.update();
}

function updateBallColor(chart, ball) {
    chart.data.datasets.forEach(element => {
        if(element.label == ball.name) {
            element.backgroundColor = ball.material.color.getStyle()
            element.borderColor = ball.material.color.getStyle()
        }
    });
    chart.update();
}

function updateBallVelocity(chart, ball) {
    let data = {
        x: t,
        y: ball.v.length()
    };
    chart.data.datasets.forEach(element => {
        if(element.label == ball.name) {
            if(t == 0) {
                element.data[0].y = ball.v.length()
            } else if (t != 0) {
                element.data.push(data);
            }
        }
    });
    chart.update();
}

function resetChart() {
    myChart.destroy();
    mydata = [];
    for(let i=0; i<count; i++) {
        let ball = {
            label: `${balls[i][0].name}`,
            data: [{
                x: t,
                y: balls[i][0].v.length()
            }],
            backgroundColor: balls[i][0].material.color.getStyle(),
            borderColor: balls[i][0].material.color.getStyle()
        };
        mydata.push(ball);
    }

    data = {
        datasets: mydata,
    };

    config = {
        type: 'line',
        data: data,
        options: {
            animation: {
                duration: 0,
            },
            responsive: true,
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    title: {
                        display: true,
                        text: 'Tempo (s)',
                        color: '#444',
                        font: {
                            size: 20,
                            weight: 'bold',
                        },
                        padding: {top: 10, left: 0, right: 0, bottom: 0}
                    }
                },
                y: {
                    type: 'linear',
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Módulo Velocidade (m/s)',
                        color: '#444',
                        font: {
                            size: 20,
                            weight: 'bold',
                        },
                        padding: {top: 0, left: 0, right: 0, bottom: 10}
                    }
                }
            },
            plugins: {
                legend: {
                position: 'top',
                },
                title: {
                display: true,
                text: 'Módulo da velocidade das bolas em função do tempo'
                }
            }
        },
    };

    myChart = new Chart(document.getElementById('myChart'),config);
}

function showChart() {
    if(grafico.checked) {
        graficoCanvas.setAttribute('style', 'height: 500px');
    } else {
        graficoCanvas.setAttribute('style', 'height: 0');
    }
}