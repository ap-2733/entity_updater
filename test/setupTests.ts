import { server } from "./server";

beforeAll(() => {
  server.listen();
});

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});
