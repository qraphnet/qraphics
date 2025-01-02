export class BallObject {
  readonly vertices: Float32Array;
  readonly indices: Uint32Array;
  verticesBuffer: GPUBuffer | undefined;
  indicesBuffer: GPUBuffer | undefined;
  
  constructor(subdivision: number) {
    const ballVertices: number[] = [];
    ballVertices.push(...[0.0, 0.0]);
    for (let i = 0; i < subdivision; i++) {
      const angle = 2 * Math.PI * i / subdivision;
      ballVertices.push(...[Math.cos(angle), Math.sin(angle)]);
    }
    const ballIndices = [];
    for (let i = 0; i < subdivision; i++) {
      ballIndices.push(...[0, 1 + i, 1 + (i + 1) % subdivision]);
    }
    this.vertices = new Float32Array(ballVertices);
    this.indices  = new Uint32Array(ballIndices);
  }
  
  into(device: GPUDevice): BallObjectAdded {
    const verticesBuffer = device.createBuffer({
      label: 'ball vertex buffer',
      size : this.vertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(verticesBuffer, 0, this.vertices);
    
    const indicesBuffer = device.createBuffer({
      label: 'ball index buffer',
      size : this.indices.byteLength,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(indicesBuffer, 0, this.indices);
    
    return { verticesBuffer, indicesBuffer, numIndices: this.indices.length };
  }
}

export type BallObjectAdded = {
  verticesBuffer: GPUBuffer;
  indicesBuffer: GPUBuffer;
  numIndices: number;
}