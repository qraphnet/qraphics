export class ScaleAdjustment {
  readonly buffer: GPUBuffer;
  
  constructor(canvas: HTMLCanvasElement, device: GPUDevice) {
    const scaling = new Float32Array([1.0, 1.0]);
    
    const scalingBuffer = device.createBuffer({
      label: 'scaling buffer',
      size : scaling.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const canvas  = entry.target as HTMLCanvasElement;
        const width   = entry.contentBoxSize[0].inlineSize;
        const height  = entry.contentBoxSize[0].blockSize;
        canvas.width  = Math.max(1, width);
        canvas.height = Math.max(1, height);
        
        const min  = Math.min(width, height);
        scaling[0] = min / width;
        scaling[1] = min / height;
      }
      
      if (entries.length > 0) {
        device.queue.writeBuffer(scalingBuffer, 0, scaling);
      }
    });
    observer.observe(canvas);
    
    this.buffer = scalingBuffer;
  }
}
