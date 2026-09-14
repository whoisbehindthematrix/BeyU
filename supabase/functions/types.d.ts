/** Editor-only Deno globals for Cursor's TypeScript checker. Deno LSP ignores this file. */
declare namespace Deno {
  function serve(
    handler: (request: Request) => Response | Promise<Response>
  ): void;
  function readTextFile(path: string | URL): Promise<string>;

  namespace env {
    function get(key: string): string | undefined;
  }
}
