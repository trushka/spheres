const colors = ['#000', '#FF4FA1', '#8A4FFF'];

import * as THREE from 'https://unpkg.com/three@0.159.0/build/three.module.min.js';

function vec3(...args) {return new THREE.Vector3(...args)};

THREE.ShaderChunk.emissivemap_fragment = THREE.ShaderChunk.emissivemap_fragment.replace('#endif', '\tdiffuseColor.a = mix(diffuseColor.a, 1., emissiveColor.a);\n#endif')

const canvSrc = document.createElement('canvas'),
	ctx = canvSrc.getContext('2d'),
	gradient = ctx.createLinearGradient(0, 0, 512, 0);
//document.body.append(canvSrc);

canvSrc.width=canvSrc.height=512;
gradient.addColorStop(0, colors[1]);
gradient.addColorStop(0.25, colors[0]);
gradient.addColorStop(0.5, colors[2]);
gradient.addColorStop(0.75, colors[0]);
gradient.addColorStop(1, colors[1]);

ctx.strokeStyle = gradient;
ctx.lineWidth = 2

for (let y = 16; y < 512; y+=16) {
	ctx.moveTo(0, y);
	ctx.lineTo(512, y);
}
ctx.stroke();

const geomtnry = new THREE.IcosahedronGeometry(1, 24),
	texture = new THREE.Texture( canvSrc, 300, 1000, 1000),
	material = new THREE.MeshStandardMaterial({
		transparent: true,
		opacity: .2,
		emissive: '#fff',
		roughness: .6,
		metalness: .7,
		color: '#777',
		emissiveMap: texture,
		// onBeforeCompile: sh => {
		// 	console.log(sh.fragmentShader)
		// }
	}),
	canvas = document.querySelector('canvas.spheres'),
	renderer = new THREE.WebGLRenderer( {alpha:true, antialias: true, canvas:canvas} ),
	camera=new THREE.PerspectiveCamera( 40, 1, .1, 100 ),

	sphere = new THREE.Mesh(geomtnry, material),
	hlight = new THREE.HemisphereLight('#eee', 0),
	light = new THREE.DirectionalLight(),
	spheres = new THREE.Group().add(sphere),
	scene = new THREE.Scene().add(spheres, light, hlight),
	cashed={};

//renderer.outputEncoding = THREE.LinearSRGBColorSpace;

Object.assign(texture, {
	colorSpace: 'srgb',
	needsUpdate: true,
	anisotropy: renderer.capabilities.getMaxAnisotropy(),
	matrixAutoUpdate: false,
})
texture.matrix.elements[3] = -.6; //skew

camera.position.set(0,0,6);
camera.lookAt(0,0,0);

light.position.set(1, -.2, -.8);
hlight.position.set(1, -.2, 0);

spheres.rotation.set(.7, 0 ,.5);

let t0=performance.now();
renderer.setAnimationLoop(function(t){
	if (!scene) return;
	if (cashed.dpr!=devicePixelRatio) renderer.setPixelRatio(cashed.dpr=devicePixelRatio);
	const rect = canvas.getBoundingClientRect()
	if (cashed.w!=rect.width || cashed.h!=rect.height) {
		renderer.setSize(cashed.w=rect.width, cashed.h=rect.height, false);
		camera.aspect=rect.width/rect.height;
		camera.updateProjectionMatrix();
	}

	const dt = Math.max(100, t-t0);
	t0 = t;

	sphere.rotateY(dt * .0002)
	renderer.render(scene, camera)
})

Object.assign(window, {geomtnry, texture, material, canvas, renderer, camera, sphere, spheres, light, hlight, scene, THREE, canvSrc})