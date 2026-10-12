use std::io::{BufRead, Read};

pub const MAX_FRAME_BYTES: usize = 65_536;

pub fn read_frame(reader: &mut impl BufRead) -> Result<Option<String>, String> {
    let mut buffer = Vec::new();
    reader.take((MAX_FRAME_BYTES + 2) as u64)
        .read_until(b'\n', &mut buffer).map_err(|_| "SIDECAR_READ_FAILED")?;
    if buffer.is_empty() { return Ok(None); }
    if buffer.len() > MAX_FRAME_BYTES + 1 || buffer.last() != Some(&b'\n') {
        return Err("SIDECAR_PROTOCOL_ERROR".into());
    }
    buffer.pop();
    String::from_utf8(buffer).map(Some).map_err(|_| "SIDECAR_PROTOCOL_ERROR".into())
}
