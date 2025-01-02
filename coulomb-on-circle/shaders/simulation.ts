import { Gravity }  from '../gravity.ts';
import stepShader   from './runge-kutta-steps.wgsl?raw';
import updateShader from './runge-kutta-update.wgsl?raw';

const FPS = 30;

export class Simulation {
  private n_max: number;
  private n: number;
  
  private step1Pipeline: GPUComputePipeline;
  private step23Pipeline: GPUComputePipeline;
  private step4Pipeline: GPUComputePipeline;
  private updatePipeline: GPUComputePipeline;
  
  private stateBuffer: GPUBuffer;
  private kBuffer: GPUBuffer;
  private nBuffer: GPUBuffer;
  
  private stepBindGroup: GPUBindGroup;
  private uniformBindGroup: GPUBindGroup;
  private updateBindGroup: GPUBindGroup;
  
  get buffer() {
    return this.stateBuffer;
  }
  
  get num() {
    return this.n;
  }
  
  constructor(readonly device: GPUDevice, gravity: Gravity) {
    const n_max = 32;
    const n     = 0;
    
    const stepModule   = device.createShaderModule({
      label: 'shader of stepping of runge-kutta method',
      code : stepShader,
    });
    const updateModule = device.createShaderModule({
      label: 'shader of updating of runge-kutta method',
      code : updateShader,
    });
    
    const uniformBindGroupLayout = device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } },
        { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } },
      ],
    });
    const stepPipelineLayout     = device.createPipelineLayout({
      bindGroupLayouts: [
        device.createBindGroupLayout({
          entries: [
            { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } },
            {
              binding   : 1,
              visibility: GPUShaderStage.COMPUTE,
              buffer    : { type: 'storage', hasDynamicOffset: true },
            },
            { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage', hasDynamicOffset: true } },
          ],
        }),
        uniformBindGroupLayout,
      ],
    });
    
    this.step1Pipeline = device.createComputePipeline({
      label  : 'runge kutta 1 pipeline',
      layout : stepPipelineLayout,
      compute: {
        module   : stepModule,
        constants: { weight: 0.0 },
      },
    });
    
    this.step23Pipeline = device.createComputePipeline({
      label  : 'runge kutta 2, 3 pipeline',
      layout : stepPipelineLayout,
      compute: {
        module   : stepModule,
        constants: { weight: 0.5 / FPS },
      },
    });
    
    this.step4Pipeline = device.createComputePipeline({
      label  : 'runge kutta 4 pipeline',
      layout : stepPipelineLayout,
      compute: {
        module   : stepModule,
        constants: { weight: 1.0 / FPS },
      },
    });
    
    this.updatePipeline = device.createComputePipeline({
      label  : 'runge kutta update pipeline',
      layout : 'auto',
      compute: {
        module   : updateModule,
        constants: { interval: 1 / FPS },
      },
    });
    
    const stateSize  = 2 * 4 * n_max;
    this.stateBuffer = device.createBuffer({
      label: 'angle buffer',
      size : stateSize,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
    });
    
    this.kBuffer = device.createBuffer({
      label: 'k buffer',
      size : 4 * stateSize,
      usage: GPUBufferUsage.STORAGE,
    });
    
    this.nBuffer = device.createBuffer({
      label: 'uniform `n` buffer',
      size : 4,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    
    this.stepBindGroup = device.createBindGroup({
      label  : 'step 1 bind group',
      layout : this.step1Pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: this.stateBuffer } },
        { binding: 1, resource: { buffer: this.kBuffer, size: stateSize } },
        { binding: 2, resource: { buffer: this.kBuffer, size: stateSize } },
      ],
    });
    
    this.uniformBindGroup = device.createBindGroup({
      label  : 'uniform bind group',
      layout : uniformBindGroupLayout,
      entries: [
        { binding: 0, resource: { buffer: this.nBuffer } },
        { binding: 1, resource: { buffer: gravity.buffer } },
      ],
    });
    
    this.updateBindGroup = device.createBindGroup({
      label  : 'update bind group',
      layout : this.updatePipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: this.stateBuffer } },
        { binding: 1, resource: { buffer: this.kBuffer, offset: 0 * stateSize, size: stateSize } },
        { binding: 2, resource: { buffer: this.kBuffer, offset: 1 * stateSize, size: stateSize } },
        { binding: 3, resource: { buffer: this.kBuffer, offset: 2 * stateSize, size: stateSize } },
        { binding: 4, resource: { buffer: this.kBuffer, offset: 3 * stateSize, size: stateSize } },
      ],
    });
    
    this.n_max = n_max;
    this.n     = n;
  }
  
  encodeTo(pass: GPUComputePassEncoder) {
    const stateSize = 2 * 4 * this.n_max;
    
    pass.setPipeline(this.step1Pipeline);
    pass.setBindGroup(0, this.stepBindGroup, [3 * stateSize, 0 * stateSize]);
    pass.setBindGroup(1, this.uniformBindGroup);
    pass.dispatchWorkgroups(this.n);
    
    pass.setPipeline(this.step23Pipeline);
    pass.setBindGroup(0, this.stepBindGroup, [0 * stateSize, 1 * stateSize]);
    pass.setBindGroup(1, this.uniformBindGroup);
    pass.dispatchWorkgroups(this.n);
    
    pass.setBindGroup(0, this.stepBindGroup, [1 * stateSize, 2 * stateSize]);
    pass.dispatchWorkgroups(this.n);
    
    pass.setPipeline(this.step4Pipeline);
    pass.setBindGroup(0, this.stepBindGroup, [2 * stateSize, 3 * stateSize]);
    pass.setBindGroup(1, this.uniformBindGroup);
    pass.dispatchWorkgroups(this.n);
    
    pass.setPipeline(this.updatePipeline);
    pass.setBindGroup(0, this.updateBindGroup);
    pass.setBindGroup(1, this.uniformBindGroup);
    pass.dispatchWorkgroups(this.n * 2);
  }
  
  incrementBall(angle: number) {
    const n = this.n + 1;
    
    let promise = Promise.resolve(void 0);
    if (n > this.n_max) {
      this.n_max *= 2;
      
      const stateSize = 2 * 4 * this.n_max;
      
      const currentStateBuffer = this.stateBuffer;
      this.stateBuffer         = this.device.createBuffer({
        label: 'angle buffer',
        size : stateSize,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
      });
      {
        const encoder = this.device.createCommandEncoder();
        encoder.copyBufferToBuffer(currentStateBuffer, 0, this.stateBuffer, 0, stateSize / 2);
        const command = encoder.finish();
        this.device.queue.submit([command]);
        promise = this.device.queue.onSubmittedWorkDone();
      }
      
      this.kBuffer = this.device.createBuffer({
        label: 'k buffer',
        size : 4 * stateSize,
        usage: GPUBufferUsage.STORAGE,
      });
      
      this.stepBindGroup = this.device.createBindGroup({
        layout : this.step1Pipeline.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: { buffer: this.stateBuffer } },
          { binding: 1, resource: { buffer: this.kBuffer, size: stateSize } },
          { binding: 2, resource: { buffer: this.kBuffer, size: stateSize } },
        ],
      });
      
      this.updateBindGroup = this.device.createBindGroup({
        layout : this.updatePipeline.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: { buffer: this.stateBuffer } },
          { binding: 1, resource: { buffer: this.kBuffer, offset: 0 * stateSize, size: stateSize } },
          { binding: 2, resource: { buffer: this.kBuffer, offset: 1 * stateSize, size: stateSize } },
          { binding: 3, resource: { buffer: this.kBuffer, offset: 2 * stateSize, size: stateSize } },
          { binding: 4, resource: { buffer: this.kBuffer, offset: 3 * stateSize, size: stateSize } },
        ],
      });
    }
    
    promise.then(async () => {
      this.device.queue.writeBuffer(this.stateBuffer, 2 * 4 * (n - 1), new Float32Array([angle, 0]));
      await this.device.queue.onSubmittedWorkDone();
      this.device.queue.writeBuffer(this.nBuffer, 0, new Uint32Array([n]));
      await this.device.queue.onSubmittedWorkDone();
      this.n = n;
    });
  }
}