#[path = "../src/infrastructure/frame_reader.rs"]
mod frame_reader;
use std::io::Cursor;

#[test]
fn fragmented_read_and_eof_are_bounded() {
    let mut input = Cursor::new(b"first\nsecond\n");
    assert_eq!(frame_reader::read_frame(&mut input).unwrap(), Some("first".into()));
    assert_eq!(frame_reader::read_frame(&mut input).unwrap(), Some("second".into()));
    assert_eq!(frame_reader::read_frame(&mut input).unwrap(), None);
}

#[test]
fn oversized_and_truncated_frames_are_rejected() {
    assert!(frame_reader::read_frame(&mut Cursor::new(vec![65; 65_538])).is_err());
    assert!(frame_reader::read_frame(&mut Cursor::new(b"incomplete")).is_err());
}
