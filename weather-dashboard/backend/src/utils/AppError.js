// An error we expect and know how to describe to the browser.
export class AppError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = "AppError";
    this.status = status; // HTTP status sent to the browser
    this.code = code; // stable machine-readable code the frontend switches on
  }
}