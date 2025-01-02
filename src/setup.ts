type GpuState =
  | { state: 'invalid'; device?: undefined; presentationFormat?: undefined }
  | { state: 'valid'; device: GPUDevice; presentationFormat: GPUTextureFormat; }
  ;

export async function setupGpu(): Promise<GpuState> {
  const adapter = await navigator.gpu?.requestAdapter();
  if (adapter == null) {
    console.warn('The browser doesn\'t support Web GPU.');
    return { state: 'invalid' };
  }
  
  const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
  const device             = await adapter.requestDevice();
  
  return { state: 'valid', device, presentationFormat };
}

type CanvasState =
  | { state: 'invalid'; canvas?: undefined; overlay?: undefined; context?: undefined }
  | { state: 'valid'; canvas: HTMLCanvasElement; overlay: HTMLCanvasElement; context: GPUCanvasContext }
  ;

export function setupCanvas(): CanvasState {
  const canvas = document.querySelector<HTMLCanvasElement>('#canvas')!;
  const overlay = document.querySelector<HTMLCanvasElement>('#overlay')!;
  
  const context = canvas.getContext('webgpu');
  if (context == null) {
    console.warn('Can\'t get webgpu context.');
    return { state: 'invalid' };
  }
  
  return { state: 'valid', canvas, overlay, context };
}
