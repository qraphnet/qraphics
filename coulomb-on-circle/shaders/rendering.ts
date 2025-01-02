import { BallObjectAdded } from '../ball.ts';
import { ScaleAdjustment } from '../scaling.ts';
import shader              from './rendering.wgsl?raw';

export class Rendering {
  private pipeline: GPURenderPipeline;
  private bindGroup: GPUBindGroup;
  
  constructor(device: GPUDevice, format: GPUTextureFormat, scaleAdjustment: ScaleAdjustment) {
    const module = device.createShaderModule({
      label: 'drawing shader',
      code : shader,
    });
    
    this.pipeline = device.createRenderPipeline({
      label   : 'plotting balls on a circle',
      layout  : 'auto',
      vertex  : {
        module,
        buffers: [
          {
            arrayStride: 2 * 4,
            stepMode   : 'instance',
            attributes : [
              { shaderLocation: 0, offset: 0, format: 'float32' },
            ],
          },
          {
            arrayStride: 2 * 4,
            attributes : [
              { shaderLocation: 1, offset: 0, format: 'float32x2' },
            ],
          },
        ],
      },
      fragment: {
        module,
        targets: [
          {
            format,
            blend: {
              color: {
                srcFactor: 'one',
                dstFactor: 'one',
                operation: 'min',
              },
              alpha: {
                srcFactor: 'one',
                dstFactor: 'one',
                operation: 'max',
              },
            },
          },
        ],
      },
    });
    
    this.bindGroup = device.createBindGroup({
      layout : this.pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: scaleAdjustment.buffer } },
      ],
    });
  }
  
  encodeTo(pass: GPURenderPassEncoder, states: GPUBuffer, ball: BallObjectAdded, n: number) {
    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, this.bindGroup);
    pass.setVertexBuffer(0, states);
    pass.setVertexBuffer(1, ball.verticesBuffer);
    pass.setIndexBuffer(ball.indicesBuffer, 'uint32');
    pass.drawIndexed(ball.numIndices, n);
  }
}