import './style.css';
import { BallObject }            from './ball.ts';
import { Gravity }               from './gravity.ts';
import { ScaleAdjustment }       from './scaling.ts';
import { setupCanvas, setupGpu } from './setup.ts';
import { Rendering }             from './shaders/rendering.ts';
import { Simulation }            from './shaders/simulation.ts';

(async () => {
  const { state, device, presentationFormat } = await setupGpu();
  if (state === 'invalid') {
    // TODO
  } else {
    const { state, canvas, overlay, context } = setupCanvas();
    if (state === 'invalid') {
      // TODO
    } else {
      context.configure({ device, format: presentationFormat });
      
      const ball = new BallObject(16).into(device);
      
      const scaling = new ScaleAdjustment(canvas, device);
      const gravity = new Gravity(device);
      
      const rendering = new Rendering(device, presentationFormat, scaling);
      
      const simulation = new Simulation(device, gravity);
      
      overlay.addEventListener('click', (ev) => {
        const x = ev.offsetX - overlay.offsetWidth / 2;
        const y = -(ev.offsetY - overlay.offsetHeight / 2);
        simulation.incrementBall(Math.atan2(y, x));
      });
      
      function render() {
        const renderPassDescriptor: GPURenderPassDescriptor = {
          label           : 'canvas render pass',
          colorAttachments: [
            {
              view      : context!.getCurrentTexture().createView(),
              clearValue: [1, 1, 1, 0.0],
              loadOp    : 'clear',
              storeOp   : 'store',
            },
          ],
        };
        
        const encoder = device!.createCommandEncoder();
        
        {
          const pass = encoder.beginComputePass({
            label: 'simulation pass',
          });
          simulation.encodeTo(pass);
          pass.end();
        }
        
        {
          const pass = encoder.beginRenderPass(renderPassDescriptor);
          rendering.encodeTo(pass, simulation.buffer, ball, simulation.num);
          pass.end();
        }
        
        const command = encoder.finish();
        device!.queue.submit([command]);
        
        requestAnimationFrame(render);
      }
      
      render();
    }
  }
})();