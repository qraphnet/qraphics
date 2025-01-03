export class Gravity {
  readonly buffer: GPUBuffer;
  
  constructor(device: GPUDevice) {
    this.buffer = device.createBuffer({
      label: 'gravity buffer',
      size : 2 * 4,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    
    if (DeviceMotionEvent == null) return;
    
    const handler = (event: DeviceMotionEvent) => {
      const { x, y } = event.accelerationIncludingGravity!;
      if (x == null || y == null) return;
      device.queue.writeBuffer(this.buffer, 0, new Float32Array([x / 100, y / 100]));
    };
    
    if ('requestPermission' in DeviceMotionEvent && 'function' === typeof DeviceMotionEvent.requestPermission) {
      (DeviceMotionEvent.requestPermission() as Promise<'granted' | 'denied'>).then(result => {
        if (result === 'granted') {
          // @ts-ignore
          document.addEventListener('devicemotion', handler);
        }
      });
    } else {
      // @ts-ignore
      document.addEventListener('devicemotion', handler);
    }
  }
}
