/**
 * Start the photobooth retention sweep once per Node server instance.
 *
 * Every session-scoped read also rejects expired rows, so access never outlives
 * the TTL. This timer additionally removes the stored preview and photos when
 * the room is no longer being polled.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { sweepExpiredSessions } = await import("./lib/photobooth");
  const runtime = globalThis as typeof globalThis & {
    __photoboothCleanupTimer?: ReturnType<typeof setInterval>;
  };

  if (runtime.__photoboothCleanupTimer) return;
  void sweepExpiredSessions();
  runtime.__photoboothCleanupTimer = setInterval(() => {
    void sweepExpiredSessions();
  }, 10 * 60 * 1000);
  runtime.__photoboothCleanupTimer.unref?.();
}
