struct VSOutput {
  @builtin(position) position: vec4f,
  @location(0) color: vec4f,
};

@group(0) @binding(0) var<uniform> scale: vec2f;

@vertex fn vs(@location(0) angle: f32, @location(1) local_pos: vec2f) -> VSOutput {
  let position = 0.5 * vec2f(cos(angle), sin(angle)) + 0.02 * local_pos;
  var color: vec4f;
  if local_pos.x == 0.0 && local_pos.y == 0.0 {
    color = vec4f(0.0, 0.0, 0.0, 1.0);
  } else {
    color = vec4f(1.0, 1.0, 1.0, 0.0);
  }

  var vsOut: VSOutput;
  vsOut.position = vec4f(position * scale, 0.0, 1.0);;
  vsOut.color = color;

  return vsOut;
}

@fragment fn fs(@location(0) color: vec4f) -> @location(0) vec4f {
  return color;
}