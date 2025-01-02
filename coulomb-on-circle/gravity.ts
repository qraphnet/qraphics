export class Gravity {
  readonly buffer: GPUBuffer;
  
  constructor(device: GPUDevice) {
    this.buffer = device.createBuffer({
      label: 'gravity buffer',
      size : 2 * 4,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    
    // // @ts-ignore
    // document.addEventListener('devicemotion', (event: DeviceMotionEvent) => {
    //   const { x, y } = event.accelerationIncludingGravity;
    //   device.queue.writeBuffer(this.buffer, 0, new Float32Array([x, y]));
    // });
  }
}

interface DeviceMotionEvent {
  acceleration: { x: number; y: number; z: number };
  accelerationIncludingGravity: { x: number; y: number; z: number };
}