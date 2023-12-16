const colors = ['#000', '#FF4FA1', '#8A4FFF'],
	small = .4,
	PI = Math.PI;

import * as THREE from 'https://unpkg.com/three@0.159.0/build/three.module.min.js';

function vec3(...args) {return new THREE.Vector3(...args)};

THREE.ShaderChunk.emissivemap_fragment = THREE.ShaderChunk.emissivemap_fragment.replace('#endif', '\tdiffuseColor.a = mix(diffuseColor.a, 1., emissiveColor.a);\n#endif')

const canvSrc = document.createElement('canvas'),
	ctx = canvSrc.getContext('2d'),
	gradient = ctx.createLinearGradient(0, 0, 128, 0);
//document.body.append(canvSrc);

canvSrc.width=128;
canvSrc.height=1024;
gradient.addColorStop(0, colors[1]);
gradient.addColorStop(0.25, colors[0]);
gradient.addColorStop(0.5, colors[2]);
gradient.addColorStop(0.75, colors[0]);
gradient.addColorStop(1, colors[1]);

ctx.strokeStyle = gradient;
ctx.lineWidth = 3

for (let y = 32; y < 1024; y+=40) {
	ctx.moveTo(0, y);
	ctx.lineTo(128, y);
}
ctx.stroke();

var texTransform;

const geomtnry = new THREE.IcosahedronGeometry(1, 24).rotateX(PI),
	texture = new THREE.Texture( canvSrc, 300, 1000, 1000),
	material = new THREE.MeshStandardMaterial({
		transparent: true,
		opacity: .2,
		emissive: '#fff',
		roughness: .6,
		metalness: .7,
		color: '#777',
		emissiveMap: texture,
	}),
	material1 = material.clone(),
	canvas = document.querySelector('canvas.spheres'),
	renderer = new THREE.WebGLRenderer( {alpha:true, antialias: true, canvas:canvas} ),
	camera=new THREE.PerspectiveCamera( 40, 1, .1, 100 ),

	sphere = new THREE.Mesh(geomtnry, material),
	sphere1 = new THREE.Mesh(geomtnry, material1),
	hlight = new THREE.HemisphereLight('#eee', 0),
	light = new THREE.DirectionalLight(),
	spheres = new THREE.Group().add(sphere, sphere1),
	scene = new THREE.Scene().add(spheres, light, hlight),
	cashed={};

//renderer.outputEncoding = THREE.LinearSRGBColorSpace;

Object.assign(texture, {
	colorSpace: 'srgb',
	needsUpdate: true,
	anisotropy: renderer.capabilities.getMaxAnisotropy(),
	matrixAutoUpdate: false,
})
texture.matrix.elements[3] = .4; //skew

const texture1 = texture.clone();
material1.emissiveMap = texture1;

texture1.matrix.elements[4] = small;

sphere1.scale.multiplyScalar(small);
sphere1.position.y=1 + small;
sphere1.rotateY(-1.7)

sphere.scale.y=1.05

camera.position.set(0,0,5);
camera.lookAt(0,0,0);

light.position.set(1, -.2, -.8);
hlight.position.set(1, -.2, 0);

spheres.position.set(.1, -.2, 0);
spheres.rotation.set(.8, 0 ,.53);

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

	const ro = -dt * .0002;
	sphere.rotateY(ro*.9);
	sphere1.rotateY(ro);
	//texture1.matrix.elements[4] = small+.03*Math.sin(.001*t);

	renderer.render(scene, camera)
})

Object.assign(window, {geomtnry, texture, texture1, material, canvas, renderer, camera, sphere, spheres, light, hlight, scene, THREE, canvSrc})