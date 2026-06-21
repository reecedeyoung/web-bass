export interface InputSource {
  connect(): void | Promise<void>
  disconnect(): void
}
