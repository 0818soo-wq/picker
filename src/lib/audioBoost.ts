let sharedContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!sharedContext) {
    sharedContext = new AudioContext();
  }
  if (sharedContext.state === "suspended") {
    sharedContext.resume().catch(() => {});
  }
  return sharedContext;
}

// 사장님 음성(TTS)이 인트로 영상 소리보다 작게 녹음되어 있어, Web Audio API의
// GainNode로 재생 볼륨을 원본보다 크게 증폭합니다. HTMLAudioElement의 volume은
// 최대 1(원본 크기)까지만 가능해 이 용도로는 부족합니다.
// 주의: 오디오 엘리먼트 하나당 한 번만 연결할 수 있으므로, 새로 만든
// Audio 객체에 한 번만 호출해야 합니다.
export function boostAudioVolume(audio: HTMLAudioElement, gain = 1.6): void {
  try {
    const ctx = getAudioContext();
    const source = ctx.createMediaElementSource(audio);
    const gainNode = ctx.createGain();
    gainNode.gain.value = gain;
    source.connect(gainNode).connect(ctx.destination);
  } catch (err) {
    console.error("[audioBoost] 볼륨 증폭 실패", err);
  }
}
