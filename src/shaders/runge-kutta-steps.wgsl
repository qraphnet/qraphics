const k_1: f32 = 0.1;
const k_2: f32 = 0.1;

@group(0) @binding(0) var<storage, read> states: array<f32>;
@group(0) @binding(1) var<storage, read_write> k_present: array<f32>;
@group(0) @binding(2) var<storage, read_write> k_next: array<f32>;

@group(1) @binding(0) var<uniform> n: u32;
@group(1) @binding(1) var<uniform> gravity: vec2f;

override weight: f32;

@compute @workgroup_size(1)
fn step(@builtin(global_invocation_id) global_invocation_id: vec3u) {
  let i = global_invocation_id.x;
  let angle_i = states[i * 2] + weight * k_present[i * 2];
  let dot_angle_i = states[i * 2 + 1] + weight * k_present[i * 2 + 1];

  var force: f32 = 0;
  for (var j = 0u; j < n; j += 1) {
    if (j == i) {
      continue;
    }
    let angle_j = states[j * 2] + weight * k_present[j * 2];
    let delta = (angle_i - angle_j) / 2.0;
    let force_i = 1.0 / (abs(sin(delta)) * tan(delta));
    force += k_1 * force_i;
  }
  force = force - gravity.x * sin(angle_i) + gravity.y * cos(angle_i) - k_2 * dot_angle_i;

  k_next[i * 2] = dot_angle_i;
  k_next[i * 2 + 1] = force;
}