import * as THREE from 'three'
import * as dat from 'dat.gui'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import gsap from 'gsap'

// 1-3: Scene
const scene = new THREE.Scene()

// 2-3: Camera
const camera = new THREE.PerspectiveCamera(
  75,
  innerWidth / innerHeight,
  10,
  200
)
camera.position.z = 25
camera.position.y = -13

// 3-3: Renderer
const renderer = new THREE.WebGLRenderer()
renderer.setSize(innerWidth, innerHeight)
renderer.setPixelRatio(devicePixelRatio)
document.body.appendChild(renderer.domElement)

// Plane Colors
const initialColor = {
  r: 0,
  g: 0.19,
  b: 0.4,
}
const hoverColor = {
  r: 0.1,
  g: 0.5,
  b: 1,
}

// Plane Parameters
const world = {
  plane: {
    width: 150,
    height: 150,
    widthSegments: 100,
    heightSegments: 100,
  },
}

// Create a plane
const planeGeometry = new THREE.PlaneGeometry(
  world.plane.width,
  world.plane.height,
  world.plane.widthSegments,
  world.plane.heightSegments
)
const planeMaterial = new THREE.MeshPhongMaterial({
  // color: 0xff0000,
  // side: THREE.DoubleSide, // optional: needs bottom light
  flatShading: true,
  vertexColors: true, // to change with attributes
})
const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial)
scene.add(planeMesh)

// Lighting
const light = new THREE.DirectionalLight(0xffffff, 1)
light.position.set(0, 0, 1)
scene.add(light)

function modifyPlaneSurface(mesh: THREE.Mesh) {
  const vertexArray = mesh.geometry.attributes.position.array
  const randomStepArray = []

  for (let i = 0; i < vertexArray.length; i++) {
    //@ts-ignore
    vertexArray[i] += Math.random() - 0.5
    randomStepArray.push(Math.random() - 0.5)
  }

  // @ts-ignore
  mesh.geometry.attributes.position.randomStepArray = randomStepArray
  // @ts-ignore
  mesh.geometry.attributes.position.originalArray = [...vertexArray]

  // changing vertexColors
  const colors = []
  for (let i = 0; i < mesh.geometry.attributes.position.count; i++) {
    colors.push(initialColor.r, initialColor.g, initialColor.b)
  }
  mesh.geometry.setAttribute(
    'color',
    new THREE.BufferAttribute(new Float32Array(colors), 3)
  )
}
modifyPlaneSurface(planeMesh)

// Dat.GUI
const gui = new dat.GUI()

gui.add(world.plane, 'width', 1, 300, 1).onChange(generatePlane)
gui.add(world.plane, 'height', 1, 300, 1).onChange(generatePlane)
gui.add(world.plane, 'widthSegments', 1, 300, 1).onChange(generatePlane)
gui.add(world.plane, 'heightSegments', 1, 300, 1).onChange(generatePlane)

function generatePlane() {
  planeMesh.geometry.dispose()
  planeMesh.geometry = new THREE.PlaneGeometry(
    world.plane.width,
    world.plane.height,
    world.plane.widthSegments,
    world.plane.heightSegments
  )
  modifyPlaneSurface(planeMesh)
}

// Controls camera orientation with mouse
new OrbitControls(camera, renderer.domElement)

// Raycaster: Projects the mouse in the scene
const raycaster = new THREE.Raycaster()

// Store mouse position
type Mouse = {
  normalizedX: number
  normalizedY: number
}
const mouse: Mouse = {
  normalizedX: undefined as unknown as number,
  normalizedY: undefined as unknown as number,
}

// Update mouse coordinates
addEventListener('mousemove', (event) => {
  mouse.normalizedX = (2 * event.clientX) / innerWidth - 1
  mouse.normalizedY = (-2 * event.clientY) / innerHeight + 1
})
let previousTimestamp = 0
// Animating
function animate(timestamp: number) {
  requestAnimationFrame(animate)

  if (timestamp - previousTimestamp < 1000 / 30) return

  previousTimestamp = timestamp

  renderer.render(scene, camera)
  raycaster.setFromCamera(
    { x: mouse.normalizedX, y: mouse.normalizedY },
    camera
  )

  // @ts-ignore
  const { array, originalArray, randomStepArray } =
    planeMesh.geometry.attributes.position

  for (let i = 0; i < array.length; i += 3) {
    // @ts-ignore
    array[i] =
      originalArray[i] + Math.cos(timestamp * 0.001 + randomStepArray[i])

    // @ts-ignore
    array[i + 1] =
      originalArray[i + 1] +
      Math.sin(timestamp * 0.001 + randomStepArray[i + 1])

    planeMesh.geometry.attributes.position.needsUpdate = true
  }

  const planeIntersection = raycaster.intersectObject(planeMesh)
  if (planeIntersection.length > 0) {
    // @ts-ignore
    const { color } = planeIntersection[0].object.geometry.attributes

    // 1 face = 3 vertices
    // @ts-ignore
    const { a, b, c } = planeIntersection[0].face

    // // vertices A, B and C
    color.setX(a, 0.1) // R
    color.setY(a, 0.5) // G
    color.setZ(a, 1) // B

    color.setX(b, 0.1) // R
    color.setY(b, 0.5) // G
    color.setZ(b, 1) // B

    color.setX(c, 0.1) // R
    color.setY(c, 0.5) // G
    color.setZ(c, 1) // B

    // // @ts-ignore
    color.needsUpdate = true

    const newHoverColor = { ...hoverColor }
    gsap.to(newHoverColor, {
      ...initialColor,
      duration: 1,
      onUpdate: () => {
        color.setX(a, newHoverColor.r) // R
        color.setY(a, newHoverColor.g) // G
        color.setZ(a, newHoverColor.b) // B

        color.setX(b, newHoverColor.r) // R
        color.setY(b, newHoverColor.g) // G
        color.setZ(b, newHoverColor.b) // B

        color.setX(c, newHoverColor.r) // R
        color.setY(c, newHoverColor.g) // G
        color.setZ(c, newHoverColor.b) // B

        // @ts-ignore
        color.needsUpdate = true
      },
    })
  }
}
requestAnimationFrame(animate)
