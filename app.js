import * as THREE from 'three'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls'
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader' 
import GUI from 'lil-gui'
import gsap from 'gsap'
import fragmentShader from './shaders/fragment.glsl'
import vertexShader from './shaders/vertex.glsl'
 
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer'
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass'
import {ShaderPass} from 'three/examples/jsm/postprocessing/ShaderPass'
import {GlitchPass} from 'three/examples/jsm/postprocessing/GlitchPass'

import model from './face_mesh_v030.glb'

 


export default class Sketch {
	constructor(options) {
		
		this.scene = new THREE.Scene()
		
		this.container = options.dom
		
		this.width = this.container.offsetWidth
		this.height = this.container.offsetHeight
		
		
		// // for renderer { antialias: true }
		this.renderer = new THREE.WebGLRenderer({ antialias: true })
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
		this.renderTarget = new THREE.WebGLRenderTarget(this.width, this.height)
		this.renderer.setSize(this.width ,this.height )
		this.renderer.setClearColor(0xeeeeee, 1)
		this.renderer.useLegacyLights = true
		// this.renderer.outputEncoding = THREE.sRGBEncoding
 

		 
		this.renderer.setSize( window.innerWidth, window.innerHeight )

		this.container.appendChild(this.renderer.domElement)
 


		this.camera = new THREE.PerspectiveCamera( 70,
			 this.width / this.height,
			 0.01,
			 5
		)
 
		this.camera.position.set(0, 0, 2) 
		this.controls = new OrbitControls(this.camera, this.renderer.domElement)
		this.time = 0


		this.dracoLoader = new DRACOLoader()
		this.dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/')
		this.gltf = new GLTFLoader()
		this.gltf.setDRACOLoader(this.dracoLoader)

		this.isPlaying = true




		this.gltf.load(model, (gltf) => {
			this.model = gltf.scene.children[0]
		 
			let s = 0.03
			this.model.scale.set(s,s,s)

			this.model.traverse(o => {
	 
				if(o.isMesh) {
					o.material = new THREE.MeshBasicMaterial({color: 0x00ff00})
				}
			})
			this.model.position.set(0, -.08, 0)
			this.scene.add(this.model)
			this.addObjects()		 
			this.resize()
			this.render()
			this.setupResize()
	
		})

	 
 
	}

	settings() {
		let that = this
		this.settings = {
			progress: 0
		}
		this.gui = new GUI()
		this.gui.add(this.settings, 'progress', 0, 1, 0.01)
	}

	setupResize() {
		window.addEventListener('resize', this.resize.bind(this))
	}

	resize() {
		this.width = this.container.offsetWidth
		this.height = this.container.offsetHeight
		this.renderer.setSize(this.width, this.height)
		this.camera.aspect = this.width / this.height


		this.imageAspect = 853/1280
		let a1, a2
		if(this.height / this.width > this.imageAspect) {
			a1 = (this.width / this.height) * this.imageAspect
			a2 = 1
		} else {
			a1 = 1
			a2 = (this.height / this.width) / this.imageAspect
		} 


		this.material.uniforms.resolution.value.x = this.width
		this.material.uniforms.resolution.value.y = this.height
		this.material.uniforms.resolution.value.z = a1
		this.material.uniforms.resolution.value.w = a2

		this.camera.updateProjectionMatrix()



	}


	addObjects() {
		let that = this
		this.material = new THREE.ShaderMaterial({
			extensions: {
				derivatives: '#extension GL_OES_standard_derivatives : enable'
			},
			side: THREE.DoubleSide,
			uniforms: {
				time: {value: 0},
				depthInfo: {value: null},
				cameraNear: {value: this.camera.near},
				cameraFar: {value: this.camera.far},

				resolution: {value: new THREE.Vector4()}
			},
			vertexShader,
			fragmentShader
		})
		
		this.geometry = new THREE.PlaneGeometry(1,1,1,1)

		this.geometry1 = new THREE.PlaneGeometry(1, 0.01, 100, 1)
		let number = 20
		// for (let i = 0; i < number; i++) {
		// 	let mesh = new THREE.Mesh(this.geometry1, this.material)

		// 	mesh.position.y = (i - number / 2) / number 
		// 	this.scene.add(mesh)
			
		// }

		this.plane = new THREE.Mesh(this.geometry, this.material)
 
		this.scene.add(this.plane)


		this.target = new THREE.WebGLRenderTarget(this.width, this.height)
		this.target.texture.flipY = THREE.RGBFormat
		this.target.texture.minFilter = THREE.NearestFilter
		this.target.texture.magFilter = THREE.NearestFilter
		this.target.texture.generateMipmaps = false
		this.target.stencilBuffer = false
		this.target.depthBuffer = true
		this.target.depthTexture = new THREE.DepthTexture()
		// this.target.depthTexture.format = THREE.UnsignedShortType
		this.target.depthTexture.type = THREE.DepthFormat



 
	}



	addLights() {
		const light1 = new THREE.AmbientLight(0xeeeeee, 0.5)
		this.scene.add(light1)
	
	
		const light2 = new THREE.DirectionalLight(0xeeeeee, 0.5)
		light2.position.set(0.5,0,0.866)
		this.scene.add(light2)
	}

	stop() {
		this.isPlaying = false
	}

	play() {
		if(!this.isPlaying) {
			this.isPlaying = true
			this.render()
		}
	}

	render() {
		if(!this.isPlaying) return
		this.time += 0.05
		// this.material.uniforms.time.value = this.time


		 
		//this.renderer.setRenderTarget(this.renderTarget)
		// this.renderer.render(this.scene, this.camera)
		//this.renderer.setRenderTarget(null)
		this.renderer.setRenderTarget(this.target)
		this.renderer.render(this.scene, this.camera)
		requestAnimationFrame(this.render.bind(this))

		this.material.uniforms.depthInfo.value = this.target.texture
		this.renderer.setRenderTarget(null)
		this.renderer.render(this.scene, this.camera)
	}
 
}
new Sketch({
	dom: document.getElementById('container')
})
 