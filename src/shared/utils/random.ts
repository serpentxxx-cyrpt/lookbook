class Chance {
  integer(options: { min: number; max: number }): number {
    return (
      Math.floor(Math.random() * (options.max - options.min + 1)) + options.min
    );
  }

  bool(options: { likelihood: number }): boolean {
    return Math.random() * 100 < options.likelihood;
  }
}

export const random = new Chance();
