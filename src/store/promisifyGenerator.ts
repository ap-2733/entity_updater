type IdleGenerator<T> = Generator<void, T, number>;

interface PromisifyGeneratorOptions {
  timeout?: number;
}

/**
 * Runs a generator incrementally using requestIdleCallback until completion.
 * Resolves with the generator's return value.
 */
export function promisifyGenerator<T>(
  generator: IdleGenerator<T>,
  options?: PromisifyGeneratorOptions,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {

    function run(deadline: IdleDeadline): void {
      try {
        let timeRemaining = deadline.timeRemaining();
        while (timeRemaining > 0 || deadline.didTimeout) {
          const result = generator.next(timeRemaining);

          if (result.done) {
            resolve(result.value);
            return;
          }
          timeRemaining = deadline.timeRemaining();
        }
        requestIdleCallback(run, {
          timeout: options?.timeout,
        });
      } catch (error) {
        reject(error);
      }
    }

    requestIdleCallback(run, {
      timeout: options?.timeout,
    });
  });
}
