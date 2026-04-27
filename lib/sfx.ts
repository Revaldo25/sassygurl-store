export function playUiSound(src: string) {
  if (typeof window === "undefined") return;
  const audio = new Audio(src);
  audio.volume = 0.35;
  void audio.play().catch(() => {});
}
