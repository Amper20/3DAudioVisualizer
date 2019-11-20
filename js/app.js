//world setup
var scene, camera, render, controls;

// Cubes, fft related setup
var cubeNum, cubeSide = 5, padding;
var cubes, wireframe;
var fftSize = 64;
var modeChanged = false;

// Points mode
var SEPARATION = 55, AMOUNTX = 100, AMOUNTY = 128;
var particles, count = 0;
var mouseX = 0, mouseY = 0;
var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;
var acumulator = 0;

// Mushrums mode
var spheres, mushroomMaterial;
const reducer = (accumulator, currentValue) => accumulator + currentValue;
divfactor = 7000;

// play pause setup
var audio, analyser, mediaElement;

//colors setup
var skyColor = 0x808080, cubesColor = 0x00000;

document.getElementById("menu").style.backgroundColor = "#808080";
document.getElementById( 'play' ).addEventListener( 'click', clickedPlay);
document.getElementById( 'pause' ).addEventListener( 'click', clickedPause);

document.getElementById("mode").onchange = function(){
    updateByMode();
}
document.getElementById("selector").onchange = function(){
    clickedPlay();
}

initWorld();
updateByMode();

function clearCubes(){
    if(typeof cubes != 'undefined')
        for(var i = 0; i < cubes.length; i++)
            for (var j = 0; j < cubes[i].length; j++){
                scene.remove(scene.getObjectByName("cube" + i + j));  
                scene.remove(scene.getObjectByName("frame" + i + j));  
            }
}

function clearPoints(){
    scene.remove(particles);
}

function clearSpheres(){
    scene.remove(spheres);
}

function removeAll(){
    clearPoints();
    clearSpheres();
    clearCubes();
}

function clickedPlay(){
    
    updateByMode();
    
    
    // setup media element
    if (typeof mediaElement !== 'undefined') 
        mediaElement.pause()
    mediaElement = new Audio( document.getElementById("selector").value );
    mediaElement.loop = true;
    mediaElement.play();

    // audio stream for FFT
    audio = new THREE.Audio( new THREE.AudioListener() );
    audio.setMediaElementSource( mediaElement );
    
    // FFT
    analyser = new THREE.AudioAnalyser( audio, fftSize*2 );

    console.log("play");
}

function clickedPause(){

    mediaElement.pause();
    
    console.log("pause");
}


function initWorld(){
    // set up scene and camera
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera( 90, window.innerWidth/window.innerHeight, 10, 10000 );

    // set up renderer 
    renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setClearColor( skyColor, 1 );
    document.body.appendChild( renderer.domElement );

    // controls
    controls = new THREE.OrbitControls( camera, renderer.domElement );

}

function initPoints(){
    
    clearPoints();

    var numParticles = AMOUNTX * AMOUNTY;

    var positions = new Float32Array( numParticles * 3 );
    var scales = new Float32Array( numParticles );

    var i = 0, j = 0;

    for ( var ix = 0; ix < AMOUNTX; ix ++ ) {

        for ( var iy = 0; iy < AMOUNTY; iy ++ ) {

            positions[ i ] = ix * SEPARATION - ( ( AMOUNTX * SEPARATION ) / 2 ); // x
            positions[ i + 1 ] = 0; // y
            positions[ i + 2 ] = iy * SEPARATION - ( ( AMOUNTY * SEPARATION ) / 2 ); // z

            scales[ j ] = 1;

            i += 3;
            j ++;

        }

    }

    var geometry = new THREE.BufferGeometry();
    geometry.setAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
    geometry.setAttribute( 'scale', new THREE.BufferAttribute( scales, 1 ) );

    var material = new THREE.ShaderMaterial( {
        
        uniforms: {
            color: { value: new THREE.Color(cubesColor) },
        },
        vertexShader: document.getElementById( 'vertexshader' ).textContent,
        fragmentShader: document.getElementById( 'fragmentshader' ).textContent

    } );

    //

    particles = new THREE.Points( geometry, material );
    scene.add( particles );

    //
}

function initCubes(){

    //clear peviously existing cubes
    removeAll();

    padding = 3;
    cubeNum = 27, cubeSide = 5;
    cubes = Array(cubeNum).fill().map(()=>Array(cubeNum).fill());
    wireframe = Array(cubeNum).fill().map(()=>Array(cubeNum).fill());
    fftSize = (cubeNum + padding*2 - 1)*2;

    var geometry = new THREE.BoxGeometry( cubeSide, cubeSide, cubeSide );
    var material = new THREE.MeshBasicMaterial( { color: cubesColor } );
    var lineMaterial = new THREE.LineBasicMaterial({ color: skyColor });
            
    for(var i = 0 ; i < cubeNum; i++){
        for(var j = 0 ; j < cubeNum; j++){            

            cubes[i][j] = new THREE.Mesh( geometry, material);
            cubes[i][j].position.x = (i - cubeNum/2)*cubeSide;
            cubes[i][j].position.z = (j - cubeNum/2)*cubeSide;
            cubes[i][j].name = "cube" + i + j;
            scene.add(cubes[i][j]);

            wireframe[i][j] = new THREE.LineSegments(  new THREE.EdgesGeometry(cubes[i][j].geometry), lineMaterial);
            wireframe[i][j].position.x = (i - cubeNum/2)*cubeSide;
            wireframe[i][j].position.z = (j - cubeNum/2)*cubeSide;
            wireframe[i][j].name = "frame" + i + j;
            scene.add( wireframe[i][j] );
        }
    }   

}

function initSpheres() {


    var circleGeometry = new THREE.CircleBufferGeometry( 1, 6 );

    var geometry = new THREE.InstancedBufferGeometry();
    geometry.index = circleGeometry.index;
    geometry.attributes = circleGeometry.attributes;

    var particleCount = 175000;

    var translateArray = new Float32Array( particleCount * 3 );

    for ( var i = 0, i3 = 0, l = particleCount; i < l; i ++, i3 += 3 ) {
        var u = Math.random();
        var v = Math.random();
        var theta = u * 2.0 * Math.PI;
        var phi = Math.acos(2.0 * v - 1.0);
        var r = Math.cbrt(Math.random());
        var sinTheta = Math.sin(theta);
        var cosTheta = Math.cos(theta);
        var sinPhi = Math.sin(phi);
        var cosPhi = Math.cos(phi);
        var x = r * sinPhi * cosTheta;
        var y = r * sinPhi * sinTheta;
        var z = r * cosPhi; 

        translateArray[ i3 + 0 ] = x;
        translateArray[ i3 + 1 ] = y;
        translateArray[ i3 + 2 ] = z;

    }

    geometry.setAttribute( 'translate', new THREE.InstancedBufferAttribute( translateArray, 3 ) );

    mushroomMaterial = new THREE.RawShaderMaterial( {
        uniforms: {
            "map": { value: new THREE.TextureLoader().load( '/js/circle.png' ) },
            "time": { value: 0.0 }
        },
        vertexShader: document.getElementById( 'vshaderpsyh' ).textContent,
        fragmentShader: document.getElementById( 'fshaderpsyh' ).textContent,
        depthTest: true,
        depthWrite: true
    } );

    spheres = new THREE.Mesh( geometry, mushroomMaterial );
    spheres.scale.set( 1500, 1500, 1500 );
    spheres.name = "spheres";
    scene.add( spheres );

}

function updateByMode(){

    removeAll();

    var mode = document.getElementById("mode").value;
    skyColor = 0x808080; 

    if (mode == "cubes"){
        
        initCubes();
        
        camera.position.set( -133.7817033929154, 95.38754075877799, 154.8839474041323);
        camera.rotation.set(-0.5520030533709762, -0.6341343221091368, -0.34987573749653283);
        controls.update();
            
    }
    if (mode == "points"){

        initPoints();   
        
        camera.position.set(2016.155805055435, 1292.664447920684, 43.006988236302526);
        camera.rotation.set(-1.5375385615942183, 1.0004142037624637, 1.531289459027026);
        controls.update();

    }
    if(mode == "mushroom"){
        
        initSpheres();

        camera.position.set(-295.94744531874784, 111.33210376848776, -67.58778992352802);
        camera.rotation.set(-1.8248522218279715, -1.4015088370798527, -1.8283768565046559);
        controls.update();

        skyColor = 0xFFFFFF;
    
    }
    
    renderer.setClearColor( skyColor, 1 );

}


var animate = function () {
    
    requestAnimationFrame( animate );
    if(typeof analyser != 'undefined'){
        analyser.getFrequencyData();
        var data = analyser.data;
        var mode = document.getElementById("mode").value;
        if("cubes" == mode){
            for (var i = 0 ; i < cubes.length; i++){
                for (var j = 0 ; j < cubes.length; j++){   
                    cubes[i][j].scale.set( 1, Math.max(0.001, data[i+j]/4), 1);
                    wireframe[i][j].scale.set( 1, Math.max(0.001, data[i+j]/4 ), 1);
                }
            }        
        }
        if("points" == mode){
                var positions = particles.geometry.attributes.position.array;
				var scales = particles.geometry.attributes.scale.array;

				var i = 0, j = 0;
				for ( var ix = 0; ix < AMOUNTX; ix ++ ) {

					for ( var iy = 0; iy < AMOUNTY; iy ++ ) {

						positions[ i + 1 ] = ( Math.sin( ( ix + count ) * 0.3 ) * 50 ) +
										( Math.sin( ( iy + count ) * 0.5 ) * 50 ) + data[ix] * 3;

						scales[ j ] = ( Math.sin( ( ix + count ) * 0.3 ) + 1 ) * 10 +
										( Math.sin( ( iy + count ) * 0.5 ) + 1 ) * 10 + data[ix]/5;

						i += 3;
						j ++;

					}

				}

				particles.geometry.attributes.position.needsUpdate = true;
				particles.geometry.attributes.scale.needsUpdate = true;
                count += 0.1;
        }
        if("mushroom" == mode){
            var time = performance.now() * 0.0005;
            var sum = data.reduce(reducer); 
            mushroomMaterial.uniforms[ "time" ].value = sum/divfactor;
            acumulator += sum/divfactor;
			spheres.rotation.x += 0.002;
            spheres.rotation.y += 0.002;
            spheres.rotation.z += 0.002;
        }
    }
    renderer.render( scene, camera );  
};

animate();
