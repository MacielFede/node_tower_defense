// Dev-time shim so TypeScript/linting works even before `npm install`.
// Once `phaser` is installed, its real types will take precedence.
declare module "phaser" {
  const Phaser: any;
  export default Phaser;
}
