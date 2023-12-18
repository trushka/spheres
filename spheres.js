const colors = ['#000', '#FF4FA1', '#8A4FFF'],
	canvas = document.querySelector('canvas.spheres'),
	small = .38,

	PI = Math.PI;

import * as THREE from 'https://unpkg.com/three@0.159.0/build/three.module.min.js';

function vec3(...args) {return new THREE.Vector3(...args)};

THREE.ShaderChunk.emissivemap_fragment = THREE.ShaderChunk.emissivemap_fragment.replace('#endif', `
	diffuseColor.a = mix(diffuseColor.a, 1., emissiveColor.a);
	diffuseColor.rgb *= emissiveColor.rgb + 1.- emissiveColor.a;
	//roughnessFactor += -emissiveColor.a * .1;
#endif`)

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
ctx.lineWidth = 3.5

for (let y = 32; y < 1024; y+=40) {
	ctx.moveTo(0, y);
	ctx.lineTo(128, y);
}
ctx.stroke();

var texTransform;

const geomtnry = new THREE.IcosahedronGeometry(1, 24),//.rotateX(PI),
	textures = [new THREE.Texture( canvSrc, 300, 1000, 1000)],
	material = new THREE.MeshStandardMaterial({
		transparent: true,
		opacity: .22,
		emissive: '#fff',
		roughness: .6,
		metalness: .7,
		color: '#999',
		emissiveMap: textures[0],
	}),
	material1 = material.clone(),
	renderer = new THREE.WebGLRenderer( {alpha:true, antialias: true, canvas:canvas} ),
	camera=new THREE.PerspectiveCamera( 40, 1, .1, 100 ),

	sphere = new THREE.Mesh(geomtnry, material),
	sphere1 = new THREE.Mesh(geomtnry, material1),
	hlight = new THREE.HemisphereLight('#fff', '#fff'),
	light = new THREE.DirectionalLight('#fff', 0.7),
	spheres = new THREE.Group().add(sphere, sphere1),
	scene = new THREE.Scene().add(spheres, light, hlight),
	cashed={};

//renderer.outputEncoding = THREE.LinearSRGBColorSpace;

Object.assign(textures[0], {
	colorSpace: 'srgb',
	needsUpdate: true,
	anisotropy: renderer.capabilities.getMaxAnisotropy(),
	matrixAutoUpdate: false,
})

textures[1] = textures[0].clone();
textures[0].matrix.elements[3] = .4; //skew
textures[1].matrix.elements[3] = -.5; //skew
textures[1].matrix.elements[7] = -.007; //offsetY

material1.emissiveMap = textures[1];

textures[1].matrix.elements[4] = small;

sphere1.scale.multiplyScalar(small);
sphere1.position.y=1 + small;
sphere1.rotation.y  = -1.7;
//sphere1.scale.y *= -1

sphere.scale.y=1.03

camera.position.set(0,0,5);
camera.lookAt(0,0,0);

light.position.set(1, -.2, -.8);
hlight.position.set(1, 0.6, 0.2);
hlight.groundColor.multiplyScalar(-.3)

spheres.position.set(.1, -.15, 0);
spheres.rotation.set(.8, 0 ,.53);

let t0=performance.now(), hover=[0, 0], targs=[], speeds = [0, 0];

renderer.setAnimationLoop(function(t){
	if (!scene) return;
	if (cashed.dpr!=devicePixelRatio) renderer.setPixelRatio(cashed.dpr=devicePixelRatio);
	const rect = canvas.getBoundingClientRect(),
		{top, bottom, height} = rect;
	if (cashed.w!=rect.width || cashed.h!=rect.height) {
		renderer.setSize(cashed.w=rect.width, cashed.h=rect.height, false);
		camera.aspect=rect.width/rect.height;
		camera.updateProjectionMatrix();
	}
	const {scrollTop, scrollHeight, clientHeight} = document.scrollingElement;

	if (bottom<0 || top > clientHeight) return;

	camera.position.y = (top + height/2 -clientHeight/2)/clientHeight*2;
	camera.lookAt(0, 0, -1)

	const dt = Math.min(100, t-t0);
	t0 = t;

	//const skew = hover[0]? .5 : hover[1] ? -.4 : .3;

	spheres.children.forEach((sph, i)=>{
		hover[i]*=hover[i];
		const v = [7, -8][i] * .0001 * (hover[i] || -1),
			ro = sph.rotation.y,
			reaching = dt * .002,
			targ = targs[i] = (targs[i] ?? ro) + dt*v;

		sph.rotation.y += speeds[i] = (targ - ro) * reaching;
	})

	renderer.render(scene, camera)
})

const raycaster = new THREE.Raycaster(),
	test = (pos, r) => raycaster.ray.distanceSqToPoint(spheres.localToWorld(pos.clone() )) < r*r;

canvas.onmousemove=canvas.onpointerdown = e=>{

	raycaster.setFromCamera(new THREE.Vector2(
		e.offsetX / cashed.w * 2 - 1,
		1 - e.offsetY / cashed.h * 2
	), camera);

	hover[1] = +test(sphere1.position.clone(), small) || hover[1]*.999999999999;
	hover[0] = +test(sphere.position.clone(), 1) || hover[0]*.999999999999;
}
window.addEventListener('pointerdown', e=> {if (e.target != canvas) hover = [0, 0]});

Object.assign(window, {geomtnry, textures, material, canvas, renderer, camera, sphere, spheres, light, hlight, scene, THREE, canvSrc})