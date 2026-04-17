import { useRef, useCallback } from 'react';
import { Pose } from '@mediapipe/pose';
import type { Results } from '@mediapipe/pose';
import { Camera } from '@mediapipe/camera_utils';

export function usePose(onResults: (results: Results) => void) {
  const poseRef   = useRef<Pose | null>(null);
  const cameraRef = useRef<Camera | null>(null);

  const start = useCallback(async (videoEl: HTMLVideoElement) => {
    poseRef.current = new Pose({
      locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${f}`,
    });
    poseRef.current.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
    poseRef.current.onResults(onResults);

    cameraRef.current = new Camera(videoEl, {
      onFrame: async () => {
        if (poseRef.current) await poseRef.current.send({ image: videoEl });
      },
      width: 640,
      height: 480,
    });
    await cameraRef.current.start();
  }, [onResults]);

  const stop = useCallback(() => {
    cameraRef.current?.stop();
  }, []);

  return { start, stop };
}
