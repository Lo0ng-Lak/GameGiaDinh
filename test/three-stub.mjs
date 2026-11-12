// Stub cho 'three' — chỉ đủ để code game chạy được trong Node (test logic,
// không render thật). Mọi phương thức vẽ đều là no-op; chỉ giữ lại trạng thái
// mà game logic đọc/ghi (position, visible, children, material.color...).
// File này chỉ dùng cho test, KHÔNG đi vào bundle game.

class Vec3 {
  constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
  set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
  setScalar(s) { this.x = s; this.y = s; this.z = s; return this; }
  copy(v) { this.x = v.x; this.y = v.y; this.z = v.z; return this; }
  clone() { return new Vec3(this.x, this.y, this.z); }
  add(v) { this.x += v.x; this.y += v.y; this.z += v.z; return this; }
  sub(v) { this.x -= v.x; this.y -= v.y; this.z -= v.z; return this; }
  addScaledVector(v, s) { this.x += v.x * s; this.y += v.y * s; this.z += v.z * s; return this; }
  multiplyScalar(s) { this.x *= s; this.y *= s; this.z *= s; return this; }
  dot(v) { return this.x * v.x + this.y * v.y + this.z * v.z; }
  cross(v) { const x = this.y * v.z - this.z * v.y, y = this.z * v.x - this.x * v.z, z = this.x * v.y - this.y * v.x; this.x = x; this.y = y; this.z = z; return this; }
  lerp(v, t) { this.x += (v.x - this.x) * t; this.y += (v.y - this.y) * t; this.z += (v.z - this.z) * t; return this; }
  applyEuler() { return this; } applyQuaternion() { return this; } applyMatrix4() { return this; }
  setFromMatrixPosition() { return this; }
  length() { return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z); }
  normalize() { const l = this.length() || 1; return this.multiplyScalar(1 / l); }
  distanceTo(v) { const dx = this.x - v.x, dy = this.y - v.y, dz = this.z - v.z; return Math.sqrt(dx * dx + dy * dy + dz * dz); }
}
class Euler extends Vec3 {
  set(x, y, z) { return super.set(x, y, z); }
  copy(v) { this.x = v.x; this.y = v.y; this.z = v.z; return this; }
}
class Color {
  constructor(hex) { this.hex = hex == null ? 0xffffff : hex; }
  setHex(h) { this.hex = h; return this; }
  set(v) { this.hex = typeof v === 'number' ? v : (v && v.hex != null ? v.hex : this.hex); return this; }
  copy(c) { this.hex = c && c.hex != null ? c.hex : this.hex; return this; }
  lerp(c, t) { return this; }
  setHSL() { return this; }
  setRGB() { return this; }
  clone() { return new Color(this.hex); }
  getHex() { return this.hex; }
}
class Base {
  constructor() {
    this.children = []; this.userData = {}; this.visible = true; this.name = '';
    this.position = new Vec3(); this.rotation = new Euler(); this.scale = new Vec3(1, 1, 1);
    this.material = null; this.geometry = null; this.castShadow = false; this.receiveShadow = false;
    this.frustumCulled = true; this.renderOrder = 0;
  }
  add(c) { this.children.push(c); return this; }
  remove(c) { const i = this.children.indexOf(c); if (i >= 0) this.children.splice(i, 1); return this; }
  updateMatrix() { return this; }
  updateMatrixWorld() { return this; }
  getObjectByName(name) {
    if (this.name === name) return this;
    for (const c of this.children) { const f = c.getObjectByName && c.getObjectByName(name); if (f) return f; }
    return null;
  }
  getObjectById(id) {
    if (this.id === id) return this;
    for (const c of this.children) { const f = c.getObjectById && c.getObjectById(id); if (f) return f; }
    return null;
  }
  traverse(fn) { fn(this); this.children.forEach((c) => c.traverse && c.traverse(fn)); }
  lookAt() { return this; }
  clone() { const c = new this.constructor(); c.position.copy(this.position); c.rotation.copy(this.rotation); c.scale.copy(this.scale); return c; }
}
class Mesh extends Base {
  constructor(geo, mat) { super(); this.geometry = geo || null; this.material = mat || null; }
}
class Group extends Base {}
class Scene extends Base {
  constructor() { super(); this.background = null; this.fog = null; }
}
class Object3D extends Base {}
class PerspectiveCamera extends Base {
  constructor(fov, aspect, near, far) { super(); this.fov = fov; this.aspect = aspect; this.near = near; this.far = far; }
  updateProjectionMatrix() {}
}
class Light extends Base {
  constructor(color, intensity) { super(); this.color = new Color(color); this.intensity = intensity; this.castShadow = false; }
}
class HemisphereLight extends Light {}
class DirectionalLight extends Light {
  constructor(color, intensity) {
    super(color, intensity);
    this.shadow = { mapSize: { set() {} }, camera: { left: 0, right: 0, top: 0, bottom: 0, far: 100, updateProjectionMatrix() {} }, bias: 0, normalBias: 0 };
    this.target = new Base();
  }
}
class PointLight extends Light {}
class Geometry extends Base {
  constructor() { super(); this.attributes = {}; this.index = null; }
  setAttribute(name, attr) { this.attributes[name] = attr; return this; }
  setIndex(idx) { this.index = idx; return this; }
  setFromPoints() { return this; }
  computeVertexNormals() { return this; }
  computeBoundingBox() { return this; }
  computeBoundingSphere() { return this; }
  rotateX() { return this; } rotateY() { return this; } rotateZ() { return this; }
  translate() { return this; } scale() { return this; }
}
class BufferGeometry extends Geometry {}
class BoxGeometry extends Geometry { constructor() { super(); } }
class SphereGeometry extends Geometry { constructor() { super(); } }
class ConeGeometry extends Geometry { constructor() { super(); } }
class CylinderGeometry extends Geometry { constructor() { super(); } }
class PlaneGeometry extends Geometry { constructor() { super(); } }
class CircleGeometry extends Geometry { constructor() { super(); } }
class RingGeometry extends Geometry { constructor() { super(); } }
class TorusGeometry extends Geometry { constructor() { super(); } }
class DodecahedronGeometry extends Geometry { constructor() { super(); } }
class ExtrudeGeometry extends Geometry { constructor() { super(); } }
class BufferAttribute {
  constructor(array, itemSize) { this.array = array; this.itemSize = itemSize; this.count = array ? array.length / itemSize : 0; this.needsUpdate = false; }
  setUsage() { return this; }
  setXYZ() { return this; } setXY() { return this; } setX() { return this; } setY() { return this; } setZ() { return this; }
  getX() { return 0; } getY() { return 0; } getZ() { return 0; }
}
class Material {
  constructor(params) {
    this.color = new Color(0xffffff); this.transparent = false; this.opacity = 1;
    this.side = 0; this.fog = true; this.depthWrite = true;
    if (params) Object.assign(this, params);
    if (params && params.color != null) this.color = new Color(params.color);
  }
  clone() { return new Material({ color: this.color.hex }); }
}
class MeshBasicMaterial extends Material {}
class MeshLambertMaterial extends Material {}
class MeshPhongMaterial extends Material {}
class LineBasicMaterial extends Material {}
class SpriteMaterial extends Material {}
class PointsMaterial extends Material {}
class ShaderMaterial extends Material {
  constructor(params) { super(params); this.uniforms = (params && params.uniforms) || {}; this.vertexShader = ''; this.fragmentShader = ''; }
}
class Texture {
  constructor() { this.wrapS = 0; this.wrapT = 0; this.repeat = { set() {} }; this.offset = { set() {} }; this.needsUpdate = false; }
}
class CanvasTexture extends Texture { constructor(canvas) { super(); this.image = canvas; } }
class TextureLoader {
  load() { return new Texture(); }
}
class Sprite extends Base { constructor(mat) { super(); this.material = mat || null; } }
class Points extends Base { constructor(geo, mat) { super(); this.geometry = geo; this.material = mat; } }
class Line extends Base { constructor(geo, mat) { super(); this.geometry = geo; this.material = mat; } }
class InstancedMesh extends Mesh {
  constructor(geo, mat, count) { super(geo, mat); this.count = count; this.instanceMatrix = { needsUpdate: false }; }
  setMatrixAt() {}
  getMatrixAt() { return null; }
  setColorAt() {}
}
class Shape extends Base {
  moveTo() { return this; } lineTo() { return this; } absarc() { return this; }
  closePath() { return this; } bezierCurveTo() { return this; }
  quadraticCurveTo() { return this; } ellipse() { return this; }
}
class Fog {
  constructor(color, near, far) { this.color = new Color(color); this.near = near; this.far = far; }
}
class Clock {
  constructor() { this._t = 0; }
  getDelta() { return 0.016; }
  getElapsedTime() { this._t += 0.016; return this._t; }
  start() {} stop() {}
}
class WebGLRenderer {
  constructor() {
    this.domElement = (typeof globalThis !== 'undefined' && globalThis.document)
      ? globalThis.document.createElement('canvas')
      : { style: {}, addEventListener() {} };
    this.shadowMap = { enabled: false, type: 0 };
    this.outputEncoding = 0; this.toneMapping = 0; this.toneMappingExposure = 1;
  }
  setSize() {} setPixelRatio() {} render() {} setClearColor() {} setAnimation() {}
  getSize() { return { x: 1280, y: 720 }; }
}
class Raycaster {
  constructor() { this.ray = { origin: new Vec3(), direction: new Vec3() }; }
  set() {} setFromCamera() {} intersectObject() { return []; } intersectObjects() { return []; }
}

export {
  Vec3 as Vector3, Euler, Color, Mesh, Group, Scene, Object3D, PerspectiveCamera,
  HemisphereLight, DirectionalLight, PointLight,
  BufferGeometry, BufferAttribute, BoxGeometry, SphereGeometry, ConeGeometry,
  CylinderGeometry, PlaneGeometry, CircleGeometry, RingGeometry, TorusGeometry,
  DodecahedronGeometry, ExtrudeGeometry,
  MeshBasicMaterial, MeshLambertMaterial, MeshPhongMaterial, LineBasicMaterial,
  SpriteMaterial, PointsMaterial, ShaderMaterial, CanvasTexture, TextureLoader,
  Sprite, Points, Line, InstancedMesh, Shape, Fog, Clock, WebGLRenderer, Raycaster,
};

// Hằng số (chỉ cần khác nhau về giá trị, game không so sánh chính xác)
export const sRGBEncoding = 3001;
export const ACESFilmicToneMapping = 4;
export const PCFSoftShadowMap = 2;
export const BackSide = 1;
export const DoubleSide = 2;
export const FrontSide = 0;
export const RepeatWrapping = 1000;
export const AdditiveBlending = 2;
export const NormalBlending = 1;
export const LinearFilter = 1006;
export const NearestFilter = 1003;

export default {
  Vector3: Vec3, Euler, Color, Mesh, Group, Scene, Object3D, PerspectiveCamera,
  HemisphereLight, DirectionalLight, PointLight,
  BufferGeometry, BufferAttribute, BoxGeometry, SphereGeometry, ConeGeometry,
  CylinderGeometry, PlaneGeometry, CircleGeometry, RingGeometry, TorusGeometry,
  DodecahedronGeometry, ExtrudeGeometry,
  MeshBasicMaterial, MeshLambertMaterial, MeshPhongMaterial, LineBasicMaterial,
  SpriteMaterial, PointsMaterial, ShaderMaterial, CanvasTexture, TextureLoader,
  Sprite, Points, Line, InstancedMesh, Shape, Fog, Clock, WebGLRenderer, Raycaster,
  sRGBEncoding, ACESFilmicToneMapping, PCFSoftShadowMap, BackSide, DoubleSide,
  FrontSide, RepeatWrapping, AdditiveBlending, NormalBlending, LinearFilter, NearestFilter,
};
