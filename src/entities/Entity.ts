export abstract class Entity {
  constructor(
    public readonly id: string,
    public x: number,
    public z: number
  ) {}
}