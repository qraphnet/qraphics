@group(0) @binding(0) var<storage, read_write> states: array<f32>;

@group(0) @binding(1) var<storage, read> k_1: array<f32>;
@group(0) @binding(2) var<storage, read> k_2: array<f32>;
@group(0) @binding(3) var<storage, read> k_3: array<f32>;
@group(0) @binding(4) var<storage, read> k_4: array<f32>;

override interval: f32;

const four_pi: f32 = 4 * 3.14159265358979323846264338327950288;

@compute @workgroup_size(1)
fn step(@builtin(global_invocation_id) global_invocation_id: vec3u) {
  let i = global_invocation_id.x;
  var next: f32 = states[i] + (k_1[i] + 2.0 * k_2[i] + 2.0 * k_3[i] + k_4[i]) / 6.0 * interval;

  while (next > four_pi) {
    next -= four_pi;
  }
  while (next < -four_pi) {
    next += four_pi;
  }

  states[i] = next;
}
