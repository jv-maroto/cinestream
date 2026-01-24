import subprocess
import json
import os
from typing import Dict, List, Tuple, Optional
import cv2
import numpy as np


class FFmpegProcessor:
    """Process video files using FFmpeg and OpenCV"""

    @staticmethod
    def get_video_metadata(video_path: str) -> Dict:
        """Extract metadata from video file using FFprobe"""
        try:
            cmd = [
                'ffprobe',
                '-v', 'quiet',
                '-print_format', 'json',
                '-show_format',
                '-show_streams',
                video_path
            ]

            result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
            data = json.loads(result.stdout)

            video_stream = None
            audio_stream = None

            for stream in data.get('streams', []):
                if stream.get('codec_type') == 'video' and not video_stream:
                    video_stream = stream
                elif stream.get('codec_type') == 'audio' and not audio_stream:
                    audio_stream = stream

            format_info = data.get('format', {})

            metadata = {
                'duration': float(format_info.get('duration', 0)),
                'file_size': int(format_info.get('size', 0)),
                'bitrate': int(format_info.get('bit_rate', 0)),
            }

            if video_stream:
                metadata.update({
                    'width': video_stream.get('width'),
                    'height': video_stream.get('height'),
                    'codec': video_stream.get('codec_name'),
                    'fps': eval(video_stream.get('r_frame_rate', '0/1')) if '/' in str(video_stream.get('r_frame_rate', '0')) else float(video_stream.get('r_frame_rate', 0)),
                })

            if audio_stream:
                metadata.update({
                    'audio_codec': audio_stream.get('codec_name'),
                    'audio_channels': audio_stream.get('channels'),
                })

            return metadata

        except Exception as e:
            print(f"Error getting video metadata: {e}")
            return {}

    @staticmethod
    def extract_frame_at_timestamp(video_path: str, timestamp: float) -> Optional[np.ndarray]:
        """Extract single frame at specific timestamp"""
        try:
            cap = cv2.VideoCapture(video_path)
            cap.set(cv2.CAP_PROP_POS_MSEC, timestamp * 1000)
            ret, frame = cap.read()
            cap.release()

            if ret:
                return frame
            return None
        except Exception as e:
            print(f"Error extracting frame: {e}")
            return None

    @staticmethod
    def extract_frames(video_path: str, num_frames: int = 10) -> List[Tuple[float, np.ndarray]]:
        """Extract evenly spaced frames from video"""
        frames = []

        try:
            cap = cv2.VideoCapture(video_path)
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            fps = cap.get(cv2.CAP_PROP_FPS)
            duration = total_frames / fps if fps > 0 else 0

            if duration <= 0:
                cap.release()
                return frames

            # Calculate timestamps
            interval = duration / (num_frames + 1)
            timestamps = [interval * (i + 1) for i in range(num_frames)]

            for ts in timestamps:
                cap.set(cv2.CAP_PROP_POS_MSEC, ts * 1000)
                ret, frame = cap.read()
                if ret:
                    frames.append((ts, frame))

            cap.release()
            return frames

        except Exception as e:
            print(f"Error extracting frames: {e}")
            return frames

    @staticmethod
    def generate_thumbnail(video_path: str, output_path: str, timestamp: Optional[float] = None, width: int = 320) -> bool:
        """Generate thumbnail from video"""
        try:
            cap = cv2.VideoCapture(video_path)
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            fps = cap.get(cv2.CAP_PROP_FPS)
            duration = total_frames / fps if fps > 0 else 0

            # Default to 25% of video
            if timestamp is None:
                timestamp = duration * 0.25

            cap.set(cv2.CAP_PROP_POS_MSEC, timestamp * 1000)
            ret, frame = cap.read()
            cap.release()

            if not ret:
                return False

            # Resize maintaining aspect ratio
            h, w = frame.shape[:2]
            new_height = int(h * width / w)
            resized = cv2.resize(frame, (width, new_height))

            # Save
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            cv2.imwrite(output_path, resized)
            return True

        except Exception as e:
            print(f"Error generating thumbnail: {e}")
            return False
