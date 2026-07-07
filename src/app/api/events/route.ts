import { getStore } from "@/lib/store/inventory-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const store = getStore();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      send({
        type: "init",
        payload: {
          metrics: store.getDashboardMetrics(),
          alerts: store.getAlerts(false).slice(0, 5),
        },
        timestamp: new Date().toISOString(),
      });

      const unsubscribe = store.subscribe((event) => {
        try {
          send(event);
        } catch {
          unsubscribe();
        }
      });

      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          clearInterval(heartbeat);
          unsubscribe();
        }
      }, 15000);

      const cleanup = () => {
        clearInterval(heartbeat);
        unsubscribe();
      };

      // @ts-expect-error - cancel exists on ReadableStreamDefaultController in runtime
      controller.signal?.addEventListener?.("abort", cleanup);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
